const functions = require( 'firebase-functions' )
const { integration }= functions.config()
const { db, dataFromSnap } = require( '../modules/firebase' )
const Web3 = require( 'web3' )
const web3 = new Web3()
const { getStorage } = require( 'firebase-admin/storage' )


exports.setAvatar = async function( req, res ) {

	const chain = process.env.NODE_ENV == 'development' ? '0x4' : '0x1'
	// const chain = '0x1'

	try {

		// Get request data
		const { message, signature, signatory } = req.body
		if( !message || !signatory || !signature ) throw new Error( `Malformed request` )

		// Decode message
		const confirmedSignatory = web3.eth.accounts.recover( message, signature )
		if( signatory.toLowerCase() !== confirmedSignatory.toLowerCase() ) throw new Error( `Bad signature` )

		// Validate message
		const messageObject = JSON.parse( message )
		const { signer, tokenId, validator, chainId, network } = messageObject
		if( signer.toLowerCase() !== confirmedSignatory.toLowerCase() || !tokenId || !validator || chainId !== chain || !network ) throw new Error( `Invalid message` )

		// Check if validator was already assigned
		const validatorProfile = await db.collection( `${ network }Validators` ).doc( validator ).get().then( dataFromSnap )
		if( validatorProfile.owner && validatorProfile.owner !== signatory  ) throw new Error( `Validator already claimed by another wallet. If this is in error, contact mentor.eth on Discord.\n\nThe reason someone else can claim your validator is that we don't want to you to have to expose your validator private key to the world for security reasons <3` )

		// Write new data to db
		await db.collection( `${ network }Validators` ).doc( validator ).set( {
			tokenId,
			owner: signatory,
			src: `https://storage.googleapis.com/rocketeer-nft.appspot.com/${ network }Rocketeers/${ tokenId }.jpg`,
			updated: Date.now()
		} )

		// Update the static overview JSON
		const storage = getStorage()
		const bucket = storage.bucket()
		const cacheFile = bucket.file( `integrations/${ network }Avatars.json` )

		// Load existing json
		let jsonstring = '{}'
		const [ fileExists ] = await cacheFile.exists()
		if( fileExists ) {
			// Read old json
			const [ oldJson ] = await cacheFile.download()
			jsonstring = oldJson
		}
		const cachedJson = JSON.parse( jsonstring )

		// Get items that have not been updated
		const tenSecondsAgo = Date.now() - ( 10 * 1000 )
		const shouldBeUpdated = await db.collection( `${ network }Validators` ).where( 'updated', '>', cachedJson.updated || tenSecondsAgo ).get().then( dataFromSnap )

		// Update items that should be updated ( including current update )
		shouldBeUpdated.map( doc => {
			if( !cachedJson.images ) cachedJson.images = {}
			if( !cachedJson.ids ) cachedJson.ids = {}
			cachedJson.images[ doc.uid ] = doc.src
			cachedJson.ids[ doc.uid ] = doc.tokenId
		} )

		// Save new data to file
		cachedJson.updated = Date.now()
		cachedJson.trail = shouldBeUpdated.length
		await cacheFile.save( JSON.stringify( cachedJson ) )
		await cacheFile.makePublic()

		return res.json( {
			success: true,
			url: cacheFile.publicUrl()
		} )

	} catch( e ) {

		console.error( 'avatar integration error: ', e )
		return res.json( {
			error: e.message
		} )

	}

}

exports.resetAvatar = async function( req, res ) {

	// const chain = process.env.NODE_ENV == 'development' ? '0x4' : '0x1'
	const network = 'mainnet'
	// const chain = '0x1'

	try {

		// Get request data
		const { address, secret } = req.body
		if( !address || !secret || secret != integration.secret ) throw new Error( `Malformed request` )

		// Check if validator was already assigned
		await db.collection( `${ network }Validators` ).doc( address ).delete()

		// Update the static overview JSON
		const storage = getStorage()
		const bucket = storage.bucket()
		const cacheFile = bucket.file( `integrations/${ network }Avatars.json` )

		// Load existing json
		let jsonstring = '{}'
		const [ fileExists ] = await cacheFile.exists()
		if( fileExists ) {
			// Read old json
			const [ oldJson ] = await cacheFile.download()
			jsonstring = oldJson
		}
		const cachedJson = JSON.parse( jsonstring )

		// Delete the address
		if( cachedJson.images[ address ] ) delete jsonstring.images[ address ]
		if( cachedJson.ids[ address ] ) delete jsonstring.ids[ address ]

		// Save new data to file
		cachedJson.updated = Date.now()
		await cacheFile.save( JSON.stringify( cachedJson ) )
		await cacheFile.makePublic()

		return res.json( {
			success: true,
			url: cacheFile.publicUrl()
		} )

	} catch( e ) {

		console.error( 'avatar deletion integration error: ', e )
		return res.json( {
			error: e.message
		} )

	}

}