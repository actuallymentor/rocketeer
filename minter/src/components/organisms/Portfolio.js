import Container from '../atoms/Container'
import Section from '../atoms/Section'
import { H1, Text } from '../atoms/Text'
import Avatar from '../molecules/Avatar'
import Loading from '../molecules/Loading'

import { useState, useEffect } from 'react'
import { useRocketeers } from '../../modules/api'
import { useAddress } from '../../modules/web3'


export default function Verifier() {

	// ///////////////////////////////
	// State management
	// ///////////////////////////////
	const address = useAddress()
	const metamaskAddress = useAddress()
	const [ validatorAddress, setValidatorAddress ] = useState(  )
	const rocketeers = useRocketeers()


	// ///////////////////////////////
	// Lifecycle
	// ///////////////////////////////
	useEffect( f => {
		if( !validatorAddress && metamaskAddress ) setValidatorAddress( metamaskAddress )
	}, [ metamaskAddress, validatorAddress ] )

	// ///////////////////////////////
	// Rendering
	// ///////////////////////////////
	if( !address && !rocketeers.length ) return <Loading message="Loading your Rocketeers, make sure you're connected to the right wallet address" />
	return <Container>
		
		<H1>Portfolio</H1>
		<Text>Click a Rocketeer to view it's details.</Text>
		<Section direction="row">
			
			{ rocketeers.map( ( { id, image } ) => {

				return <Avatar onClick={ f => window.location.href =`https://viewer.rocketeer.fans/?rocketeer=${ id }` } key={ id } src={ image } alt={ `Rocketeer number ${ id }` } />

			} ) }


		</Section>

		<Text>Rocketeers owned by: { address }.</Text>

	</Container>
}