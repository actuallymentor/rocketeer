const readdir = require( 'recursive-readdir' )
const { readFile } = require( './parse-fs' )

// Grab all pug files from the root of the source directory
const getpugs = async srcPath => {

	const ignoreNonPugAndPugWithUnderscore = ( pathname, stats ) => {
		
		// Ignore system folders
		if( stats.isDirectory() ) {
			if( pathname.includes( `${ srcPath }/assets` ) ) return true
			if( pathname.includes( `${ srcPath }/js` ) ) return true
			if( pathname.includes( `${ srcPath }/css` ) ) return true
			if( pathname.includes( `${ srcPath }/content` ) ) return true
			if( pathname.includes( `${ srcPath }/pug` ) ) return true
		}

		// Traverse all other directories
		if( stats.isDirectory() ) return false

		// Ignore files that are not pugs or begin with an understore
		if( !pathname.includes( '.pug' ) ) return true
		if( pathname.match( /\/_.*\.pug$/ ) ) return true

		// Keep the rest
		return false
	}

	try {

		const filesWithFullPath = await readdir( srcPath, [ ignoreNonPugAndPugWithUnderscore ] )
		const filesRelativeToSrc = filesWithFullPath.map( pugpath => pugpath.replace( srcPath, '' ) )

		return filesRelativeToSrc

	} catch( e ) {
		console.error( `Error getting pugs from: `, e )
	}

}

// Use the above two promises to return the pug files ( as pug syntax )
// Grab all .pug files
const returnpugs = srcPath => getpugs( srcPath )
// Grab the content of all .pug files
.then( files => Promise.all( files.map( filename => readFile( srcPath, filename ) ) ) )

module.exports = returnpugs