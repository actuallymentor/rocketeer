const { db, dataFromSnap } = require( '../modules/firebase' )
const Web3 = require( 'web3' )
const web3 = new Web3()
const { getStorage } = require( 'firebase-admin/storage' )


module.exports = async function( req, res ) {

	const chain = process.env.NODE_ENV == 'development' ? '0x4' : '0x1'

	try {

		// Get request data
		const { message, signature, signatory } = req.body
		if( !message || !signatory || !signature ) throw new Error( `Malformed request` )

		// Decode message
		const confirmedSignatory = web3.eth.accounts.recover( message, signature )
		if( signatory.toLowerCase() !== confirmedSignatory.toLowerCase() ) throw new Error( `Bad signature` )

		// Validate message
		const messageObject = JSON.parse( message )
		const { signer, tokenId, validator, chainId } = messageObject
		if( signer.toLowerCase() !== confirmedSignatory.toLowerCase() || !tokenId || !validator || chainId !== chain ) throw new Error( `Invalid message` )

		// Check if validator was already assigned
		const validatorProfile = await db.collection( `${ chain === '0x1' ? 'mainnet' : 'rinkeby' }Validators` ).doc( validator ).get().then( dataFromSnap )
		if( validatorProfile && validatorProfile.owner !== signatory  ) throw new Error( `Validator already claimed by another wallet. If this is in error, contact mentor.eth on Discord.\n\nThe reason someone else can claim your validator is that we don't want to you to have to expose your validator private key to the world for security reasons <3` )

		// Write new data to db
		await db.collection( `${ chain === '0x1' ? 'mainnet' : 'rinkeby' }Validators` ).doc( validator ).set( {
			tokenId,
			owner: signatory,
			src: `https://storage.googleapis.com/rocketeer-nft.appspot.com/${ chain === '0x1' ? 'mainnet' : 'rinkeby' }Rocketeers/${ tokenId }.jpg`,
			updated: Date.now()
		} )

		// Update the static overview JSON
		const storage = getStorage()
		const bucket = storage.bucket()
		const cacheFile = bucket.file( `integrations/${ chain === '0x1' ? 'mainnet' : 'rinkeby' }Avatars.json` )

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
		const shouldBeUpdated = await db.collection( `${ chain === '0x1' ? 'mainnet' : 'rinkeby' }Validators` ).where( 'updated', '>', cachedJson.updated || tenSecondsAgo ).get().then( dataFromSnap )

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

		console.log( 'New data: ', cachedJson )

		return res.send( {
			success: true,
			url: cacheFile.publicUrl()
		} )

	} catch( e ) {

		console.error( 'avatar integration error: ', e )
		return res.send( {
			error: e.message
		} )

	}

}