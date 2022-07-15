const { generateNewOutfitFromId, queueRocketeersOfAddressForOutfitChange } = require( '../nft-media/changing-room' )
const { db, dataFromSnap } = require( '../modules/firebase' )
const { dev, log } = require( '../modules/helpers' )
const { ask_signer_is_for_available_emails } = require( './signer_is' )
const { send_outfit_available_email } = require( './ses' )
const { throttle_and_retry } = require( '../modules/helpers' )
const { notify_discord_of_outfit_notifications } = require( './discord' )

// Web3 APIs
const { getOwingAddressOfTokenId } = require( '../modules/contract' )
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

		// Check that the signer is the owner of the token
		const owner = await getOwingAddressOfTokenId( id, network )
		if( owner !== confirmedSignatory ) throw new Error( `You are not the owner of this Rocketeer. Did you sign with the right wallet?` )

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
// POST handler for new avatars
// /////////////////////////////*/
exports.generateMultipleNewOutfits = async function( req, res ) {

	// Parse the request
  let { address } = req.params
  if( !address ) return res.json( { error: `No address specified in URL` } )

  // Protect against malformed input
  if( !address.match( /0x.{40}/ ) ) return res.json( { error: `Malformed request` } )

	// Lowercase the address
	address = address.toLowerCase()

  // Internal beta
  // if( !address.includes( '0xe3ae14' ) && !address.includes( '0x7dbf68' ) ) return res.json( { error: `Sorry this endpoint is in private beta for now <3` } )

	try {

		// Get request data
		const { message, signature, signatory } = req.body
		if( !message || !signatory || !signature ) throw new Error( `Malformed request` )

		// Decode message
		const confirmedSignatory = web3.eth.accounts.recover( message, signature )
		if( signatory.toLowerCase() !== confirmedSignatory.toLowerCase() ) throw new Error( `Bad signature` )

		// Validate message
		const messageObject = JSON.parse( message )
		let { signer, action, chainId } = messageObject
		const network = chainId == '0x1' ? 'mainnet' : 'rinkeby'
		if( signer.toLowerCase() !== confirmedSignatory.toLowerCase() || action != 'generateMultipleNewOutfits' || !network ) throw new Error( `Invalid setPrimaryOutfit message with ${ signer }, ${confirmedSignatory}, ${action}, ${chainId}, ${network}` )


		// Check that the signer is the owner of the token
		const amountOfOutfits = await queueRocketeersOfAddressForOutfitChange( address, network )

		await db.collection( 'meta' ).doc( address ).set( {
			last_changing_room: Date.now(),
			outfits_last_changing_room: amountOfOutfits,
			outfits_in_queue: amountOfOutfits,
			updated: Date.now()
		}, { merge: true } )

		return res.json( { amountOfOutfits } )



  } catch( e ) {

      // Log error for debugging
      console.error( `POST generateMultipleNewOutfits Changing room api error for ${ address }: `, e )

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

		// Check that the signer is the owner of the token
		const owner = await getOwingAddressOfTokenId( id, network )
		if( owner !== confirmedSignatory ) throw new Error( `You are not the owner of this Rocketeer. Did you sign with the right wallet?` )

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

/* ///////////////////////////////
// Notify of changing room updates
// /////////////////////////////*/
exports.notify_holders_of_changing_room_updates = async context => {

	const newOutfitAllowedInterval = 1000 * 60 * 60 * 24 * 30

	try {

		// Get all Rocketeers with outfits available
		const network = dev ? `rinkeby` : `mainnet`
		const limit = dev ? 5 : 5000 // max supply 3475
		console.log( `Getting ${ limit } rocketeers on ${ network }` )
		let all_rocketeers = await db.collection( `${ network }Rocketeers` ).limit( limit ).get().then( dataFromSnap )
		console.log( `Got ${ all_rocketeers.length } Rocketeers` )

		// FIlter out API abuse rocketeers
		all_rocketeers = all_rocketeers.filter( ( {uid} ) => uid > 0 && uid <= 3475 )
		console.log( `Proceeding with ${ all_rocketeers.length } valid Rocketeers` )
		

		// Check which rocketeers have outfits available
		const has_outfit_available = all_rocketeers.filter( rocketeer => {

			const { value: last_outfit_change } = rocketeer.attributes.find( ( { trait_type } ) => trait_type === 'last outfit change' ) || { value: 0 }
			const timeUntilAllowedToChange = newOutfitAllowedInterval - ( Date.now() - last_outfit_change )

			// Keep those with changes allowed
			if( timeUntilAllowedToChange < 0 ) return true

			// If outfit available in the future, discard
			return false

		} )

		// Get the owning wallets of available outfits
		const owner_getting_queue = has_outfit_available.map( ( { uid } ) => async () => {
			log( `Getting owner of ${ uid }` )
			const owning_address = await getOwingAddressOfTokenId( uid )
			return { uid, owning_address }
		} )
		let owners = await throttle_and_retry( owner_getting_queue, 10, `get owners`, 2, 5 )
		console.log( `${ owners.length } Rocketeer owners found` )

		// Get the owners we have already emailed recently
		const owner_meta = await db.collection( `meta` ).get().then( dataFromSnap )
		const owners_emailed_recently = owner_meta
											.filter( ( { last_emailed_about_outfit } ) => last_emailed_about_outfit > ( Date.now() - newOutfitAllowedInterval ) )
											.map( ( { uid } ) => uid )
		
		// Remove owners from list of they were emailed too recently
		console.log( `${ owners_emailed_recently.length } owners emailed too recently` )
		owners = owners.filter( address => !owners_emailed_recently.includes( address ) )

		// Check which owners have signer.is emails
		const owners_with_signer_email = await ask_signer_is_for_available_emails( owners.map( ( { owning_address } ) => owning_address ) )
		console.log( `Owners with signer emails ${ owners_with_signer_email.length }` )

		// Format rocketeers by address
		const rocketeers_by_address = has_outfit_available.reduce( ( wallets, rocketeer ) => {

			const new_wallet_list = { ...wallets }
			const { owning_address } = owners.find( ( { uid } ) => uid == rocketeer.uid )

			// If this owner has no email, ignore it
			if( !owners_with_signer_email.includes( owning_address ) ) return new_wallet_list

			// If the wallet object does now have this one yet, add an empty array
			if( !new_wallet_list[ owning_address ] ) new_wallet_list[owning_address] = []

			new_wallet_list[owning_address] = [ ...new_wallet_list[owning_address], rocketeer ]
			return new_wallet_list

		}, {} )

		// List the owning emails
		const owners_to_email = Object.keys( rocketeers_by_address )
		console.log( `${ owners_to_email.length } owners to email: `, owners_to_email.slice( 0, 10 ).join( ', ' ) )

		// Take note of who we emailed so as to not spam them
		const meta_writing_queue = owners_to_email.map( ( address ) => () => {

			return db.collection( `meta` ).doc( address ).set( { last_emailed_about_outfit: Date.now(), updated: Date.now(), updated_human: new Date().toString() }, { merge: true } )

		} )
		await throttle_and_retry( meta_writing_queue, 50, `keep track of who we emailed`, 2, 10 )

		// Send emails to the relevant owners
		console.log( `Sending email to ${ owners_to_email.length } addresses` )
		const email_sending_queue = owners_to_email.map( ( owning_address ) => async () => {

			const rocketeers = rocketeers_by_address[ owning_address ]
			await send_outfit_available_email( rocketeers, `${ owning_address }@signer.is` )

		} )
		await throttle_and_retry( email_sending_queue, 10, `send email`, 2, 10 )

		// Log result
		console.log( `Sent ${ owners_to_email.length } emails for ${ network } outfits` )

		// Notify Discord too
		await notify_discord_of_outfit_notifications( owners_to_email.length )


	} catch( e ) {
		console.error( `notify_holders_of_changing_room_updates error: `, e )
	}

}