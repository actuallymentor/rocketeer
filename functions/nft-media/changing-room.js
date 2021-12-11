const { db, dataFromSnap } = require( '../modules/firebase' )
const { getRgbArrayFromColorName, randomNumberBetween } = require( '../modules/helpers' )
const { getTokenIdsOfAddress } = require( '../modules/contract' )
const svgFromAttributes = require( './svg-generator' )
const Throttle = require( 'promise-parallel-throttle' )

// ///////////////////////////////
// Rocketeer generator
// ///////////////////////////////
async function generateNewOutfitFromId( id, network='mainnet' ) {


	/* ///////////////////////////////
	// Changing room variables
	// /////////////////////////////*/
	// Set the entropy level. 255 would mean 0 can become 255 and -255
	let colorEntropy = 10
	const newOutfitAllowedInterval = 1000 * 60 * 60 * 24 * 30
	const specialEditionMultiplier = 1.1
	const entropyMultiplier = 1.1

	// Retreive old Rocketeer data
	const rocketeer = await db.collection( `${ network }Rocketeers` ).doc( id ).get().then( dataFromSnap )

	// Validate this request
	const { value: available_outfits } = rocketeer.attributes.find( ( { trait_type } ) => trait_type == "available outfits" ) || { value: 0 }
	const { value: last_outfit_change } = rocketeer.attributes.find( ( { trait_type } ) => trait_type == "last outfit change" ) || { value: 0 }

	// Apply entropy levels based on edition status and outfits available
	const { value: edition } = rocketeer.attributes.find( ( { trait_type } ) => trait_type == "edition" )
	if( edition != 'regular' ) colorEntropy *= specialEditionMultiplier
	if( available_outfits ) colorEntropy *= ( entropyMultiplier ** available_outfits )

	// Check whether this Rocketeer is allowed to change
	const timeUntilAllowedToChange = newOutfitAllowedInterval - ( Date.now() - last_outfit_change )
	if( timeUntilAllowedToChange > 0 ) throw new Error( `You changed your outfit too recently, a change is avalable in ${ Math.floor( timeUntilAllowedToChange / ( 1000 * 60 * 60 ) ) } hours (${ new Date( Date.now() + timeUntilAllowedToChange ).toString() })` )

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

		const newOutfitSvg = await svgFromAttributes( rocketeer.attributes, `${ network }Rocketeers/${ id }-${ available_outfits + 1 }` )

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

async function generateNewOutfitsByAddress( address, network='mainnet' ) {


	const ids = await getTokenIdsOfAddress( address, network )
	const queue = ids.map( id => function() {
		return generateNewOutfitFromId( id, network ).then( outfit => ( { id: id, src: outfit } ) ).catch( e => ( { id: id, error: e.message } ) )
	} )
	const outfits = await Throttle.all( queue, {
		maxInProgress: 2,
		progressCallback: ( { amountDone } ) => process.env.NODE_ENV == 'development' ? console.log( `Completed ${amountDone}/${queue.length}` ) : false
	} )

	return {
		success: outfits.filter( ( { src } ) => src ),
		error: outfits.filter( ( { error } ) => error ),
	}


}

module.exports = {
	generateNewOutfitFromId,
	generateNewOutfitsByAddress
}