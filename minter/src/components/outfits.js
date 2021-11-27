import { Container, Loading } from './generic'
import '../App.css'

import { useState, useEffect } from 'react'
import { useRocketeers, callApi } from '../modules/api'
import { useChainId, useAddress, sign } from '../modules/web3'
import { log } from '../modules/helpers'
import { useParams, useNavigate } from 'react-router'


export default function Verifier() {

	const { rocketeerId } = useParams()
	const navigate = useNavigate()

	// ///////////////////////////////
	// State management
	// ///////////////////////////////
	const address = useAddress()
	const metamaskAddress = useAddress()
	const [ validatorAddress, setValidatorAddress ] = useState(  )
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

			alert( `Success! Outfit changed, please click "refresh metadata" on Opensea to update it there.\nForwarding you to the tools homepage.` )
			navigate( `/` )

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

	// ///////////////////////////////
	// Lifecycle
	// ///////////////////////////////
	useEffect( f => {
		if( !validatorAddress && metamaskAddress ) setValidatorAddress( metamaskAddress )
	}, [ metamaskAddress, validatorAddress ] )

	useEffect( f => {

		// Find the data for the clicked Rocketeer
		const selected = rocketeers.find( ( { id } ) => id === rocketeerId )
		
		// If the selected rocketeer is available, compute it's available outfits to an easy to access property
		if( selected ) {

			const newOutfitAllowedInterval = 1000 * 60 * 60 * 24 * 30
			const { value: outfits } = selected.attributes.find( ( { trait_type } ) => trait_type === 'available outfits' ) || { value: 0 }
			const { value: last_outfit_change } = selected.attributes.find( ( { trait_type } ) => trait_type === 'last outfit change' ) || { value: 0 }
			const timeUntilAllowedToChange = newOutfitAllowedInterval - ( Date.now() - last_outfit_change )

			selected.outfits = outfits
			selected.last_outfit_change = last_outfit_change
			selected.new_outfit_available = timeUntilAllowedToChange < 0
			selected.when_new_outfit = new Date( Date.now() + timeUntilAllowedToChange )
		}

		log( "Selecting rocketeer ", selected )

		// Set the selected rocketeer to state
		if( selected ) setRocketeer( selected )

	}, [ rocketeerId, rocketeers.length ] )

	// ///////////////////////////////
	// Rendering
	// ///////////////////////////////

	if( !rocketeers.length || loading ) return <Loading message={ loading || "Loading Rocketeers, please make sure you selected the right wallet" } />

	// Rocketeer selector
	if(!rocketeer ) return <Container id="avatar" className={ rocketeers.length > 1 ? 'wide' : '' }>
		
		<h1>Rocketeers</h1>
		<p>Click on a Rocketeer to manage it's outfits</p>
		<div className="row">
			
			{ rocketeers.map( ( { id, image } ) => {

				return <img id={ `rocketeer-${ id }` } onClick={ f => navigate( `/outfits/${ id }` ) } key={ id } className='rocketeer' src={ image } alt={ `Rocketeer number ${ id }` } />

			} ) }

			<p className="row">Rocketeers owned by: { address }.</p>


		</div>

	</Container>

	// Changing room
	if( rocketeer ) return <Container id="avatar" className={ rocketeer.outfits > 0 ? 'wide' : '' }>
		
		<h1>{ rocketeer.name }</h1>

		<img key={ rocketeer.id } className='rocketeer' src={ rocketeer.image } alt={ `Rocketeer number ${ rocketeer.id }` } />
		{ rocketeer.new_outfit_available ? <button onClick={ generateNewOutfit } className="button">Generate new outfit</button> : <p>New outfit available on { rocketeer.when_new_outfit.toString() }</p> }
		<p>This Rocketeer has { 1 + rocketeer.outfits } outfits. { rocketeer.outfits > 0 && 'Click any outfit to select it as primary.' }</p>

		<div className="row">

			<img key={ rocketeer.id + 0 } onClick={ f => setPrimaryOutfit( 0 ) } className='rocketeer' src={ rocketeer.image.replace( /-\d\.jpg/, '.jpg' ) } alt={ `Rocketeer number ${ rocketeer.id }` } />
			
			{ Array.from( Array( rocketeer.outfits ) ).map( ( val, i ) => {
				return <img onClick={ f => setPrimaryOutfit( i + 1 ) } key={ rocketeer.id + i } className='rocketeer' src={ rocketeer.image.replace( /-\d\.jpg/, `-${ i + 1 }.jpg` ) } alt={ `Rocketeer number ${ rocketeer.id }` } />
			} ) }

		</div>

		<p className="row">Rocketeers owned by: { address }.</p>

	</Container>

}