import { Container } from './components/generic'
import { useState, useEffect } from 'react'
import { HashRouter} from 'react-router-dom'
import Router from './components/router'

function App() {

	// ///////////////////////////////
	// States
	// ///////////////////////////////
	const [ loading, setLoading ] = useState( 'Detecting metamask...' )
	const [ error, setError ] = useState( undefined )
	
	// ///////////////////////////////
	// Lifecycle
	// ///////////////////////////////

	// Check for web3 on load
	useEffect( f => window.ethereum ? setLoading( false ) : setError( 'No web3 provider detected, please install metamask' ), [] )


	// ///////////////////////////////
	// Rendering
	// ///////////////////////////////
	if( error || loading ) return <Container>
		<p>{ error || loading }</p>
	</Container>
	return <HashRouter>
		
		<Router />

	</HashRouter>

}

export default App;
