const fetch = require( 'isomorphic-fetch' )

exports.ask_signer_is_for_available_emails = async function( addresses ) {

	/* ///////////////////////////////
	// Check available email addresses */
	const endpoint = `https://signer.is/check_availability/`
	const options = {
		method: 'POST',
		headers:{
			'Content-Type': 'application/json'
		},
		body: JSON.stringify( {
			addresses
		} )
	}

	const res = await fetch( endpoint, options )
	const available_addresses = await res.json()

	return available_addresses?.emails_available || []

}