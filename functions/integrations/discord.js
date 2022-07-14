const functions = require( 'firebase-functions' )
const { discord } = functions.config()
const fetch = require( 'isomorphic-fetch' )
const { dev } = require('../modules/helpers')

exports.notify_discord_of_new_outfit = async function( username, content, avatar_url, image_title, image_url ) {

	try {

		// Construct discord webhook message
		const message = {
			username,
			content,
			avatar_url,
			allowed_mentions: {
				parse: [ 'users' ]
			},
			embeds: [
				{ title: 'Current outfit', thumbnail: { url: avatar_url } },
				{ title: image_title, thumbnail: { url: image_url } } ]
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

exports.notify_discord_of_outfit_notifications = async function( amount=0 ) {

	if( !dev && amount == 0 ) return console.log( `Not sending Discord message for 0 updates` )

	try {

		// Construct discord webhook message
		const message = {
			username: "Gretal Marchall Alon of Jupiter",
			content: `I emailed ${ amount } Rocketeer holders to tell them they have new outfits available in the changing room at https://mint.rocketeer.fans/#/outfits. Want to get email notifications too? Create an email address for your wallet at: https://signer.is/#/email, you'll get a monthly email when your Rocketeers have outfits available.`,
			avatar_url: "https://storage.googleapis.com/rocketeer-nft.appspot.com/mainnetRocketeers/1.jpg"
		}

		// Construct request options
		const options = {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify( message )
		}

		// Make webhook request
		const data = await fetch( discord.chatterwebhookurl, options )

	} catch( e ) {
		console.error( 'Discord error ', e )
	}

}