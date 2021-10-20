import Fox from '../assets/metamask-fox.svg'
import { Container } from './generic'
import '../App.css'

import { useState, useEffect } from 'react'

import { useAddress, useTotalSupply, useContract, useChainId, rocketeerUriOnOpensea } from '../modules/web3'
import { log, setListenerAndReturnUnlistener } from '../modules/helpers'

export default function Minter() {

	// ///////////////////////////////
	// States
	// ///////////////////////////////
	const [ loading, setLoading ] = useState( false )
	const [ error, setError ] = useState( undefined )
	const [ mintedTokenId, setMintedTokenId ] = useState( undefined )
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

		try {

			if( !address ) setError( 'No destination address selected' )
			setLoading( 'Confirm transaction in metamask' )
			const response = await contract.spawnRocketeer( address )
			log( 'Successful mint with: ', response )

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

			log( `useEffect: Transfer ${ from } sent to ${ to } `, amount, event )
			const [ transFrom, transTo, tokenId ] = event.args
			setMintedTokenId( tokenId.toString() )
			setLoading( false )

		} catch( e ) {
			log( 'Error getting Transfer event from contract: ', e )
		}

	} ), [ contract, loading ] )

	// ///////////////////////////////
	// Rendering
	// ///////////////////////////////

	if( error || loading ) return <Container>
		{ error && <p>{ error }</p> }
		{ !error && loading && <div className="loading">
			
			<div className="lds-dual-ring"></div>
			<p>{ loading }</p>

		</div> }
	</Container>

	if( mintedTokenId ) return <Container>

			<h1>Minting Successful!</h1>
			<a className="button" rel="noreferrer" target="_blank" alt="Link to opensea details of Rocketeer" href={ rocketeerUriOnOpensea( chainId, mintedTokenId ) }>View on Opensea</a>

	</Container>

	// Render main interface
	return (
		<Container>

				<h1>Rocketeer Minter</h1>
				<p>We are ready to mint! There are currently { totalSupply } minted Rocketeers.</p>

				<label htmlFor='address'>Minting to:</label>
				<input id='address' value={ address } disabled />
				{ contract && <a className="button" href="/#" onClick={ mintRocketeer }>
					<img alt="metamask fox" src={ Fox } />
					Mint new Rocketeer
				</a> }


		</Container>
	)
}

