import Container from '../atoms/Container'
import { H1, Text } from '../atoms/Text'
import Button from '../atoms/Button'
import Input from '../molecules/Input'

import { useState, useEffect } from 'react'
import { log } from '../../modules/helpers'
import { useAddress, useChainId, useBalanceOf } from '../../modules/web3'
import { useParams } from 'react-router-dom'

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
	const [ error, setError ] = useState(  )
	const { verificationCode } = useParams()

	// ///////////////////////////////
	// Functions
	// ///////////////////////////////
	function showVerificationUrl( e ) {

		e.preventDefault()

		if( !username ) return alert( 'Please fill in your Discord username to get verified' )
		if( balance < 1 ) return alert( `The address ${ address } does not own Rocketeers, did you select the right address?` )

		const baseUrl = `https://mint.rocketeer.fans/#/verify/`
		const message = btoa( `{ "username": "${ username }", "address": "${ address }", "balance": "${ balance }" }` )

		setVerifyUrl( baseUrl + message )

	}

	// ///////////////////////////////
	// Lifecycle
	// ///////////////////////////////
	useEffect( f => {

		if( !verificationCode ) return

		try {

			const verification = atob( verificationCode )
			log( 'Received message: ', verification )
			const json = JSON.parse( verification )

			log( 'Showing status for ', json )

			return setMessage( json )

		} catch( e ) {

			log( e )
			setError( true )
			return alert( 'Verification error, contact the team on Discord' )

		}
		
	}, [ verificationCode ] )

	// Update verificaiton url
	useEffect( f => {

		if( !username || !address || !balance ) return
		if( !verifyUrl ) return
		if( balance < 1 ) return

		const baseUrl = `https://mint.rocketeer.fans/#/verify/`
		const message = btoa( `{ "username": "${ username }", "address": "${ address }", "balance": "${ balance }" }` )

		setVerifyUrl( baseUrl + message )

	}, [ username, address, balance, verifyUrl ] )

	// ///////////////////////////////
	// Rendering
	// ///////////////////////////////
	log('Rendering with ', message, verifyUrl )
	if( message ) return <Container>
		{ message.balance > 0 && <Text>✅ { message.username } has { message.balance } Rocketeers on chain { chainId }</Text> }
		{ message.balance < 1 && <Text>🛑 Computer says no</Text> }
		{ error && <Text>Something went wrong, contact #support in Discord</Text> }
	</Container>

	if( verifyUrl ) return <Container>

		{ !balance && <Text>Checking your on-chain balance...</Text> }
		
		{ balance && <>
			<H1>Verification URL</H1>
			<Text align="center">Post this in the Discord channel #get-verified:</Text>
			<Text align="center">{ verifyUrl }</Text>
		</> }

	</Container>

	return <Container>

		<H1 align="center">Verify your hodlr status</H1>
		<Text align="center">Verify your Rocketeer status by logging in with your wallet. This does NOT trigger a transaction. Therefore it is free.</Text>
		<Input onChange={ e => setUsername( e.target.value ) } type="text" placeholder="Your Discord username"/>
		<Button onClick={ showVerificationUrl }>Verify</Button>
		
	</Container>
}