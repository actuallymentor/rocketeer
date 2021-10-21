import { Container } from './generic'
import '../App.css'

import { useState, useEffect } from 'react'
import { log } from '../modules/helpers'
import { useAddress, useChainId, useBalanceOf } from '../modules/web3'

export default function Verifier() {

	// ///////////////////////////////
	// State management
	// ///////////////////////////////
	const balance = useBalanceOf()
	const chainId = useChainId()
	const address = useAddress()
	const [ username, setUsername ] = useState( )
	const [ verifyUrl, setVerifyUrl ] = useState()
	const [ message, setMessage ] = useState()

	// ///////////////////////////////
	// Functions
	// ///////////////////////////////
	function showVerificationUrl( e ) {

		e.preventDefault()

		if( !username ) return alert( 'Please fill in your Discord username to get verified' )
		if( balance < 1 ) return alert( `The address ${ address } does not own Rocketeers, did you select the right address?` )

		const baseUrl = `https://mint.rocketeer.fans/?mode=verify`
		const message = btoa( `{ "username": "${ username }", "address": "${ address }", "balance": "${ balance }" }` )

		setVerifyUrl( baseUrl + `&message=${ message }` )

	}

	function verifyIfNeeded() {

		log( 'Check the need to verify' )

		if( !window.location.href.includes( 'message' ) ) return

		try {

			log( 'Verification started' )

			const { search } = window.location
			const query = new URLSearchParams( search )
			const message = query.get( 'message' )
			const verification = atob( message )
			log( 'Received message: ', verification )
			const json = JSON.parse( verification )

			log( 'Showing status for ', json )

			return setMessage( json )

		} catch( e ) {

			log( e )
			return alert( 'Verification error, contact the team on Discord' )

		}
	}

	// ///////////////////////////////
	// Lifecycle
	// ///////////////////////////////
	useEffect( f => {
		log( 'Triggering verification check and popstate listener' )
		verifyIfNeeded()
		return window.addEventListener( 'popstate', verifyIfNeeded )
	}, [] )

	// ///////////////////////////////
	// Rendering
	// ///////////////////////////////
	log('Rendering with ', message, verifyUrl )
	if( message ) return <Container>
		{ message.balance > 0 && <p>✅ { message.username } has { message.balance } Rocketeers on chain { chainId }</p> }
		{ message.balance < 1 && <p>🛑 Computer says no</p> }
		<p>Something went wrong, contact #support in Discord</p>
	</Container>

	if( verifyUrl ) return <Container>
		
		<h1>Verification URL</h1>
		<p>Post this in the Discord channel #get-verified:</p>
		<p>{ verifyUrl }</p>

	</Container>

	return <Container>

		<h1>Verify your hodlr status</h1>
		<p>Verify your Rocketeer status by logging in with your wallet. This does NOT trigger a transaction. Therefore it is free.</p>
		<input onChange={ e => setUsername( e.target.value ) } type="text" placeholder="Your Discord username" />
		<a onClick={ showVerificationUrl } href="/#" className="button">Verify</a>
		
	</Container>
}