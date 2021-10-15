import './App.css'

import { useState, useEffect } from 'react'

import { getAddress, useAddress, useTotalSupply, useContract, signer } from './modules/web3'
import { log } from './modules/helpers'

function App() {

	// ///////////////////////////////
	// States
	// ///////////////////////////////
	const [ loading, setLoading ] = useState( 'Detecting metamask...' )
	const [ error, setError ] = useState( undefined )
	const totalSupply = useTotalSupply(  )
	const address = useAddress()

	// Handle contract interactions
	const contract = useContract()

	// ///////////////////////////////
	// Functions
	// ///////////////////////////////

	// Handle user login interaction
	async function metamasklogin() {

		try {

			setLoading( 'Connecting to Metamask' )
			const address = await getAddress()
			log( 'Received: ', address )

		} catch( e ) {
			setError( `Metamask error: ${ e.message || JSON.stringify( e ) }. Please reload the page.` )
		} finally {
			setLoading( false )
		}

	}

	async function mintRocketeer() {

		try {

			if( !address ) setError( 'No destination address selected' )
			setLoading( 'Confirm transaction in metamask' )
			const response = await contract.spawnRocketeer( address )
			log( 'Successful mint with: ', response )

		} catch( e ) {
			log( 'Minting error: ', e )
		} finally {
			setLoading( false )
		}

	}

	// ///////////////////////////////
	// Lifecycle
	// ///////////////////////////////


	// Check for metamask on load
	useEffect( f => window.ethereum ? setLoading( false ) : setError( 'No web3 provider detected, please install metamask' ), [] )

	// ///////////////////////////////
	// Rendering
	// ///////////////////////////////
	log( error, loading, address )
	// Initialisation interface
	if( error || loading || !address ) return <main>
		{ error && <p>{ error }</p> }
		{ loading && <p>{ loading }</p> }
		{ !address && <button onClick={ metamasklogin }>Connect Metamask</button> }
	</main>

	// Render main interface
	return (
		<main>

			<p>Logged in as { address }</p>
			<p>Total minted: { totalSupply }</p>
			{ contract && <button onClick={ mintRocketeer }>Mint new Rocketeer</button> }

		</main>
	);
}

export default App;
