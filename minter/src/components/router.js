import Minter from './minter'
import Metamask from './metamask'
import Verifier from './verifier'
import Avatar from './avatar'
import Portfolio from './portfolio'
import { Container } from './generic'
import { useState, useEffect } from 'react'
import { log } from '../modules/helpers'
import { useAddress, getAddress } from '../modules/web3'
import { Routes, Route, useNavigate } from 'react-router-dom'


function Router() {

	// ///////////////////////////////
	// States
	// ///////////////////////////////
	const address = useAddress()
	const navigate = useNavigate()
	// ///////////////////////////////
	// Lifecycle
	// ///////////////////////////////
	useEffect( f => {
		log( 'Address change' )
		if( !address ) navigate( '/' )
	}, [ address, navigate ] )

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
