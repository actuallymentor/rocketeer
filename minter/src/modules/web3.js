import { useState, useEffect } from "react"
import useInterval from 'use-interval'
import { log, setListenerAndReturnUnlistener } from './helpers'

// Ethers and web3 sdk
import { ethers } from "ethers"

// Convenience objects
const { providers: { Web3Provider }, Contract, utils: { verifyMessage } } = ethers
export const provider = window.ethereum && new Web3Provider( window.ethereum )
export const signer = provider && provider.getSigner()

/* ///////////////////////////////
// Wallet interactors
// /////////////////////////////*/
export async function sign( message, signatory ) {

	const signature = await signer.signMessage( message )
	log( `Signed ${ message } to ${ signature }` )
	const verifiedSignatory = verifyMessage( message, signature ).toLowerCase()
	log( `Message was signed by ${ verifiedSignatory }. Signature validity: `, signatory === verifiedSignatory )
	return {
		message,
		signature,
		signatory
	}

}

// ///////////////////////////////
// Chain interactors
// ///////////////////////////////

// Get address through metamask
export async function getAddress() {

	// Check if web3 is exposed
	if( !window.ethereum ) throw new Error( 'No web3 provider detected, please install metamask' )

	// Get the first address ( which is the selected address )
	const [ address ] = await window.ethereum.request( { method: 'eth_requestAccounts' } )

	return address

}

// Address hook
export function useAddress() {

	const [ address, setAddress ] = useState( undefined )
	const [ interval, setInterval ] = useState( 1000 )
	const [ timesChecked, setTimesChecked ] = useState( 0 )

	useInterval( () => {

		setTimesChecked( timesChecked+1 )
		log( 'Checking for address' )
		if( window.ethereum && window.ethereum.selectedAddress ) {
			setAddress( window.ethereum.selectedAddress )
			return setInterval( null )
		}

		// if checked five times and interval still running, slow it down
		if( timesChecked > 5 && !!interval ) setInterval( 5000 )

	}, interval )

	// Set initial value if known
	useEffect( f => {
		log( 'useAddress setting: ', window.ethereum && window.ethereum.selectedAddress, ` based on `, window.ethereum )
		if( window.ethereum && window.ethereum.selectedAddress ) {
			setAddress( window.ethereum.selectedAddress )
			setInterval( null )
		}
	}, [] )

	// Create listener to accounts change
	useEffect( f => setListenerAndReturnUnlistener( window.ethereum, 'accountsChanged', addresses => {
			log( 'Addresses changed to ', addresses )
			const [ newAddress ] = addresses

			// No new address? Change nothing
			if( !newAddress ) return

			// New address? Set it to state and stop interval
			setAddress( newAddress )
			setInterval( null )
			
	} ), [ ] )


	return address

}

// Totl supply hook
export function useTotalSupply() {

	const [ supply, setSupply ] = useState( 'loading' )
	const contract = useContract( )

	// Create listener to minting
	useEffect( f => {

		// Do nothing if there is not contract object
		if( !contract ) return

		// Load initial supply value
		( async (  ) => {

			try {

				const supply = await contract.totalSupply()
				log( 'Initial supply detected: ', supply )
				setSupply( supply.toString() )

			} catch( e ) {

				log( 'Error getting initial supply: ', e )

			}

		} )(  )

		// Listen to token transfers andor mints
		return setListenerAndReturnUnlistener( contract, 'Transfer', async ( from, to, amount, event ) => {
			
			try {

				log( `Transfer ${ from } sent to ${ to } `, amount, event )
				const supply = await contract.totalSupply()
				log( 'Got supply from contract: ', supply )
				setSupply( supply.toString() )

			} catch( e ) {
				log( 'Error getting supply from contract: ', e )
			}

		} )


	}, [ contract ] )

	return supply

}

