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

const preserved_metadata = ( metadata, acl ) => {

	const preserve = [ `contentDisposition`, `contentLanguage`, `metadata`, `storageClass` ]
	const preserved = Object.fromEntries( preserve.filter( key => metadata[key] !== undefined ).map( key => [ key, metadata[key] ] ) )
	const preserved_acl = acl && acl.map( ( { entity, role } ) => ( { entity, role } ) )

	return {
		...preserved,
		...( preserved_acl ? { acl: preserved_acl } : {} ),
		contentType: `image/svg+xml`,
		contentEncoding: `gzip`,
		cacheControl: immutable_cache
	}

}

const access_token_provider = credential => {

	let access_token
	let refresh_at = 0
	let refresh_promise

	return async () => {

		if( access_token && Date.now() < refresh_at ) return access_token

		if( !refresh_promise ) refresh_promise = credential.getAccessToken().then( token => {

			access_token = token.access_token
			refresh_at = Date.now() + ( Number( token.expires_in ) * 1_000 ) - 60_000

			return access_token

		} ).finally( () => refresh_promise = undefined )

		return refresh_promise

	}

}

const download_file = async ( file, get_access_token ) => {

	const access_token = await get_access_token()
	const url = new URL( `https://storage.googleapis.com/download/storage/v1/b/${ encodeURIComponent( file.bucket.name ) }/o/${ encodeURIComponent( file.name ) }` )
	url.searchParams.set( `alt`, `media` )

	const response = await fetch( url, { headers: { Authorization: `Bearer ${ access_token }` } } )
	if( !response.ok ) throw new Error( `Could not download ${ file.name }: ${ response.status } ${ response.statusText }` )

	return Buffer.from( await response.arrayBuffer() )

}

const compress_file = async ( file, apply, get_access_token, object_acl_enabled ) => {

	const [ metadata ] = await file.getMetadata()
	const contents = await download_file( file, get_access_token )
	const optimized = compress_svg( contents.toString() )
	const compressed = await gzip_async( optimized.svg, { level: zlib_constants.Z_BEST_COMPRESSION } )
	const original_bytes = Number( metadata.size )
	const compressed_bytes = compressed.length
	const smaller = compressed_bytes < original_bytes

	if( apply && smaller ) {

		// Rewriting replaces the object ACL. Include it in the same upload so
		// private files stay private and custom readers are not lost.
		const [ acl ] = object_acl_enabled ? await file.acl.get() : [ undefined ]

		await file.save( compressed, {
			resumable: false,
			validation: `crc32c`,
			preconditionOpts: { ifGenerationMatch: Number( metadata.generation ) },
			metadata: preserved_metadata( metadata, acl )
		} )

	}

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
		`--apply             overwrite smaller objects; requires --prefix`,
		`--all               process every matching SVG`,
		`--limit=NUMBER      process at most NUMBER objects`,
		`--prefix=PREFIX     restrict object names`,
		`--bucket=NAME       override the default Firebase bucket`,
		`--concurrency=NUMBER  simultaneous downloads; default 1`
	].join( `\n` ) )

	const credential = applicationDefault()
	const configured_project_id = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || credential.projectId
	const project_id = configured_project_id || ( credential.getProjectId && await credential.getProjectId() )

	if( !project_id ) throw new Error( `Could not determine a Google Cloud project ID` )
	if( options.apply && !options.prefix ) throw new Error( `--apply requires --prefix to prevent an accidental whole-bucket rewrite` )

	const bucket_name = options.bucket || `${ project_id }.appspot.com`

	initializeApp( { credential, storageBucket: bucket_name } )

	const bucket = getStorage().bucket()
	const [ bucket_metadata ] = await bucket.getMetadata()
	const soft_delete_seconds = Number( bucket_metadata.softDeletePolicy && bucket_metadata.softDeletePolicy.retentionDurationSeconds )
	const object_acl_enabled = !( bucket_metadata.iamConfiguration && bucket_metadata.iamConfiguration.uniformBucketLevelAccess && bucket_metadata.iamConfiguration.uniformBucketLevelAccess.enabled )

	if( options.apply && !soft_delete_seconds ) throw new Error( `--apply requires an enabled Cloud Storage soft-delete policy for rollback` )

	const get_access_token = access_token_provider( credential )
	const [ files ] = await bucket.getFiles( { prefix: options.prefix } )
	const svg_files = files.filter( file => file.name.endsWith( `.svg` ) ).sort( ( first, second ) => first.name.localeCompare( second.name ) )
	const selected_files = options.all ? svg_files : svg_files.slice( 0, options.limit )
	const queue = selected_files.map( file => async () => {

		try {

			return await compress_file( file, options.apply, get_access_token, object_acl_enabled )

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
