import Minter from './minter'
import Metamask from './metamask'
import Verifier from './verifier'
import Avatar from './avatar'
import Portfolio from './portfolio'
import { useState, useEffect } from 'react'
import { log } from '../modules/helpers'
import { useAddress } from '../modules/web3'
import { Routes, Route, useNavigate } from 'react-router-dom'


function Router() {

	// ///////////////////////////////
	// States
	// ///////////////////////////////
	const address = useAddress()
	const navigate = useNavigate()
	const [ timer, setTimer ] = useState(  )

	// ///////////////////////////////
	// Lifecycle
	// ///////////////////////////////

	// Redirect if metamask not connected
	useEffect( f => {

		log( 'Address change' )

		if( timer ) {
			log( `cancelling old timer ${ timer }, address: ${ !!address }` )
			clearTimeout( timer )
		}
		if( !address ) {
			log( 'No address, setting timer for navigation' )
			const timeoutNumber = setTimeout( f => {
				log( 'Navigating away' )
				navigate( '/' )
			}, 1000 )
			setTimer( timeoutNumber )
		}

	}, [ address, navigate, timer ] )

	// ///////////////////////////////
	// Rendering
	// ///////////////////////////////
	return <Routes>
			
		<Route exact path='/' element={ <Metamask /> } />
		<Route exact path='/mint' element={ <Minter /> } />
		<Route path='/verify/' element={ <Verifier /> }>
			<Route path='/verify/:verificationCode' element={ <Verifier /> } />
		</Route>
		<Route exact path='/avatar' element={ <Avatar /> } />
		<Route exact path='/portfolio' element={ <Portfolio /> } />

	</Routes>

}

export default Router;
