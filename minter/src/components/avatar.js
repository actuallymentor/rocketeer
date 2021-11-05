import { Container, Loading } from './generic'
import '../App.css'

import { useState, useEffect } from 'react'
import { log } from '../modules/helpers'
import { useRocketeerImages, callApi } from '../modules/api'
import { useAddress, useChainId, useBalanceOf, useTokenIds, sign } from '../modules/web3'


export default function Verifier() {

	// ///////////////////////////////
	// State management
	// ///////////////////////////////
	const balance = useBalanceOf()
	const chainId = useChainId()
	const address = useAddress()
	const [ loading, setLoading ] = useState(  )
	const metamaskAddress = useAddress()
	const [ validatorAddress, setValidatorAddress ] = useState(  )
	const rocketeers = useRocketeerImages()

	// ///////////////////////////////
	// Functions
	// ///////////////////////////////
	async function attribute( id ) {

		try {

			const confirmed = window.confirm( `This will assign Rocketeer ${ id } to ${ validatorAddress }.\n\nMetamask will ask you to sign a message, this is NOT A TRANSACTION.` )
			if( !confirmed ) throw new Error( `Operation cancelled` )

			setLoading( 'Signing verification message' )

			const signature = await sign( JSON.stringify( {
				signer: address.toLowerCase(),
				tokenId: id,
				validator: validatorAddress.toLowerCase(),
				chainId
			} ), address )

			log( 'Making request with ', signature )

			setLoading( 'Updating profile' )

			const { error, success } = await callApi( `/integrations/avatar`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify( signature )
			} )

			if( error ) throw new Error( error )


		} catch( e ) {
			alert( e.message )
			log( e )
		} finally {
			setLoading( false )
		}

	}

	// ///////////////////////////////
	// Lifecycle
	// ///////////////////////////////
	useEffect( f => {
		if( !validatorAddress && metamaskAddress ) setValidatorAddress( metamaskAddress )
	}, [ metamaskAddress, validatorAddress ] )

	// ///////////////////////////////
	// Rendering
	// ///////////////////////////////
	if( loading ) return <Loading message={ loading } />
	return <Container id="avatar" className={ rocketeers.length > 1 ? 'wide' : '' }>
		
		<h1>Rocketeer avatar attribution</h1>
		
		<p>Input the address you want to assign the avatar to.</p>
		<input type='text' value={ validatorAddress } />

		<p>Click the Rocketeer you want to assign to this address.</p>
		<div className="row">
			
			{ rocketeers.map( ( { id, src } ) => {

				return <img key={ id } onClick={ f => attribute( id ) } className='rocketeer' src={ src } alt={ `Rocketeer number ${ id }` } />

			} ) }

		</div>

	</Container>
}