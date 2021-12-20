const functions = require( 'firebase-functions' )
const { discord } = functions.config()
const fetch = require( 'isomorphic-fetch' )

exports.notifyDiscordWebhook = async function( username, content, avatar_url, image_title, image_url ) {

	try {

		// Construct discord webhook message
		const message = {
			username,
			content,
			avatar_url,
			embeds: [ {
				title: image_title, image: { url: image_url }
			} ]
		}

		// Construct request options
		const options = {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify( message )
		}

		// Make webhook request
		const data = await fetch( discord.webhookurl, options ).then( res => res.json() )
		if( data.code ) throw new Error ( `Discord webhook failed with ${ data.code }: ${ data.message }` )

	} catch( e ) {
		console.error( 'Discord error ', e )
	}

}