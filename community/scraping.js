/* ///////////////////////////////
// Twitter
// scraping for signer.is
// /////////////////////////////*/

function get_address_from_base64( text ) {

	const [ batch, base64 ] = text.match( /(?:https:\/\/signer.is\/#\/verify\/)(.*?)(?:(<\/)|(">)|($))/ ) || []

	try {

		const text = atob( base64 )
		const json = JSON.parse( decodeURIComponent( text ) )

		return json.claimed_signatory

	} catch( e ) {

		console.log( `Decoding error for ${ base64 } `, e )
		return false

	}

}

async function get_addresses_from_twitter_links( links ) {

	const resolved_twitter_redirects = await Promise.all( links.map( url => fetch( url ).then( res => res.text() ) ) )
	const addresses = resolved_twitter_redirects.map( get_address_from_base64 )
	return addresses

}

async function scrape_signer_links_in_replies(  ) {
	
	console.log( '⚠️ Disable security policy headers with a chrome extension' )

	const hrefs = document.querySelectorAll( 'a' )
	const has_signer_is = [ ...hrefs ].filter( ( { innerText, ...rest } ) => {
		return innerText.includes( 'signer.is/#/verify' )
	} )
	const signer_is_hrefs = has_signer_is.map( ( { href } ) => href )
	const addresses = await get_addresses_from_twitter_links( signer_is_hrefs )

	console.log( addresses.join( '\n' ) )

}



async function scrape_signer_links_in_dm(  ) {

	console.log( `This function runs for an indeterminate length, keep an eye on it and run get_addresses_from_twitter_links when results stagnate` )

	const wait = ( durationinMs=1000 ) => new Promise( resolve => setTimeout( resolve, durationinMs ) )
	function get_handle_from_element( element ) {
		const [ match, handle ] = element.innerHTML.match( /(@.+?)(?:<\/)/ )
		if( handle ) return handle
		else return false
	}

	const hits = []
	const done = []

	while( true ) {

		const messages = document.querySelectorAll( '[aria-selected=false]' )

		for (let i = messages.length - 1; i >= 0; i--) {

			// Get the handle of the message we are trying
			const handle = get_handle_from_element( messages[i] )
			if( done.includes( handle ) ) continue
			if( !messages[i].isConnected ) continue

			// open the message panel and grab the link
			messages[i].click()
			await wait()
			const links = document.querySelectorAll( 'a' )
			const { href, ...rest } = [ ...links ].find( ( { innerText } ) => innerText.includes( 'signer.is/#/verify' ) ) || []
			
			// Save the link and mark the handle as done of need be
			if( href ) hits.push( href )
			done.push( handle )

			document.querySelector( '[aria-label="Back"]' ).click()
			await wait()

		}

		console.log( `Checked ${ done.length } handles. Found: `, hits )

	}

}

function discord_channel_scraping() {

	const hrefs = document.querySelectorAll( 'a' )
	const has_signer_is = [ ...hrefs ].filter( ( { innerText, ...rest } ) => {
		return innerText.includes( 'signer.is/#/verify' )
	} )
	console.log( has_signer_is[0].href )
	const signer_is_hrefs = has_signer_is.map( ( { title } ) => title )
	const addresses = signer_is_hrefs.map( get_address_from_base64 )
	console.log( addresses.join( '\n' ) )

}
