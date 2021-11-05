const functions = require( 'firebase-functions' )
const testnetAPI = require( './modules/testnet' )
const mainnetAPI = require( './modules/mainnet' )

// Runtime config
const runtime = {
	timeoutSeconds: 540,
	memory: '4GB'
}

// Testnet endpoint
exports.testnetMetadata = functions.runWith( runtime ).https.onRequest( testnetAPI )

// Mainnet endpoint
exports.mainnetMetadata = functions.runWith( runtime ).https.onRequest( mainnetAPI )