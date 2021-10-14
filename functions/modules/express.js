const express = require( 'express' )
const cors = require( 'cors' )


// CORS enabled express generator
module.exports = f => express().use( cors( { origin: true } ) )