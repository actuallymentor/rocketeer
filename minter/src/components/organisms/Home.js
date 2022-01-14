// Icons
import Fox from '../../assets/metamask-fox.svg'
import Discord from '../../assets/discord-logo-black.svg'
import Mint from '../../assets/rocket-fill.svg'
import Avatar from '../../assets/account-circle-fill.svg'
import Outfits from '../../assets/door-closed-fill.svg'
import Portfolio from '../../assets/pie-chart-fill.svg'

// Functionality
import { useState, useEffect } from 'react'
import { log } from '../../modules/helpers'
import { useAddress, getAddress } from '../../modules/web3'

// Visual
import Container from '../atoms/Container'
import { H1 } from '../atoms/Text'
import Button from '../atoms/Button'
import Section from '../atoms/Section'


import Loading from '../molecules/Loading'


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
	if( loading || error ) return <Loading message={ loading || error } />

	// Actions menu
	if( address ) return <Container>

		<H1>Rocketeer NFT Tools</H1>
		
		<Section direction="row">
			{ /* <Button direction="column" icon={ Mint } to='/mint'>Mint Rocketeer</Button> */ }
			
			<Button direction="column" icon={ Outfits } to='/outfits'>Changing Room</Button>
			{ /* <Button direction="column" icon={ Discord } to='/verify'>Discord verify</Button> */ }
			<Button direction="column" icon={ Avatar } to='/avatar'>Set node avatar</Button>
			<Button direction="column" icon={ Portfolio } to='/portfolio'>Rocketeer Portfolio</Button>
		</Section>


	</Container>
	
	// Login interface
	return <Container>

			<H1>Rocketeer Interface</H1>
			<Button icon={ Fox } onClick={ metamasklogin }>
				Connect wallet
			</Button>

	</Container>

}