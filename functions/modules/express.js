const express = require( 'express' )
const cors = require( 'cors' )



// CORS enabled express generator
module.exports = f => {

	const app = express()
	app.use( cors( { origin: true } ) )
	// Logger for debugging
	// app.use( ( req, res, next ) => {

	// 	console.log( 'base:', req.baseUrl, 'params:', req.params, 'body:', req.body, 'originalurl:', req.originalUrl, 'path:', req.path )

	// 	next()
	// } )

	return app

}