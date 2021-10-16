import Fox from './assets/metamask-fox.svg'
// import LaunchBackground from './assets/undraw_To_the_stars_qhyy.svg'
import LaunchBackground from './assets/undraw_relaunch_day_902d-fixed.svg'
import './App.css'

import { useState, useEffect } from 'react'

import { getAddress, useAddress, useTotalSupply, useContract } from './modules/web3'
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
	async function metamasklogin( e ) {

		e.preventDefault()

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

	async function mintRocketeer( e ) {

		e.preventDefault()

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

	// Initialisation interface
	if( error || loading || !address ) return <main>
		{ error && <p>{ error }</p> }
		{ loading && <p>{ loading }</p> }
		{ !address && ( !error && !loading ) && <div className="container">

			<h1>Rocketeer Minter</h1>
			<p>This interface is used to mint new Rocketeer NFTs. Minting is free, except for the gas fees. After minting you can view your new Rocketeer and its attributes on Opensea.</p>

			<a className="button" href="/#" onClick={ metamasklogin }>
				<img alt="metamask fox" src={ Fox } />
				Connect wallet
			</a>

		</div> }
	</main>

	// Render main interface
	return (
		<main>

			<div className="container">


				<h1>Rocketeer Minter</h1>
				<p>We are ready to mint! There are currently { totalSupply } minted Rocketeers.</p>

				<label for='address'>Minting to:</label>
				<input id='address' value={ address } disabled />
				{ contract && <a className="button" href="/#" onClick={ mintRocketeer }>
					<img alt="metamask fox" src={ Fox } />
					Mint new Rocketeer
				</a> }

				


			</div>

			<img className="stretchBackground" src={ LaunchBackground } alt="Launching rocket" />

		</main>
	);
}

export default App;
