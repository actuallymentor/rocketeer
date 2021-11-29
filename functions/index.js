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

// const { forceOpenseaToUpdateMetadataForRocketeer } = require( './integrations/opensea' )
// exports.refreshOpensea = functions.runWith( runtime ).https.onCall( ( id, context ) => forceOpenseaToUpdateMetadataForRocketeer( id ) )