// Balance hook
export function useBalanceOf() {

	const [ balance, setBalance ] = useState( 'loading' )
	const contract = useContract()
	const address = useAddress()

	// Create listener to minting
	useEffect( f => {

		// Do nothing if there is not contract object
		if( !contract || !address ) return

		// Load initial supply value
		( async (  ) => {

			try {

				const balance = await contract.balanceOf( address )
				log( 'Balance detected: ', balance, `(${ balance.toString() })` )
				setBalance( balance.toString() )

			} catch( e ) {

				log( 'Error getting balance: ', e )

			}

		} )(  )


	}, [ contract, address ] )

	return balance

}

// Chain ID hook
export function useChainId() {

	const [ chain, setChain ] = useState( undefined )

	// Create listener to chain change
	useEffect( f => setListenerAndReturnUnlistener( window.ethereum, 'chainChanged', chainId => {
		log( 'Chain changed to ', chainId )
		setChain( chainId )
	} ), [] )

	// Initial chain detection
	useEffect( f => {

		// Check for initial chain and set to state
		( async () => {

			if( !window.ethereum ) return
			const initialChain = await window.ethereum.request( { method: 'eth_chainId' } )
			log( 'Initial chain detected as ', initialChain )
			setChain( initialChain )

		} )(  )

	}, [] )

	return chain

}

// Token ids of owner hook
export function useTokenIds() {

	// Deps
	const address = useAddress()
	const contract = useContract()
	const balance = useBalanceOf()

	// State
	const [ tokens, setTokens ] = useState( [] )

	// Grab tokens from contract
	useEffect( f => {

		// Do nothing if there is no data yet
		if( !contract || !balance || !address ) return

		// Load initial supply value
		( async (  ) => {

			try {

				const ids = await Promise.all( Array.from( { length: balance } ).map( async ( val, index ) => {
					const id = await contract.tokenOfOwnerByIndex( address, index )
					return id.toString()
				} ) )
				log( 'Tokens detected: ', ids )
				setTokens( ids )

			} catch( e ) {

				log( 'Error getting tokens of address: ', e )

			}

		} )(  )


	}, [ contract, address, balance ] )

	return tokens

}

// ///////////////////////////////
// Contract interactors
// ///////////////////////////////
const contractAddressByChainId = {
	'0x1': '0xb3767b2033CF24334095DC82029dbF0E9528039d',
	// '0x4': '0x2829ba9d76e675b8867E1707A9aB49B280D916c6', // Old
	'0x4': '0x95d6b9549315212D3FDce9FdCa9d80978b8bB41D'
}

// Contract ABI with only totalSupply, balanceOf and Transfer
const ABI = [
	{
      "inputs": [],
      "name": "totalSupply",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "Transfer",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_to",
          "type": "address"
        }
      ],
      "name": "spawnRocketeer",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "index",
          "type": "uint256"
        }
      ],
      "name": "tokenOfOwnerByIndex",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    }
]

// Contract custom hook
export function useContract() {

	const chainId = useChainId()
	const [ contract, setContract ] = useState( undefined )
	const address = useAddress()

	useEffect( f => {

		try {

			// If no chain id is known, stop
			if( !chainId ) return

			// Generate contract interface for this chain ID
			log( `Generating new contract with chain ${ chainId } and address `, contractAddressByChainId[ chainId ] )
			const newContract = new Contract( contractAddressByChainId[ chainId ], ABI, signer )

			// Set new contract to state
			setContract( newContract )
			log( 'New contract interface initialised: ', newContract )

		} catch( e ) {
			alert( `Blockchain error: ${ e.message || JSON.stringify( e ) }` )
			log( 'Error generating contract: ', e )
			setContract( undefined )
		}

	}, [ chainId, address ] )

	return contract

}

export function rocketeerCollectionUriOnOpensea( chainId ) {

	// Opensea collection link depending on network
	return `${ chainId === '0x1' ? '' : 'testnets.' }opensea.io/collection/rocketeer`

}

export function rocketeerUriOnOpensea( chainId, tokenId ) {

	// Opensea specific link depending on network
	return `https://${ chainId === '0x1' ? '' : 'testnets.' }opensea.io/assets/${ contractAddressByChainId[ chainId ] }/${ tokenId }`
	
}

