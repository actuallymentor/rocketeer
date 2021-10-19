const functions = require( 'firebase-functions' )
const testnetAPI = require( './modules/testnet' )
const mainnetAPI = require( './modules/mainnet' )

// Testnet endpoint
exports.testnetMetadata = functions.https.onRequest( testnetAPI )

// Mainnet endpoint
exports.mainnetMetadata = functions.https.onRequest( mainnetAPI )