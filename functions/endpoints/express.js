const express = require( 'express' )
const cors = require( 'cors' )

// CORS enabled express generator
module.exports = f => {

	// Create express server
	const app = express()

	// Enable CORS
	app.use( cors( { origin: true } ) )

	// Enable body parser
	app.use( express.json() )

	return app

}