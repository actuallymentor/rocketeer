import { useState, useEffect } from 'react'
import { useRocketeers, callApi } from '../../modules/api'
import { useChainId, useAddress, sign } from '../../modules/web3'
import { log } from '../../modules/helpers'
import { useParams, useNavigate } from 'react-router'

import Container from '../atoms/Container'
import Section from '../atoms/Section'
import { H1, H2, Text, Sidenote } from '../atoms/Text'
import Button from '../atoms/Button'
import Avatar from '../molecules/Avatar'


import Loading from '../molecules/Loading'
import Hero from '../molecules/Hero'

export default function Verifier() {

	const { rocketeerId } = useParams()
	const navigate = useNavigate()

	// ///////////////////////////////
	// State management
	// ///////////////////////////////
	const address = useAddress()
	const metamaskAddress = useAddress()
	const rocketeers = useRocketeers( rocketeerId )
	const chainId = useChainId()
	const [ rocketeer, setRocketeer ] = useState(  )
	const [ loading, setLoading ] = useState(  )


	/* ///////////////////////////////
	// Functions
	// /////////////////////////////*/
	async function setPrimaryOutfit( outfitId ) {

		try {

			log( `Setting outfit ${ outfitId } for Rocketeer #${ rocketeerId }` )
			setLoading( `Setting outfit ${ outfitId } for Rocketeer #${ rocketeerId }` )
			alert( 'You will be prompted to sign a message, this is NOT a transaction' )

			const signature = await sign( JSON.stringify( {
				signer: address.toLowerCase(),
				outfitId,
				chainId,
			} ), address )

			log( 'Making request with ', signature )

			setLoading( 'Updating profile' )

			const { error, success } = await callApi( `/rocketeer/${ rocketeerId }/outfits`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify( signature )
			} )

			if( error ) throw new Error( error )

			alert( `Success! Outfit changed, please click "refresh metadata" on Opensea to update it there.` )
			window?.location.reload()

		} catch( e ) {

			log( e )
			alert( e.message )

		} finally {

			setLoading( false )

		}

	}

	async function generateNewOutfit( ) {

		try {

			log( `Generating new outfit for #${ rocketeerId }` )
			setLoading( `Generating new outfit for #${ rocketeerId }` )
			alert( 'You will be prompted to sign a message, this is NOT a transaction' )

			const signature = await sign( JSON.stringify( {
				signer: address.toLowerCase(),
				rocketeerId,
				chainId,
			} ), address )

			log( 'Making request with ', signature )

			setLoading( 'Generating new outfit, this can take a minute' )

			const { error, success } = await callApi( `/rocketeer/${ rocketeerId }/outfits`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify( signature )
			} )

			if( error ) throw new Error( error )

			alert( `Success! Outfit generated.` )
			window?.location.reload()


		} catch( e ) {

			log( e )
			alert( e.message )

		} finally {

			setLoading( false )

		}

	}

	async function generateByAddress( ) {

		try {

			log( `Generating new outfit for address ${ address }` )
			setLoading( `Generating new outfits for ${ address }` )
			alert( 'You will be prompted to sign a message, this is NOT a transaction' )

			const signature = await sign( JSON.stringify( {
				signer: address.toLowerCase(),
				action: 'generateMultipleNewOutfits',
				chainId,
			} ), address )

			log( 'Making request with ', signature )

			setLoading( 'Generating new outfits, this can take a few minutes' )

			const { amountOfOutfits } = await callApi( `/rocketeers/${ address }`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify( signature )
			} )
			log( `Amount of outfits queued: `, amountOfOutfits )

			alert( `Success! Outfit generation started, check back in a few minutes to view your new outfits!` )


		} catch( e ) {

			log( e )
			alert( e.message )

		} finally {

			setLoading( false )

		}

	}

	// ///////////////////////////////
	// Lifecycle
	// ///////////////////////////////
	useEffect( f => {
		if( !rocketeerId ) setRocketeer( undefined )
	}, [ rocketeerId ] )


	useEffect( f => {

		// Find the data for the clicked Rocketeer
		const selected = rocketeers.find( ( { id } ) => id === rocketeerId )
		
		log( "Selecting rocketeer ", selected )

		// Set the selected rocketeer to state
		if( selected ) setRocketeer( selected )

	}, [ rocketeerId, rocketeers.length ] )

	// ///////////////////////////////
	// Rendering
	// ///////////////////////////////

	if( !rocketeers.length || loading ) return <Loading message={ loading || "Loading Rocketeers, please make sure you selected the right wallet" } />

	// Rocketeer selector
	if(!rocketeer ) return <Container justify="flex-start">
		
		<H1>Rocketeers</H1>
		<Text>Click on a Rocketeer to manage it's outfits</Text>
		<Section direction="row">
			
			{ rocketeers.map( ( { id, image, new_outfit_available } ) => {

				return <Avatar highlight={ new_outfit_available } id={ `rocketeer-${ id }` } onClick={ f => navigate( `/outfits/${ id }` ) } key={ id } src={ image } alt={ `Rocketeer number ${ id }` } />

			} ) }

		</Section>

		<Text className="row">Rocketeers owned by: { address }.</Text>
		<Sidenote onClick={ generateByAddress } className="row">_</Sidenote>

	</Container>

	// Changing room
	if( rocketeer ) return <Container justify="flex-start" gutter={ false }>
		
		{  /* Header */ }
		<Hero background={ rocketeer.image } gutter={ true } shadow={ true }>
			<H1 banner={ true }>{ rocketeer.name.split( ' ' )[0] }'s changing room</H1>
			<H2 banner={ true }>Current outfit: { rocketeer.current_outfit ? `#${rocketeer.current_outfit}` : 'Genesis' }</H2>
		</Hero>

		<Section direction="column" gutter={ true }>
			<H2>{ rocketeer.name }</H2>
			<Avatar key={ rocketeer.id } src={ rocketeer.image } alt={ `Rocketeer number ${ rocketeer.id }` } />
			{ rocketeer.new_outfit_available ? <Button onClick={ generateNewOutfit }>Generate new outfit</Button> : <Text align="center">New outfit available on { rocketeer.when_new_outfit.toString() }</Text> }
		</Section>
		

		{  /* Select outfits */ }
		<Section align='flex-start' direction="column" gutter={ true } shadow={ true }>

			<H2>{ rocketeer.name.split( ' ' )[0] }'s outfits</H2>
			<Text>This Rocketeer has { 1 + rocketeer.outfits } outfits. { rocketeer.outfits > 0 && 'Click any outfit to select it as primary.' }</Text>
		

			<Section justify='flex-start' direction="row">
				
				
				{ Array.from( Array( rocketeer.outfits ) ).map( ( val, i, arr ) => {
					const reverseNumber = arr.length - i
					return <Avatar title={ `Outfit #${ reverseNumber }` } onClick={ f => setPrimaryOutfit( reverseNumber ) } key={ rocketeer.id + reverseNumber } src={ rocketeer.image.replace( /(-\d)?\.jpg/, `-${ reverseNumber }.jpg` ) } alt={ `Rocketeer number ${ rocketeer.id } outfit ${ reverseNumber }` } />
				} ) }

				{  /* Genesis avatar */ }
				<Avatar title="Genesis outfit" key={ rocketeer.id + '-genesis' } onClick={ f => setPrimaryOutfit( 0 ) } src={ rocketeer.image.replace( /(-\d)?\.jpg/, '.jpg' ) } alt={ `Rocketeer number ${ rocketeer.id }` } />

			</Section>

		</Section>


	</Container>

}