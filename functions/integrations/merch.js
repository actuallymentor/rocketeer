const functions = require( 'firebase-functions' )
const { printapi } = functions.config()
const { db, dataFromSnap } = require( '../modules/firebase' )
const { log } = require( '../modules/helpers' )
const fetch = require( 'isomorphic-fetch' )

/* ///////////////////////////////
// API handlers
// /////////////////////////////*/
async function call_printapi( endpoint, data, method='POST', format='json', authenticated=true ) {

	const logs = []

	try {

		logs.push( `Call requested: ${method}/${format} ${endpoint} with `, JSON.stringify( data ) )

		// Format url, if it has https use the link as provided
		const url = endpoint.includes( 'https://' ) ? endpoint : `${ printapi.base_url }${ endpoint }`

		const access_token = authenticated && await get_auth_token()
		if( authenticated ) log( `Found access token: `, access_token && access_token.slice( 0, 10 ) )
		if( authenticated && !access_token ) throw new Error( `No access_token found` )

		// Generate headers based on input
		const headers = {
			...( format == 'json' && data && { 'Content-Type': 'application/json' } ),
			...( format == 'form' && data && { 'Content-Type': 'application/x-www-form-urlencoded' } ),
			...( authenticated && { Authorization: `Bearer ${ access_token }` } )
		}
		logs.push( `Headers `, JSON.stringify( headers ) )
		// Generate data body
		let body = {}

		// fetch expects json to be stringified
		if( format == 'json' ) body = JSON.stringify( data )

		// Formdata being formdata
		if( format == 'form' ) body = new URLSearchParams( data )

		logs.push( `API request data `, body )

		// Focmat fetch options
		const options = {
			method,
			headers,
			body
		}	

		// Call api
		logs.push( `Calling ${ url }`, )
		const response = await fetch( url, options ).then( async res => {

			const json_res = res.clone()
			const text_res = res.clone()

			try {

				const json_response = await json_res.json()
				logs.push( `API json response: `, json_response )
				return json_response

			} catch( e ) {
				
				const text_response = await text_res.text()
				logs.push( `API text response: `, text_response )
				throw new Error( `Non JSON output from API` )

			}

		} )
		logs.push( `Production call: `, JSON.stringify( { ...headers, ...body } ) )
		logs.push( `Received `, JSON.stringify( response ) )

		return response

	} catch( e ) {

		console.error( `Error calling printapi: `, e )
		return {
			error: e.message,
			tracelog: logs
		}

	}

}

async function get_auth_token(  ) {

	const token_grace_period = 1000 * 60
	const logs = []

	try {

		// Get cached token
		let { expires=0, access_token } = await db.collection( 'secrets' ).doc( 'printapi' ).get( ).then( dataFromSnap )
		logs.push( `Old access token: `, access_token && access_token.slice( 0, 10 ) )

		// If token is still valid
		if( ( expires - token_grace_period ) > Date.now() ) {
			logs.push( `Old access token still valid` )
			return access_token
		}

		// Grab new token and save it
		logs.push( `Requesting new token` )
		const credentials = {
			grant_type: 'client_credentials',
			client_id: printapi.client_credentials,
			client_secret: printapi.client_secret
		}
		const { access_token: new_access_token, expires_in, ...errors } = await call_printapi( `/v2/oauth`, credentials, 'POST', 'form', false )

		logs.push( `New access token: `, new_access_token && new_access_token.slice( 0, 10 ) )
		if( errors ) logs.push( `Access token error: `, errors )
		if( !new_access_token ) throw new Error( `No access token available` )

		// Write new access token to cache
		await db.collection( 'secrets' ).doc( 'printapi' ).set( {
			access_token: new_access_token,
			// expires_in is in seconds
			expires: Date.now() + ( expires_in * 1000 )
		}, { merge: true } )

		

		return new_access_token


	} catch( e ) {

		console.error( `Error getting auth token `, e )
		console.log( 'Access token error: ', JSON.stringify( logs ) )
		return false

	}

}

/* ///////////////////////////////
// Order flow functionality
// /////////////////////////////*/
async function make_printapi_order  ( { image_url, product_id, quantity=1, address={}, email } ) {

	// Demo data
	// email = 'info@rocketeer.fans'
	// image_url = 'https://storage.googleapis.com/rocketeer-nft.appspot.com/mainnetRocketeers/1.jpg'
	// product_id = 'kurk_20x20'
	// address = {
	// 	"address": {
	// 		"name": "John Doe",
	// 		"line1": "Osloweg 75",
	// 		"postCode": "9700 GE",
	// 		"city": "Groningen",
	// 		"country": "NL"
	// 	}
	// }

	const logs = []

	try {
		
		// Validations
		if( !email || !image_url || !product_id ) throw new Error( `Missing order data` )
		if( Object.keys( address ).length != 5 ) throw new Error( `Malformed address` )

		// Make the order on printapi backenc
		const order = {
			email,
			items: [
				{
					productId: product_id,
					quantity,
					files: { content: image_url }
				}
			],
			shipping: {
				address
			}
		}
		logs.push( `Creating order: `, order )
		const { checkout, error: order_error, ...order_details } = await call_printapi( `/v2/orders`, order )
		logs.push( `Order made with `, checkout, order_details )

		if( order_error ) {
			logs.push( `Order errored with `, order_error )
			throw new Error( order_error )
		}

		// Generate pament link
		const { error: checkout_error, paymentUrl, amount, ...checkout_details } = await call_printapi( checkout.setupUrl, {
			billing: {
				address
			},
			returnUrl: `https://tools.rocketeer.fans/#/merch/success/${ order_details.id }`
		} )

		logs.push( `Checkout responded with`, paymentUrl, amount, checkout_details )

		if( checkout_error ) {
			logs.push( `Checkout errored with `, checkout_error )
			throw new Error( checkout_error )
		}

		return {
			paymentUrl,
			amount
		}

	} catch( e ) {

		return {
			error: e.message,
			tracelog: logs
		}

	}

}

exports.order_merch = async ( req, res ) => {

	const logs = []

	try {

		logs.push( `Making API request based on body: `, req.body )
		const { error, ...order } = await make_printapi_order( req.body )
		logs.push( `Received: `, error, order )
		if( error ) throw new Error( error )

		return res.json( { ...order, tracelog: logs } )

	} catch( e ) {
		return res.json( {
			error: e.message,
			tracelog: logs
		} )
	}

}