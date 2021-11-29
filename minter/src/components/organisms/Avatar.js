import Container from '../atoms/Container'
import Section from '../atoms/Section'
import { H1, Text } from '../atoms/Text'
import Avatar from '../molecules/Avatar'
import Input from '../molecules/Input'
import Loading from '../molecules/Loading'

import { useState, useEffect } from 'react'
import { log } from '../../modules/helpers'
import { useRocketeerImages, callApi } from '../../modules/api'
import { useAddress, useChainId, sign } from '../../modules/web3'


export default function Verifier() {

	// ///////////////////////////////
	// State management
	// ///////////////////////////////
	const chainId = useChainId()
	const address = useAddress()
	const [ network, setNetwork ] = useState( 'mainnet' )
	const [ loading, setLoading ] = useState(  )
	const metamaskAddress = useAddress()
	const [ validatorAddress, setValidatorAddress ] = useState(  )
	const rocketeers = useRocketeerImages()

	// ///////////////////////////////
	// Functions
	// ///////////////////////////////
	async function attribute( id ) {

		try {

			// Validate iput as eth1 address
			if( !validatorAddress.match( /0x[a-zA-Z0-9]{40}/ ) ) throw new Error( `Please input a valid ETH1 address.` )

			const confirmed = window.confirm( `This will assign Rocketeer ${ id } to ${ validatorAddress }.\n\nMetamask will ask you to sign a message, this is NOT A TRANSACTION.` )
			if( !confirmed ) throw new Error( `Operation cancelled` )

			setLoading( 'Signing verification message' )

			const signature = await sign( JSON.stringify( {
				signer: address.toLowerCase(),
				tokenId: id,
				validator: validatorAddress.toLowerCase(),
				network,
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

			alert( `Success! ${ validatorAddress } now has the avatar associated with Rocketeer #${ id }.` )


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
	return <Container>
		
		<H1>Rocketeer avatar attribution</H1>
		
		<Text>Input the address you want to assign the avatar to.</Text>
		<Input type='text' onChange={ ( { target } ) => setValidatorAddress( target.value ) } value={ validatorAddress } />

		<Text>Select the network you want to assign for:</Text>
		<Section topGutter={ false } direction="column">
				<Input label="Mainnet" onClick={ f => setNetwork( 'mainnet' ) } id="mainnet" type="radio" name="network" checked={ network == 'mainnet' }/>
				<Input label="Testnet" onClick={ f => setNetwork( 'testnet' ) } id="testnet" type="radio" name="network" checked={ network == 'testnet' }/>
		</Section>
		

		<Text>Click the Rocketeer you want to assign to this address.</Text>
		<Section direction="row">
			
			{ rocketeers.map( ( { id, src } ) => {

				return <Avatar key={ id } onClick={ f => attribute( id ) } src={ src } alt={ `Rocketeer number ${ id }` } />

			} ) }

		</Section>

	</Container>
}