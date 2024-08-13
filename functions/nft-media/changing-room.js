const { db, dataFromSnap, FieldValue } = require( '../modules/firebase' )
const { getRgbArrayFromColorName, randomNumberBetween } = require( '../modules/helpers' )
const { getTokenIdsOfAddress } = require( '../modules/contract' )
const svgFromAttributes = require( './svg-generator' )
const { notify_discord_of_new_outfit } = require( '../integrations/discord' )

// ///////////////////////////////
// Rocketeer outfit generator
// ///////////////////////////////
async function getRocketeerIfOutfitAvailable( id, network='mainnet', retry=false ) {

	if( retry ) console.log( `Retry of getRocketeerIfOutfitAvailable for ${ id } on ${ network }` )

	const newOutfitAllowedInterval = 1000 * 60 * 60 * 24 * 30

	// Retreive old Rocketeer data
	const rocketeer = await db.collection( `${ network }Rocketeers` ).doc( id ).get().then( dataFromSnap )

	// If this is a retry attempt, skip last change validation
	if( retry ) return rocketeer

	// Validate this request
	const { value: last_outfit_change } = rocketeer.attributes.find( ( { trait_type } ) => trait_type == "last outfit change" ) || { value: 0 }

	// Check whether this Rocketeer is allowed to change
	const timeUntilAllowedToChange = newOutfitAllowedInterval - ( Date.now() - last_outfit_change )
	if( timeUntilAllowedToChange > 0 ) throw new Error( `You changed your outfit too recently, a change is avalable in ${ Math.floor( timeUntilAllowedToChange / ( 1000 * 60 * 60 ) ) } hours (${ new Date( Date.now() + timeUntilAllowedToChange ).toString() })` )

	return rocketeer


}
async function generateNewOutfitFromId( id, network='mainnet', retry ) {

	/* ///////////////////////////////
	// Changing room variables
	// /////////////////////////////*/
	// Set the entropy level. 255 would mean 0 can become 255 and -255
	let colorEntropy = 10
	const specialEditionMultiplier = 1.1
	const entropyMultiplier = 1.1

	// Retreive old Rocketeer data if outfit is available
	const rocketeer = await getRocketeerIfOutfitAvailable( id, network, retry )

	// Validate this request
	const { value: available_outfits } = rocketeer.attributes.find( ( { trait_type } ) => trait_type == "available outfits" ) || { value: 0 }
	const { value: last_outfit_change } = rocketeer.attributes.find( ( { trait_type } ) => trait_type == "last outfit change" ) || { value: 0 }

	// Apply entropy levels based on edition status and outfits available
	const { value: edition } = rocketeer.attributes.find( ( { trait_type } ) => trait_type == "edition" )
	if( edition != 'regular' ) colorEntropy *= specialEditionMultiplier
	if( available_outfits ) colorEntropy *= ( entropyMultiplier ** available_outfits )

	// Grab attributes that will not change
	const staticAttributes = rocketeer.attributes.filter( ( { trait_type } ) => ![ 'last outfit change', 'available outfits' ].includes( trait_type ) )

	// Mark this Rocketeer as outfit changed so other requests can't clash with this one
	await db.collection( `${ network }Rocketeers` ).doc( id ).set( {
		attributes: [
			...staticAttributes,
			{ trait_type: 'available outfits', value: available_outfits + 1, },
			{ trait_type: 'last outfit change', value: Date.now(), display_type: "date" }
		]
	} ,{ merge: true } )

	// Generate colors with entropy based on color names
	rocketeer.attributes = rocketeer.attributes.map( attribute => {

		if( !attribute.trait_type.includes( 'color' ) ) return attribute

		// Generate rgb with entropy
		const rgbArray = getRgbArrayFromColorName( attribute.value )
		const rgb = rgbArray.map( baseValue => {

			// Choose whether to increment or decrement
			const increment = !!( Math.random() > .5 )

			// Determine by how much to change the color
			const entropy = increment ? colorEntropy : ( -1 * colorEntropy )

			// Generate a new value
			let newValue = randomNumberBetween( baseValue, baseValue + entropy )

			// If the color if out of bounds, cycle it into the 255 range
			if( newValue > 255 ) newValue -= 255
			if( newValue < 0 ) newValue = Math.abs( newValue )

			// Return the new rgb value
			return newValue

		} )

		const [ r, g, b ] =	rgb

		return {
			...attribute,
			value: `rgb( ${ r }, ${ g }, ${ b } )`
		}

	} )

	// Generate, compile and upload image
	// Path format of new rocketeers is id-outfitnumber.{svg,jpg}
	try {

		// Generate new outfit
		const newOutfitSvg = await svgFromAttributes( rocketeer.attributes, `${ network }Rocketeers/${ id }-${ available_outfits + 1 }` )

		// Notify discord
		const [ firstname ] = rocketeer.name.split( ' ' )
		await notify_discord_of_new_outfit(
			rocketeer.name,
			`${ firstname } obtained a new outfit on ${ network }! \n\nView this Rocketeer on Opensea: https://opensea.io/assets/0xb3767b2033cf24334095dc82029dbf0e9528039d/${ id }.\n\nView all outfits on the Rocketeer toolkit: https://tools.rocketeer.fans/#/outfits/${ id }.`,
			rocketeer.image,
			`Outfit #${ available_outfits + 1 }`,
			newOutfitSvg.replace( '.svg','.jpg' )
		).catch( e => console.error( `Error in notify_discord_of_new_outfit: `, e ) )

		return newOutfitSvg

	} catch( e ) {

		// If the svg generation failed, reset the attributes to their previous value
		await db.collection( `${ network }Rocketeers` ).doc( id ).set( {
			attributes: [
				...staticAttributes,
				{ trait_type: 'available outfits', value: available_outfits, },
				{ trait_type: 'last outfit change', value: last_outfit_change, display_type: "date" }
			]
		} ,{ merge: true } )

		// Propagate error
		throw e

	}

}

