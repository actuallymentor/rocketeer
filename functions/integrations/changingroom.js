const { generateNewOutfitFromId } = require( '../nft-media/changing-room' )
const { db, dataFromSnap } = require( '../modules/firebase' )
const Web3 = require( 'web3' )
const web3 = new Web3()

/* ///////////////////////////////
// POST handler for new avatars
// /////////////////////////////*/
exports.generateNewOutfit = async function( req, res ) {

	// Parse the request
    let { id } = req.params
    if( !id ) return res.json( { error: `No ID specified in URL` } )

    // Protect against malformed input
    id = Math.floor( Math.abs( id ) )
    if( typeof id !== 'number' ) return res.json( { error: `Malformed request` } )

    // Set ID to string so firestore can handle it
    id = `${ id }`

	try {

		// Get request data
		const { message, signature, signatory } = req.body
		if( !message || !signatory || !signature ) throw new Error( `Malformed request` )

		// Decode message
		const confirmedSignatory = web3.eth.accounts.recover( message, signature )
		if( signatory.toLowerCase() !== confirmedSignatory.toLowerCase() ) throw new Error( `Bad signature` )

		// Validate message
		const messageObject = JSON.parse( message )
		const { signer, rocketeerId, chainId } = messageObject
		const network = chainId == '0x1' ? 'mainnet' : 'rinkeby'
		if( signer.toLowerCase() !== confirmedSignatory.toLowerCase() || !rocketeerId || !network ) throw new Error( `Invalid generateNewOutfit message with ${signer}, ${confirmedSignatory}, ${rocketeerId}, ${network}` )
		if( rocketeerId != id ) throw new Error( `Invalid Rocketeer in message` )

		// Generate new rocketeer svg
		const mediaLink = await generateNewOutfitFromId( id, network )

		return res.json( {
			outfit: mediaLink
		} )

    } catch( e ) {

        // Log error for debugging
        console.error( `POST Changing room api error for ${ id }: `, e )

        // Return error to frontend
        return res.json( { error: e.mesage || e.toString() } )

    }

}

/* ///////////////////////////////
// PUT handler for changing the 
// current outfit
// /////////////////////////////*/
exports.setPrimaryOutfit = async function( req, res ) {

	// Parse the request
    let { id } = req.params
    if( !id ) return res.json( { error: `No ID specified in URL` } )

    // Protect against malformed input
    id = Math.floor( Math.abs( id ) )
    if( typeof id !== 'number' ) return res.json( { error: `Malformed request` } )

    // Set ID to string so firestore can handle it
    id = `${ id }`

	try {

		// Get request data
		const { message, signature, signatory } = req.body
		if( !message || !signatory || !signature ) throw new Error( `Malformed request` )

		// Decode message
		const confirmedSignatory = web3.eth.accounts.recover( message, signature )
		if( signatory.toLowerCase() !== confirmedSignatory.toLowerCase() ) throw new Error( `Bad signature` )

		// Validate message
		const messageObject = JSON.parse( message )
		let { signer, outfitId, chainId } = messageObject
		const network = chainId == '0x1' ? 'mainnet' : 'rinkeby'
		if( signer.toLowerCase() !== confirmedSignatory.toLowerCase() || outfitId == undefined || !network ) throw new Error( `Invalid setPrimaryOutfit message with ${ signer }, ${confirmedSignatory}, ${outfitId}, ${chainId}, ${network}` )
		
		// Validate id format
		outfitId = Math.floor( Math.abs( outfitId ) )
		if( typeof outfitId !== 'number' ) return res.json( { error: `Malformed request` } )

		// Set ID to string so firestore can handle it
		outfitId = `${ outfitId }`

		// Retreive old Rocketeer data
		const rocketeer = await db.collection( `${ network }Rocketeers` ).doc( id ).get().then( dataFromSnap )

		// Grab attributes that will not change
		const { value: available_outfits } = rocketeer.attributes.find( ( { trait_type } ) => trait_type == "available outfits" ) || { value: 0 }

		// Only allow to set existing outfits
		if( available_outfits < outfitId ) throw new Error( `Your Rocketeer has ${ available_outfits }, you can't select outfit ${ outfitId }` )

		// Change the primary media file
		const imagePath = `${ outfitId == 0 ? id : `${ id }-${ outfitId }` }.jpg`
		await db.collection( `${ network }Rocketeers` ).doc( id ).set( {
			image: `https://storage.googleapis.com/rocketeer-nft.appspot.com/${ network }Rocketeers/${ imagePath }`
		}, { merge: true } )

		return res.json( { success: true } )



    } catch( e ) {

        // Log error for debugging
        console.error( `PUT Changing room api error for ${ id }: `, e )

        // Return error to frontend
        return res.json( { error: e.mesage || e.toString() } )

    }

}