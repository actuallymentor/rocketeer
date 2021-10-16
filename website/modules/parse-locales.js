const fs = require( 'fs' )
const { readFile } = require( './parse-fs' )

// Grab all pug files from the root of the source directory
const getJSONs = path => new Promise( ( resolve, reject ) => {
	fs.readdir( path, ( err, files ) => {
		if ( err ) return reject( err )
		// This will return an array of file names that contain .pug
		resolve( files.filter( file => { return file.includes( '.json' ) || file.includes( '.js' ) } ) )
	} )
} )

// Validate the structure of the json filename and get the lang for it
// Json file syntax should be language.json ( e.g. en.json or nl.json )
const validateJson = json => new Promise( ( resolve, reject ) => json.lang && json.slug.includes( '/' ) && resolve( json ) || reject( 'Invalid json' ) )

// Return the json files ( as pug syntax )
// Grab all .json files
const getContent = path => getJSONs( path )
// Grab the content of all .json files
// Get the content of each file with it's language string, outputs { filename, content }
.then( files => Promise.all( files.map( async file => {
	// Load js module
	if( file.includes( 'js' ) ) return require( `${path}/${file}` )
	// Extract json data from strings
	return readFile( path, file ).then( string =>  JSON.parse( string.data ) )
} ) ) )

// Validate that the jsons are well-formatted
.then( allJsons => Promise.all( allJsons.map( json => validateJson( json ) ) ) )

module.exports = getContent