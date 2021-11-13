import Minter from './components/minter'
import Metamask from './components/metamask'
import Verifier from './components/verifier'
import Avatar from './components/avatar'
import Portfolio from './components/portfolio'
import { Container } from './components/generic'
import { useState, useEffect } from 'react'
import { log } from './modules/helpers'
import { useAddress, getAddress } from './modules/web3'
import { HashRouter, Routes, Route } from 'react-router-dom'


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
		
		<Routes>
			
			<Route exact path='/' element={ <Metamask /> } />
			<Route exact path='/mint' element={ <Minter /> } />
			<Route path='/verify/' element={ <Verifier /> }>
				<Route path='/verify/:verificationCode' element={ <Verifier /> } />
			</Route>
			<Route exact path='/avatar' element={ <Avatar /> } />
			<Route exact path='/portfolio' element={ <Portfolio /> } />

		</Routes>

	</HashRouter>

}

export default App;
