import Container from './components/atoms/Container'
import { useState, useEffect } from 'react'
import { HashRouter} from 'react-router-dom'
import Router from './components/router'
import Theme from './components/atoms/Theme'


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

	return <Theme>
		<HashRouter>
		
			{ error || loading ? <Container> <p>{ error || loading }</p> </Container> : <Router /> }

		</HashRouter>
	</Theme>

}

export default App;
