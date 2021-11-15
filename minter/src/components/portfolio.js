import { Container } from './generic'
import '../App.css'

import { useState, useEffect } from 'react'
import { useRocketeerImages } from '../modules/api'
import { useAddress } from '../modules/web3'


export default function Verifier() {

	// ///////////////////////////////
	// State management
	// ///////////////////////////////
	const address = useAddress()
	const metamaskAddress = useAddress()
	const [ validatorAddress, setValidatorAddress ] = useState(  )
	const rocketeers = useRocketeerImages()


	// ///////////////////////////////
	// Lifecycle
	// ///////////////////////////////
	useEffect( f => {
		if( !validatorAddress && metamaskAddress ) setValidatorAddress( metamaskAddress )
	}, [ metamaskAddress, validatorAddress ] )

	// ///////////////////////////////
	// Rendering
	// ///////////////////////////////
	return <Container id="avatar" className={ rocketeers.length > 1 ? 'wide' : '' }>
		
		<h1>Portfolio</h1>
		<p>Click a Rocketeer to view it's details.</p>
		<div className="row">
			
			{ rocketeers.map( ( { id, src } ) => {

				return <img onClick={ f => window.location.href =`https://viewer.rocketeer.fans/?rocketeer=${ id }` } key={ id } className='rocketeer' src={ src } alt={ `Rocketeer number ${ id }` } />

			} ) }

			<p className="row">Rocketeers owned by: { address }.</p>


		</div>

	</Container>
}