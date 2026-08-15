const { initializeApp, applicationDefault } = require( `firebase-admin/app` )
const { getStorage } = require( `firebase-admin/storage` )
const throttle = require( `promise-parallel-throttle` )
const fetch = require( `isomorphic-fetch` )
const { gzip, constants: zlib_constants } = require( `zlib` )
const { promisify } = require( `util` )
const { compress_svg } = require( `../nft-media/svg-compressor` )

const gzip_async = promisify( gzip )
const immutable_cache = `public, max-age=31536000, immutable`

const arguments_list = process.argv.slice( 2 )
const has_argument = name => arguments_list.includes( `--${ name }` )
const argument_value = ( name, fallback ) => {

	const argument = arguments_list.find( value => value.startsWith( `--${ name }=` ) )
	return argument ? argument.slice( name.length + 3 ) : fallback

}

const numeric_argument = ( name, fallback ) => {

	const value = Number( argument_value( name, fallback ) )
	if( !Number.isFinite( value ) || value < 1 ) throw new Error( `--${ name } must be a positive number` )
	return value

}

const options = {
	apply: has_argument( `apply` ),
	all: has_argument( `all` ),
	bucket: argument_value( `bucket` ),
	prefix: argument_value( `prefix`, `` ),
	limit: numeric_argument( `limit`, 10 ),
	concurrency: numeric_argument( `concurrency`, 1 )
}

const output = value => process.stdout.write( `${ typeof value === `string` ? value : JSON.stringify( value, null, 2 ) }\n` )

const preserved_metadata = metadata => {

	const preserve = [ `contentDisposition`, `contentLanguage`, `metadata` ]
	const preserved = Object.fromEntries( preserve.filter( key => metadata[key] !== undefined ).map( key => [ key, metadata[key] ] ) )

	return {
		...preserved,
		contentType: `image/svg+xml`,
		contentEncoding: `gzip`,
		cacheControl: immutable_cache
	}

}

const download_file = async ( file, credential ) => {

	const { access_token } = await credential.getAccessToken()
	const url = new URL( `https://storage.googleapis.com/download/storage/v1/b/${ encodeURIComponent( file.bucket.name ) }/o/${ encodeURIComponent( file.name ) }` )
	url.searchParams.set( `alt`, `media` )

	const response = await fetch( url, { headers: { Authorization: `Bearer ${ access_token }` } } )
	if( !response.ok ) throw new Error( `Could not download ${ file.name }: ${ response.status } ${ response.statusText }` )

	return Buffer.from( await response.arrayBuffer() )

}

const compress_file = async ( file, apply, credential ) => {

	const [ metadata ] = await file.getMetadata()
	const contents = await download_file( file, credential )
	const optimized = compress_svg( contents.toString() )
	const compressed = await gzip_async( optimized.svg, { level: zlib_constants.Z_BEST_COMPRESSION } )
	const original_bytes = Number( metadata.size )
	const compressed_bytes = compressed.length
	const smaller = compressed_bytes < original_bytes

	if( apply && smaller ) await file.save( compressed, {
		resumable: false,
		validation: `crc32c`,
		predefinedAcl: `publicRead`,
		preconditionOpts: { ifGenerationMatch: Number( metadata.generation ) },
		metadata: preserved_metadata( metadata )
	} )

	return {
		name: file.name,
		status: apply && smaller ? `compressed` : smaller ? `dry-run` : `already-smaller`,
		removed_rasters: optimized.removed,
		retained_rasters: optimized.retained,
		original_bytes,
		compressed_bytes,
		saved_bytes: Math.max( 0, original_bytes - compressed_bytes )
	}

}

const summarize = results => results.reduce( ( summary, result ) => ( {
	files: summary.files + 1,
	changed_files: summary.changed_files + Number( [ `compressed`, `dry-run` ].includes( result.status ) ),
	original_bytes: summary.original_bytes + result.original_bytes,
	compressed_bytes: summary.compressed_bytes + result.compressed_bytes,
	saved_bytes: summary.saved_bytes + result.saved_bytes,
	removed_rasters: summary.removed_rasters + result.removed_rasters
} ), { files: 0, changed_files: 0, original_bytes: 0, compressed_bytes: 0, saved_bytes: 0, removed_rasters: 0 } )

const main = async () => {

	if( has_argument( `help` ) ) return output( [
		`Usage: npm run compress:storage:svgs -- [options]`,
		``,
		`Dry-run is the default and processes 10 SVGs.`,
		`--apply             overwrite smaller objects`,
		`--all               process every matching SVG`,
		`--limit=NUMBER      process at most NUMBER objects`,
		`--prefix=PREFIX     restrict object names`,
		`--bucket=NAME       override the default Firebase bucket`,
		`--concurrency=NUMBER  simultaneous downloads; default 1`
	].join( `\n` ) )

	const credential = applicationDefault()
	const project_id = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || credential.projectId
	const bucket_name = options.bucket || `${ project_id }.appspot.com`

	initializeApp( { credential, storageBucket: bucket_name } )

	const bucket = getStorage().bucket()
	const [ files ] = await bucket.getFiles( { prefix: options.prefix } )
	const svg_files = files.filter( file => file.name.endsWith( `.svg` ) ).sort( ( first, second ) => first.name.localeCompare( second.name ) )
	const selected_files = options.all ? svg_files : svg_files.slice( 0, options.limit )
	const queue = selected_files.map( file => async () => {

		try {

			return await compress_file( file, options.apply, credential )

		} catch( error ) {

			return {
				name: file.name,
				status: `failed`,
				error: error.message,
				removed_rasters: 0,
				retained_rasters: 0,
				original_bytes: 0,
				compressed_bytes: 0,
				saved_bytes: 0
			}

		}

	} )
	const results = await throttle.all( queue, {
		maxInProgress: options.concurrency,
		progressCallback: ( { amountDone } ) => {

			if( amountDone && amountDone % 10 === 0 ) process.stderr.write( `Processed ${ amountDone }/${ selected_files.length } SVGs\n` )
			if( global.gc ) global.gc()

		}
	} )

	const failed_files = results.filter( ( { status } ) => status === `failed` ).length

	output( {
		mode: options.apply ? `apply` : `dry-run`,
		bucket: bucket_name,
		prefix: options.prefix || null,
		available_files: svg_files.length,
		failed_files,
		...summarize( results ),
		results
	} )

	if( failed_files ) process.exitCode = 1

}

main().catch( error => {

	process.stderr.write( `${ error.stack }\n` )
	process.exitCode = 1

} )
