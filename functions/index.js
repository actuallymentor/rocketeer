const functions = require( `firebase-functions/v1` )
const { runtime_config } = require( `./modules/runtime-config` )
const testnetAPI = require( './endpoints/testnet' )
const mainnetAPI = require( './endpoints/mainnet' )

// Runtime config
const expensive_runtime = {
	timeoutSeconds: 540,
	memory: '4GB',
	secrets: [ runtime_config ]
}

// SVG generation launches Chromium and extracts its binary into memory-backed /tmp.
const metadata_runtime = {
	timeoutSeconds: 540,
	memory: `2GB`,
	secrets: [ runtime_config ]
}

const cheap_runtime = {
	timeoutSeconds: 540,
	memory: '512MB',
	secrets: [ runtime_config ]
}

// Testnet endpoint
exports.testnetMetadata = functions.runWith( metadata_runtime ).https.onRequest( testnetAPI )

// Mainnet endpoint
exports.mainnetMetadata = functions.runWith( metadata_runtime ).https.onRequest( mainnetAPI )

/* ///////////////////////////////
// Firestore listeners
// /////////////////////////////*/
const { handleQueuedRocketeerOutfit } = require( './nft-media/changing-room' )
exports.mainnetGenerateOutfitsOnQueue = functions.runWith( expensive_runtime ).firestore.document( `mainnetQueueOutfitGeneration/{rocketeerId}` ).onWrite( handleQueuedRocketeerOutfit )
exports.rinkebyGenerateOutfitsOnQueue = functions.runWith( expensive_runtime ).firestore.document( `rinkebyQueueOutfitGeneration/{rocketeerId}` ).onWrite( handleQueuedRocketeerOutfit )

/* ///////////////////////////////
// Daemons
// /////////////////////////////*/
const { notify_holders_of_changing_room_updates } = require( './integrations/changingroom' )
exports.notify_holders_of_changing_room_updates = functions.runWith( cheap_runtime ).pubsub.schedule( '30 1 * * *' ).onRun( notify_holders_of_changing_room_updates )

/* ///////////////////////////////
// Manual actions
// /////////////////////////////*/
const { mark_rocketeers_as_gitched } = require('./integrations/glitched')
exports.mark_rocketeers_as_gitched = functions.https.onCall( mark_rocketeers_as_gitched )
