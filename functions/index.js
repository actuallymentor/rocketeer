const functions = require( 'firebase-functions' )
const testnetAPI = require( './endpoints/testnet' )
const mainnetAPI = require( './endpoints/mainnet' )

// Runtime config
const runtime = {
	timeoutSeconds: 540,
	memory: '4GB'
}

// Testnet endpoint
exports.testnetMetadata = functions.runWith( runtime ).https.onRequest( testnetAPI )

// Mainnet endpoint
exports.mainnetMetadata = functions.runWith( runtime ).https.onRequest( mainnetAPI )

/* ///////////////////////////////
// Firestore listeners
// /////////////////////////////*/
const { handleQueuedRocketeerOutfit } = require( './nft-media/changing-room' )
exports.mainnetGenerateOutfitsOnQueue = functions.runWith( runtime ).firestore.document( `mainnetQueueOutfitGeneration/{rocketeerId}` ).onWrite( handleQueuedRocketeerOutfit )
exports.rinkebyGenerateOutfitsOnQueue = functions.runWith( runtime ).firestore.document( `rinkebyQueueOutfitGeneration/{rocketeerId}` ).onWrite( handleQueuedRocketeerOutfit )
