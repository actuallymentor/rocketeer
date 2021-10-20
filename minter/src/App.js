import Minter from './components/minter'
import Verifier from './components/verifier'
import Fox from './assets/metamask-fox.svg'
import { Container } from './components/generic'
import { useState, useEffect } from 'react'
import { log } from './modules/helpers'
import { useAddress, getAddress } from './modules/web3'


function App() {

	// ///////////////////////////////
	// States
	// ///////////////////////////////
	const [ action, setAction ] = useState( undefined )
	const [ loading, setLoading ] = useState( 'Detecting metamask...' )
	const [ error, setError ] = useState( undefined )
	const address = useAddress()


	// ///////////////////////////////
	// Functions
	// ///////////////////////////////
	function checkAction() {

		const verify = window.location.href.includes( 'mode=verify' )
		log( `Location is ${window.location.href}, ${ !verify ? 'not opening' : 'opening' } verifier` )
		
		if( verify ) return setAction( 'verify' )
		return setAction( 'mint' )


	}

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
	
	// ///////////////////////////////
	// Lifecycle
	// ///////////////////////////////

	// Check for metamask on load
	useEffect( f => window.ethereum ? setLoading( false ) : setError( 'No web3 provider detected, please install metamask' ), [] )


	// Check for action on load
	useEffect( f => {
		checkAction()
		window.addEventListener( 'popstate', checkAction )
	}, [] )

	// ///////////////////////////////
	// Rendering
	// ///////////////////////////////
	log( action, error, loading, address )
	// Initialisation interface
	if( error || loading || !address ) return <Container>
		{ error && <p>{ error }</p> }
		{ !error && loading && <div className="loading">
			
			<div className="lds-dual-ring"></div>
			<p>{ loading }</p>

		</div> }
		{ !address && ( !error && !loading ) && <>

			<h1>Rocketeer { action == 'mint' ? 'Minter' : 'Verifier' }</h1>
			{ action == 'mint' && <p>This interface is used to mint new Rocketeer NFTs. Minting is free, except for the gas fees. After minting you can view your new Rocketeer and its attributes on Opensea.</p> }
			{ action == 'verify' && <p>This interface is used to veriy that you are the owner of a Rocketeer</p> }
			<a className="button" href="/#" onClick={ metamasklogin }>
				<img alt="metamask fox" src={ Fox } />
				Connect wallet
			</a>

		</> }
	</Container>

	if( action === 'mint' ) return <Minter />
	if( action === 'verify' ) return <Verifier />
	else return <></>
}

export default App;
