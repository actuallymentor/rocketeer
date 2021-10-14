const functions = require( 'firebase-functions' )
const testnetAPI = require( './modules/testnet' )
const mainnetAPI = require( './modules/mainnet' )

exports.testnetMetadata = functions.https.onRequest( testnetAPI )
exports.mainnetMetadata = functions.https.onRequest( mainnetAPI )