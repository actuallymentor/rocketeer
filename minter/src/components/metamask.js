import Fox from '../assets/metamask-fox.svg'
import { Container, Loading } from './generic'
import { useState, useEffect } from 'react'
import { log } from '../modules/helpers'
import { useAddress, getAddress } from '../modules/web3'
import { Link } from 'react-router-dom'


// ///////////////////////////////
// Render component
// ///////////////////////////////
export default function ComponentName( ) {

	// ///////////////////////////////
	// States
	// ///////////////////////////////
	const [ loading, setLoading ] = useState( 'Detecting metamask...' )
	const [ error, setError ] = useState( undefined )
	const address = useAddress()


	// ///////////////////////////////
	// Functions
	// ///////////////////////////////

	// Handle user login interaction
	async function metamasklogin( e ) {

		e.preventDefault()

		try {

			setLoading( 'Connecting to Metamask' )
			const address = await getAddress()
			log( 'Received: ', address )

		} catch( e ) {
			setError( `Metamask error: ${ e.message || JSON.stringify( e ) }. Please reload the page.` )
		} finally {
			setLoading( false )
		}

	}
	
	// ///////////////////////////////
	// Lifecycle
	// ///////////////////////////////

	// Check for metamask on load
	useEffect( f => window.ethereum ? setLoading( false ) : setError( 'No web3 provider detected, please install metamask' ), [] )

	// ///////////////////////////////
	// Render component
	// ///////////////////////////////

	// Loading component
	if( loading ) return <Loading message={ loading } />

	// Error interface
	if( error ) return <Container>
		<p>{ error }</p>
	</Container>

	// Actions menu
	if( address ) return <Container>

		<h1>Rocketeer Interface</h1>
		
		<div>
			<Link className='button' to='/mint'>Mint Rocketeer</Link>
			<Link className='button' to='/portfolio'>View Rocketeer Portfolio</Link>
			<Link className='button' to='/verify'>Discord verify</Link>
			<Link className='button' to='/avatar'>Set address avatar</Link>
		</div>


	</Container>
	
	// Login interface
	return <Container>

			<h1>Rocketeer Interface</h1>
			<a className="button" href="/#" onClick={ metamasklogin }>
				<img alt="metamask fox" src={ Fox } />
				Connect wallet
			</a>

	</Container>

}