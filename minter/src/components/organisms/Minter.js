import Fox from '../../assets/metamask-fox.svg'

import Container from '../atoms/Container'
import { H1, Text } from '../atoms/Text'
import Button from '../atoms/Button'
import Input from '../molecules/Input'
import Loading from '../molecules/Loading'

import { useState, useEffect } from 'react'

import { useAddress, useTotalSupply, useContract, useChainId } from '../../modules/web3'
import { log, setListenerAndReturnUnlistener } from '../../modules/helpers'

export default function Minter() {

	// ///////////////////////////////
	// States
	// ///////////////////////////////
	const [ loading, setLoading ] = useState( false )
	const [ error, setError ] = useState( undefined )
	const [ mintedTokenId, setMintedTokenId ] = useState( undefined )
	const [ txHash, setTxhash ] = useState( null )
	const totalSupply = useTotalSupply(  )
	const address = useAddress()
	const chainId = useChainId()

	// Handle contract interactions
	const contract = useContract()

	// ///////////////////////////////
	// Functions
	// ///////////////////////////////

	async function mintRocketeer( e ) {

		e.preventDefault()

		return alert( `Sorry, all Rocketeers have been minted!` )

		try {

			if( !address ) setError( 'No destination address selected' )
			setLoading( 'Confirm transaction in metamask' )
			const response = await contract.spawnRocketeer( address )
			log( 'Successful mint with: ', response )
			setTxhash( response.hash )
			setLoading( 'Waiting for confirmations...' )

		} catch( e ) {
			log( 'Minting error: ', e )
			alert( `Minting error: ${ e.message }` )
			setLoading( false )
		}

	}

	// ///////////////////////////////
	// Lifecycle
	// ///////////////////////////////
	useEffect( f => setListenerAndReturnUnlistener( contract, 'Transfer', async ( from, to, amount, event ) => {
			
		try {

			// Get confirmation details
			log( `useEffect: Transfer ${ from } sent to ${ to } `, amount, event )
			const [ transFrom, transTo, tokenId ] = event.args
			const id = tokenId.toString()

			// Trigger remote generation
			const rocketeer = await fetch( `https://rocketeer.fans/${ chainId === '0x1' ? 'api' : 'testnetapi'}/rocketeer/${id}` ).then( res => res.json() )
			log( 'Oracle returned: ', rocketeer )

			// Set token to state
			setMintedTokenId( id )
			setLoading( false )

		} catch( e ) {
			log( 'Error getting Transfer event from contract: ', e )
		}

	} ), [ contract, loading, chainId ] )

	// ///////////////////////////////
	// Rendering
	// ///////////////////////////////

	if( error || loading ) return <Loading message={ error || loading }>
		{ txHash && <Button to={ `https://${ chainId === '0x1' ? 'etherscan' : 'rinkeby.etherscan' }.io/tx/${ txHash }` }>View tx on Etherscan</Button> }
	</Loading>

	if( mintedTokenId ) return <Container>

			<H1>Minting Successful!</H1>
			<Button to='/portfolio'>View your Rocketeers</Button>

	</Container>

	// Render main interface
	return (
		<Container>

				<H1>Rocketeer Minter</H1>
				<Text>We are ready to mint! There are currently { totalSupply } minted Rocketeers.</Text>


				<Input label="Minting to:" id="address" value={ address } info="This is the currently selected address in your Metamask" disabled />

				{ contract && <Button icon={ Fox } onClick={ mintRocketeer }>
					Mint new Rocketeer
				</Button> }


		</Container>
	)
}

