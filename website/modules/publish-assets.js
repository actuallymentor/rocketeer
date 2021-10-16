// promise based file parsing
const { del, mkdir } = require( __dirname + '/parse-fs' )
const { promises: fs } = require( 'fs' )

// Recursive copy library
const ncp = require( 'ncp' )

// Image parsing
const compressImage = require( __dirname + '/parse-images' )

// Promise ncp
const pncp = ( source, dest, opt ) => new Promise( ( resolve, reject ) => {

	ncp( source, dest, opt, err => err ? reject( err ) : resolve() )

} )

const copyfolder = async ( source, destination, filename ) => {

	await mkdir( destination )

	// No clobber means no overwrites for existing files
	await pncp( source, destination, { clobber: false } )
}

const copyassets = async ( site, filename ) => {

	try {

		const { extensions } = site.system.images

		// Delete relevant assets
		if( filename ) await del( `${ site.system.public }/assets/${ filename }` )
		else await del( site.system.public + 'assets/*' )

		// Copy entire asset folder
		await copyfolder( site.system.source + 'assets', site.system.public + 'assets' )

		// If single file, compress single file
		const [ fullmatch, extOfFilename ] = ( filename && filename.match( /(?:.*)(?:\.)(.*)/ ) ) || [ 0, [] ]
		if( extensions.includes( extOfFilename ) ) await compressImage( site, filename )

		// If not a single file, grab the images and compress them
		if( !filename ) {

			const allAssets = await fs.readdir( `${ site.system.source }/assets/` )
			const allImages = allAssets.filter( path => {
				const [ fm, ext ] = ( path && path.match( /(?:.*)(?:\.)(.*)/ )  ) || []
				return extensions.includes( ext )
			} )

			// Convert all
			await Promise.all( allImages.map( img => compressImage( site, img ) ) )

		}

	} catch( e ) {
		console.log( `Error copying assets: `, e )
		throw e
	}
	

}

module.exports = copyassets