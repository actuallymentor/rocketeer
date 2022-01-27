import Container from '../atoms/Container'
import Section from '../atoms/Section'
import { H1, H2, Text } from '../atoms/Text'
import Avatar from '../molecules/Avatar'
import Loading from '../molecules/Loading'
import Button from '../atoms/Button'
import Input from '../molecules/Input'
import Hero from '../molecules/Hero'

import { useState, useEffect } from 'react'
import { log } from '../../modules/helpers'
import { useRocketeers, make_merch_order } from '../../modules/api'
import { useAddress } from '../../modules/web3'
import { useParams, useNavigate } from 'react-router-dom'
import lookup from 'country-code-lookup'

export default function Verifier() {

	// ///////////////////////////////
	// State management
	// ///////////////////////////////
	const address = useAddress()
	const [ rocketeer, setRocketeer ] = useState(  )
	const [ order, setOrder ] = useState( {  } )
	const [ payment, setPayment ] = useState(  )
	const { rocketeer_id, order_id } = useParams()
	const navigate = useNavigate()
	const rocketeers = useRocketeers( rocketeer_id )
	const [ loading, setLoading ] = useState(  )

	const updateOrder = ( key, value ) => setOrder( prev => ( { ...prev, [key]: value } ) )

	// ///////////////////////////////
	// Lifecycle
	// ///////////////////////////////

	useEffect( f => {
		if( !rocketeer_id ) setRocketeer( undefined )
	}, [ rocketeer_id ] )


	useEffect( f => {

		// Find the data for the clicked Rocketeer
		const selected = rocketeers.find( ( { id } ) => id === rocketeer_id )
		
		log( "Selecting rocketeer ", selected )

		// Set the selected rocketeer to state
		if( selected ) setRocketeer( selected )

	}, [ address, rocketeer_id, rocketeers.length ] )

	/* ///////////////////////////////
	// Functions
	// /////////////////////////////*/
	async function makeOrder() {

		try {

			const { email, ...address } = order

			// Validations
			if( !email.includes( '@' ) ) throw new Error( `Please input a valid email` )
			if( !address.name ) throw new Error( `Input your name` )
			if( !address.city ) throw new Error( `Input your city` )
			if( !address.line1 ) throw new Error( `Input your address` )
			if( !address.postCode ) throw new Error( `Input your postal code` )
			if( !address.city ) throw new Error( `Input your city` )
			if( !address.country ) throw new Error( `Input your country` )

			// Validate country in particular
			const country = lookup.byCountry( address.country )
			log( `Found country: `, country )
			if( !country ) throw new Error( `Country not recognised, did you make a typo?` )
			address.country = country.iso2

			setLoading( 'Preparing order...' )
			const { error, ...pending_order } = await make_merch_order( {
				email,
				address,
				image_url: rocketeer.image,
				product_id: 'kurk_20x20'
			} )

			log( `API responded with `, error, pending_order )
			if( error ) throw new Error( error )

			log( `Order created: `, pending_order )
			setPayment( pending_order )

		} catch( e ) {

			log( `Order error: `, e )
			alert( e.message )

		} finally {

			setLoading( false )

		}

	}

	// ///////////////////////////////
	// Rendering
	// ///////////////////////////////

	if( loading ) return <Loading message={ loading } />

	if( order_id ) return <Container align='flex-start'>
		<H1>Order { order_id } confirmed</H1>
		<Text>Write that number down in case of apocalypse. You will NOT be kept up to date via email, still working on that. Sorry, not sorry.</Text>
	</Container>

	if( payment ) return <Container align='flex-start'>
		
		<H1>Payment link generated</H1>
		<Text>The below button will send you to an external website called printapi.nl. This is the Dutch printing and logistics company that is handeling the Rocketeer merch production.</Text>
		<Button onClick={ f => window.location.href = payment.paymentUrl }>Click here to pay €{ payment.amount }</Button>

	</Container>

	// Loading rocketeers
	if( !address && !rocketeers.length ) return <Loading message="Loading your Rocketeers, make sure you're connected to the right wallet address" />

	// Rocketeer selected
	if( rocketeer ) return <Container gutter={ false } align='flex-start'>

		<Hero background={ rocketeer.image } gutter={ true } shadow={ true }>
			<H1 banner={ true }>Merch for { rocketeer.name.split( ' ' )[0] }</H1>
			<H2 banner={ true }>Current outfit: { rocketeer.current_outfit ? `#${rocketeer.current_outfit}` : 'Genesis' }</H2>
		</Hero>
		
		<Section align='flex-start' gutter={ true }>

			<Text>This functionality is currently in super-mega-beta. If anything goes wrong, you will not get your money back. Maybe you'll get a POAP to ease your suffering though.</Text>
			<Text>There is currently only one merch option: A 20cm x 20cm print on cork.</Text>

			<H2>Shipping details</H2>
			<Text>These are not saved on our end, only the printing and logistics partner saves these.</Text>
			<Input value={ order.name } onChange={ ( { target } ) => updateOrder( 'name', target.value ) } label='Your name' />
			<Input value={ order.email } onChange={ ( { target } ) => updateOrder( 'email', target.value ) } label='Your email' />
			<Input value={ order.line1 } onChange={ ( { target } ) => updateOrder( 'line1', target.value ) } label='Address (street + number)' />
			<Input value={ order.postCode } onChange={ ( { target } ) => updateOrder( 'postCode', target.value ) } label='Your postal code' />
			<Input value={ order.city } onChange={ ( { target } ) => updateOrder( 'city', target.value ) } label='Your city' />
			<Input value={ order.country } onChange={ ( { target } ) => updateOrder( 'country', target.value ) } label='Your country' />

			<Button onClick={ makeOrder }>Order cork print</Button>
			
		</Section>
		

	</Container>
	return <Container>
		
		<H1>Merch</H1>
		<Text>Select the Rocketeer you want merch for.</Text>
		<Section direction="row">
			
			{ !rocketeers.length && <Text>Loading Rocketeers, make sure you selected the right wallet...</Text> }
			{ rocketeers.map( ( { id, image } ) => {

				return <Avatar onClick={ f => navigate( `/merch/${ id }` ) } key={ id } src={ image } alt={ `Rocketeer number ${ id }` } />

			} ) }


		</Section>

		<Text>Rocketeers owned by: { address }.</Text>

	</Container>
}