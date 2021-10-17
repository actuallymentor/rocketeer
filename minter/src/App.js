import Fox from './assets/metamask-fox.svg'
// import LaunchBackground from './assets/undraw_To_the_stars_qhyy.svg'
// import LaunchBackground from './assets/undraw_relaunch_day_902d-fixed.svg'
import LaunchBackground from './assets/undraw_launch_day_4e04.svg'
import './App.css'

import { useState, useEffect } from 'react'

import { getAddress, useAddress, useTotalSupply, useContract, useChainId, rocketeerUriOnOpensea } from './modules/web3'
import { log, setListenerAndReturnUnlistener } from './modules/helpers'

const Container = ( { children } ) => <main>

	<div className="container">

		{ children }

	</div>

	<img className="stretchBackground" src={ LaunchBackground } alt="Launching rocket" />

</main>

function App() {

	// ///////////////////////////////
	// States
	// ///////////////////////////////
	const [ loading, setLoading ] = useState( 'Detecting metamask...' )
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

	// Check for metamask on load
	useEffect( f => window.ethereum ? setLoading( false ) : setError( 'No web3 provider detected, please install metamask' ), [] )

	// ///////////////////////////////
	// Rendering
	// ///////////////////////////////

	// Initialisation interface
	if( error || loading || !address ) return <Container>
		{ error && <p>{ error }</p> }
		{ loading && <div className="loading">
			
			<div className="lds-dual-ring"></div>
			<p>{ loading }</p>

		</div> }
		{ !address && ( !error && !loading ) && <>

			<h1>Rocketeer Minter</h1>
			<p>This interface is used to mint new Rocketeer NFTs. Minting is free, except for the gas fees. After minting you can view your new Rocketeer and its attributes on Opensea.</p>

			<a className="button" href="/#" onClick={ metamasklogin }>
				<img alt="metamask fox" src={ Fox } />
				Connect wallet
			</a>

		</> }
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


			<img className="stretchBackground" src={ LaunchBackground } alt="Launching rocket" />

		</Container>
	)
}

export default App;
