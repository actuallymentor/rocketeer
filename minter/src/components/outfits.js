import { Container, Loading } from './generic'
import '../App.css'

import { useState, useEffect } from 'react'
import { useRocketeers } from '../modules/api'
import { log } from '../modules/helpers'
import { useAddress } from '../modules/web3'


export default function Verifier() {

	// ///////////////////////////////
	// State management
	// ///////////////////////////////
	const address = useAddress()
	const metamaskAddress = useAddress()
	const [ validatorAddress, setValidatorAddress ] = useState(  )
	const rocketeers = useRocketeers()
	const [ selectedId, setSelectedId ] = useState(  )
	const [ rocketeer, setRocketeer ] = useState(  )


	// ///////////////////////////////
	// Lifecycle
	// ///////////////////////////////
	useEffect( f => {
		if( !validatorAddress && metamaskAddress ) setValidatorAddress( metamaskAddress )
	}, [ metamaskAddress, validatorAddress ] )

	useEffect( f => {

		const selected = rocketeers.find( ( { id } ) => id === selectedId )
		
		if( selected ) {
			const { value: outfits } = selected.attributes.find( ( { trait_type } ) => trait_type === 'available outfits' ) || 0
			selected.outfits = outfits
		}

		log( "Selecting rocketeer ", selected )

		if( selected ) setRocketeer( selected )

	}, [ selectedId, rocketeers ] )

	// ///////////////////////////////
	// Rendering
	// ///////////////////////////////

	if( !rocketeers.length ) return <Loading message="Loading Rocketeers, please make sure you selected the right wallet" />

	// Rocketeer selector
	if(!rocketeer ) return <Container id="avatar" className={ rocketeers.length > 1 ? 'wide' : '' }>
		
		<h1>Rocketeers</h1>
		<p>Click on a Rocketeer to manage it's outfits</p>
		<div className="row">
			
			{ rocketeers.map( ( { id, image } ) => {

				return <img id={ `rocketeer=${ id }` } onClick={ f => setSelectedId( id ) } key={ id } className='rocketeer' src={ image } alt={ `Rocketeer number ${ id }` } />

			} ) }

			<p className="row">Rocketeers owned by: { address }.</p>


		</div>

	</Container>

	// Changing room
	if( rocketeer ) return <Container id="avatar" className={ rocketeers.length > 1 ? 'wide' : '' }>
		
		<h1>Changing room for Rocketeer { selectedId }</h1>
		<img onClick={ f => window.location.href =`https://viewer.rocketeer.fans/?rocketeer=${ rocketeer.id }` } key={ rocketeer.id } className='rocketeer' src={ rocketeer.image } alt={ `Rocketeer number ${ rocketeer.id }` } />
		<p>This Rocketeer has { rocketeer.outfits } alternative outfits. { rocketeer.outfits > 0 && 'Click any outfit to select it as primary.' }</p>

		<div className="row">
			
			{ Array.from( Array( rocketeer.outfits ) ).map( ( val, i ) => {
				return <img onClick={ f => f } key={ rocketeer.id } className='rocketeer' src={ rocketeer.image.replace( '.jpg', `-${ i + 1 }.jpg` ) } alt={ `Rocketeer number ${ rocketeer.id }` } />
			} ) }

		</div>

		<p className="row">Rocketeers owned by: { address }.</p>

	</Container>

}