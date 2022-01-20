import Minter from './organisms/Minter'
import Home from './organisms/Home'
import Verifier from './organisms/Verifier'
import Avatar from './organisms/Avatar'
import Portfolio from './organisms/Portfolio'
import Outfits from './organisms/Outfits'
import Merch from './organisms/Merch'
import { useState, useEffect } from 'react'
import { log } from '../modules/helpers'
import { useAddress } from '../modules/web3'
import { Routes, Route, useNavigate, useParams } from 'react-router-dom'


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

	}, [ address, navigate ] ) // Not adding timer on purpose, causes loop

	// ///////////////////////////////
	// Rendering
	// ///////////////////////////////
	return <Routes>
			
		<Route exact path='/' element={ <Home /> } />
		<Route exact path='/mint' element={ <Minter /> } />
		<Route path='/verify/' element={ <Verifier /> }>
			<Route path='/verify/:verificationCode' element={ <Verifier /> } />
		</Route>
		<Route exact path='/avatar' element={ <Avatar /> } />
		<Route exact path='/portfolio' element={ <Portfolio /> } />
		<Route path='/outfits/' element={ <Outfits /> }>
			<Route path='/outfits/:rocketeerId' element={ <Outfits /> } />
		</Route>

		<Route path='/merch/' element={ <Merch /> }>
			<Route path='/merch/success/:order_id' element={ <Merch /> } />
			<Route path='/merch/:rocketeer_id' element={ <Merch /> } />
		</Route>

	</Routes>

}

export default Router;
