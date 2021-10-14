import './App.css'

import { useState, useEffect } from 'react'

function App() {

	const [ loading, setLoading ] = useState( 'Detecting metamask...' )
	const [ error, setError ] = useState( undefined )
	const [ address, setAddress ] = useState( undefined )

	// ///////////////////////////////
	// Functions
	// ///////////////////////////////
	async function metamasklogin() {

		try {

			setLoading( 'Connecting to Metamask' )
			const [ address ] = await window.ethereum.request({ method: 'eth_requestAccounts' })
			setAddress( address )

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
	useEffect( f => {

		// if no web3, stop
		if( !window.ethereum ) return setError( 'No web3 provider detected, please install metamask' )
		setLoading( false )

	}, [] )

	// Render error if it exists
	if( error ) return <main>
		<p>{ error }</p>
	</main>

	// Render loading indicator
	if( loading ) return <main>
		<p>{ loading }</p>
	</main>

	// No address known? Show connect button
	if( !address ) return <main>
		<button onClick={ metamasklogin }>Connect Metamask</button>
	</main>


	// Render main interface
	return (
		<main>

			<p>Logged in as ${ address }</p>

		</main>
	);
}

export default App;