async function queueRocketeersOfAddressForOutfitChange( address, network='mainnet' ) {


	try {

		const ids = await getTokenIdsOfAddress( address, network )

		const idsWithOutfitsAvailable = await Promise.all( ids.map( async id => {

			try {

				// If rocketeer has outfit, return id
				await getRocketeerIfOutfitAvailable( id )
				return id

			} catch( e ) {

				// If no outfit available, return false
				return false

			}

		} ) )

		// Filter out the 'false' entries
		const onlyIds = idsWithOutfitsAvailable.filter( id => id )

		// Mark Rocketeers for processing
		await Promise.all( onlyIds.map( id => db.collection( `${ network }QueueOutfitGeneration` ).doc( id ).set( {
			updated: Date.now(),
			running: false,
			network,
			address
		}, { merge: true } ) ) )

		// Return amount queued for meta tracking
		return onlyIds.length


	} catch( e ) {

		console.error( `Error in queueRocketeersOfAddressForOutfitChange: `, e )
		throw e

	}


}

async function handleQueuedRocketeerOutfit( change, context ) {

	// If this was a deletion, exit gracefully
	if( !change.after.exists ) return

	// Get data
	const { rocketeerId } = context.params
	const { network, running, address, retry } = change.after.data()

	// If this was not a newly added queue item, exit gracefully
	if( !retry && change.before.exists ) return

	if( retry ) console.log( `Document change for ${network}QueueOutfitGeneration/${rocketeerId} is a retry attempt` )

	try {

		/////
		// Validations

		// If process is already running, stop
		if( running ) throw new Error( `Rocketeer ${ rocketeerId } is already generating a new outfit for ${ network }` )

		/////
		// Start the generation process

		// Mark this entry as running
		await db.collection( `${network}QueueOutfitGeneration` ).doc( rocketeerId ).set( { running: true, updated: Date.now() }, { merge: true } )

		// Generate the new outfit
		await generateNewOutfitFromId( rocketeerId, network, retry )

	} catch( e ) {

		// if this was just a "too recently" error, exit gracefully
		if( e.message.includes( 'You changed your outfit too recently' ) ) return

		// Log error to console and store
		console.error( `handleQueuedRocketeerOutfit error: `, e )
		await db.collection( 'errors' ).add( {
			source: `handleQueuedRocketeerOutfit`,
			network,
			rocketeerId,
			updated: Date.now(),
			timestamp: new Date().toString(),
			error: e.message || e.toString()
		} )

	} finally {

		// Delete queue entry
		await db.collection( `${network}QueueOutfitGeneration` ).doc( rocketeerId ).delete( )

		// Mark the outfits generating as decremented
		await db.collection( 'meta' ).doc( address ).set( {
			updated: Date.now(),
			outfits_in_queue: FieldValue.increment( -1 )
		}, { merge: true } )

	}



}

// async function generateNewOutfitsByAddress( address, network='mainnet' ) {


// 	try {
// 		const ids = await getTokenIdsOfAddress( address, network )

// 		// Build outfit generation queue
// 		const queue = ids.map( id => function() {

// 			// Generate new outfit and return it
// 			// Since "no outfit available until X" is an error, we'll catch the errors and propagate them
// 			return generateNewOutfitFromId( id, network ).then( outfit => ( { id: id, src: outfit } ) ).catch( e => {

// 				// Log out unexpected errors
// 				if( !e.message.includes( 'You changed your outfit too recently' ) ) console.error( 'Unexpected error in generateNewOutfitFromId: ', e )

// 				return { id: id, error: e.message || e.toString() }

// 			} )

// 		} )

// 		const outfits = await Throttle.all( queue, {
// 			maxInProgress: 10,
// 			failFast: false,
// 			progressCallback: ( { amountDone, rejectedIndexes } ) => {
// 				process.env.NODE_ENV == 'development' ? console.log( `Completed ${amountDone}/${queue.length}, rejected: `, rejectedIndexes ) : false
// 			}
// 		} )

// 		return {
// 			success: outfits.filter( ( { src } ) => src ),
// 			error: outfits.filter( ( { error } ) => error ),
// 		}

// 	} catch( e ) {
// 		console.error( `Error in generateNewOutfitsByAddress: `, e )
// 		throw e
// 	}


// }

module.exports = {
	generateNewOutfitFromId,
	// generateNewOutfitsByAddress,
	queueRocketeersOfAddressForOutfitChange,
	handleQueuedRocketeerOutfit
}