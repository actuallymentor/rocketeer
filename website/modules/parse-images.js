const sharp = require('sharp')
const fs = require( 'fs' )
const path = require( 'path' )
const { promises: pfs } = require( 'fs' )
const { mkdir } = require( __dirname + '/parse-fs' )

// No limit to streams
process.setMaxListeners( 0 )

// Promisify streams
const stream = ( readstream, writepath, transform ) => new Promise( ( resolve, reject ) => {

	// Dry run config for dev mode
	const { NODE_ENV } = process.env

	// Make the write stream
	const write = fs.createWriteStream( writepath )

	// Enable the writing pipe
	if( NODE_ENV == 'development' ) readstream.pipe( write )
	else readstream.pipe( transform ).pipe( write )
	write.on( 'close', resolve )
	write.on( 'error', reject )

} )


const compressOneImageToMany = async ( site, filename ) => {

	if( !filename ) return 'This was a deletion'

	try {

		// System settings
		const { system: { images } } = site
		const { sizes=[], defaultQuality } = images

		console.log( `⏱ Compressing ${ sizes.length * 3 } forms of `, `${ site.system.source }assets/${ filename }` )

		// Image metadata
		const filePath = `${ site.system.source }/assets/${ filename }`
		const metadata = await sharp( filePath ).metadata()
		const selectMaxSize = size => {
			if( size < metadata.width ) return size
			else return metadata.width
		}

		// Create convertor stream handlers
		const jpegConversionStreams = sizes.map( size => ( {
			convertor: sharp().resize( selectMaxSize( size ), undefined ).jpeg( { quality: defaultQuality } ),
			size: size,
			extension: 'jpg'
		} ) )

		const webpConversionStreams = sizes.map( size => ( {
			convertor: sharp().resize( selectMaxSize( size ), undefined ).webp( { quality: defaultQuality } ),
			size: size,
			extension: 'webp'
		} ) )

		const avifConversionStreams = sizes.map( size => ( {
			convertor: sharp().resize( selectMaxSize( size ), undefined ).avif( { quality: defaultQuality } ),
			size: size,
			extension: 'avif'
		} ) )

		// Read stream of the image
		const imageStream = fs.createReadStream( filePath )

		// Create the folder (or even subfolder) the image is in
		const parentFolder = path.dirname( filename )
		await mkdir( `${ site.system.public }/assets/${ parentFolder }` )

		// Create streams for all the transforms
		const [ fm, ext ] = ( filename && filename.match( /(?:.*)(?:\.)(.*)/ )  ) || []
		const fileNameWithoutExt = path.basename( filename, `.${ ext }` )

		await Promise.all( [ ...jpegConversionStreams, ...webpConversionStreams, ...avifConversionStreams ].map( ( { convertor, size, extension } ) => {
			return stream( imageStream, `${ site.system.public }/assets/${ fileNameWithoutExt }-${ size }.${ extension }`, convertor )
		} ) )

		console.log( '✅ Compression of ', `${ site.system.source }assets/${ filename }`, 'complete' )

	} catch( e ) {
		console.log( `Error compressing image: `, e )
		throw e
	}

}


module.exports = compressOneImageToMany