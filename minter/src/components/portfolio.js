import { Container, Loading } from './generic'
import '../App.css'

import { useState, useEffect } from 'react'
import { log } from '../modules/helpers'
import { useRocketeerImages, callApi } from '../modules/api'
import { useAddress, useChainId, useBalanceOf, useTokenIds, sign } from '../modules/web3'
import { useNavigate } from 'react-router-dom'


export default function Verifier() {

	// ///////////////////////////////
	// State management
	// ///////////////////////////////
	const balance = useBalanceOf()
	const chainId = useChainId()
	const address = useAddress()
	const [ network, setNetwork ] = useState( 'mainnet' )
	const [ loading, setLoading ] = useState(  )
	const metamaskAddress = useAddress()
	const [ validatorAddress, setValidatorAddress ] = useState(  )
	const rocketeers = useRocketeerImages()
	const navigate = useNavigate()


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