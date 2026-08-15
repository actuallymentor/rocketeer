const { readFile } = require( `fs/promises` )
const { join } = require( `path` )
const { applicationDefault } = require( `firebase-admin/app` )

const project_id = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || `rocketeer-nft`
const app_bucket = `rocketeer-nft.appspot.com`
const legacy_artifact_bucket = `us.artifacts.rocketeer-nft.appspot.com`
const billing_dataset = `cloud_billing_export`

// Wait beyond Google's scheduled hard-delete time before enforcing absence.
const hard_delete_complete_at = new Date( `2026-08-22T11:09:00Z` )
const verify = process.argv.includes( `--verify` )

const bytes_per_gib = 1024 ** 3
const credential = applicationDefault()

let access_token_cache

async function get_access_token() {

	if( access_token_cache ) return access_token_cache
	const { access_token } = await credential.getAccessToken()
	access_token_cache = access_token
	return access_token_cache

}

async function google_request( url, options={} ) {

	const access_token = await get_access_token()
	const response = await fetch( url, {
		...options,
		headers: {
			Authorization: `Bearer ${ access_token }`,
			...( options.body && { 'Content-Type': `application/json` } ),
			...options.headers
		}
	} )

	if( response.ok ) return response.json()

	const body = await response.text()
	throw new Error( `${ options.method || `GET` } ${ url } failed (${ response.status }): ${ body.slice( 0, 500 ) }` )

}

async function list_api( base_url, query={} ) {

	const items = []
	let page_token

	do {

		const url = new URL( base_url )
		Object.entries( { ...query, ...( page_token && { pageToken: page_token } ) } ).forEach( ( [ key, value ] ) => url.searchParams.set( key, value ) )

		const response = await google_request( url )
		items.push( ...( response.items || [] ) )
		page_token = response.nextPageToken

	} while( page_token )

	return items

}

const object_group = name => {

	if( name.startsWith( `mainnetRocketeers/` ) && name.endsWith( `.svg` ) ) return `mainnet_svg`
	if( name.startsWith( `rinkebyRocketeers/` ) && name.endsWith( `.svg` ) ) return `rinkeby_svg`
	return `other`

}

function summarize_objects( objects ) {

	return objects.reduce( ( summary, object ) => {

		const group = object_group( object.name )
		const bytes = Number( object.size || 0 )

		summary.all.count++
		summary.all.bytes += bytes
		summary[ group ].count++
		summary[ group ].bytes += bytes
		if( group !== `other` && object.contentEncoding === `gzip` ) summary[ group ].gzip++

		return summary

	}, {
		all: { count: 0, bytes: 0 },
		mainnet_svg: { count: 0, bytes: 0, gzip: 0 },
		rinkeby_svg: { count: 0, bytes: 0, gzip: 0 },
		other: { count: 0, bytes: 0 }
	} )

}

async function storage_report() {

	const buckets = await list_api( `https://storage.googleapis.com/storage/v1/b`, {
		project: project_id,
		maxResults: 1_000,
		projection: `noAcl`
	} )
	const soft_deleted_buckets = await list_api( `https://storage.googleapis.com/storage/v1/b`, {
		project: project_id,
		maxResults: 1_000,
		projection: `noAcl`,
		softDeleted: true
	} )
	const app_objects = await list_api( `https://storage.googleapis.com/storage/v1/b/${ app_bucket }/o`, {
		maxResults: 1_000,
		projection: `noAcl`
	} )
	const soft_deleted_app_objects = await list_api( `https://storage.googleapis.com/storage/v1/b/${ app_bucket }/o`, {
		maxResults: 1_000,
		projection: `noAcl`,
		softDeleted: true
	} )

	const live = summarize_objects( app_objects )
	const deleted = summarize_objects( soft_deleted_app_objects )
	const legacy_bucket = soft_deleted_buckets.find( ( { name } ) => name === legacy_artifact_bucket )

	return {
		live_buckets: buckets.map( ( { name, location, storageClass } ) => ( { name, location, storageClass } ) ),
		app_bucket: {
			...live,
			gib: live.all.bytes / bytes_per_gib,
			// EU multi-region Standard storage list price per GiB-month.
			estimated_standard_storage_monthly_usd: live.all.bytes / bytes_per_gib * 0.026
		},
		soft_deleted_app_bucket: {
			...deleted,
			gib: deleted.all.bytes / bytes_per_gib
		},
		legacy_artifact_bucket: legacy_bucket ? {
			soft_deleted: true,
			generation: legacy_bucket.generation,
			time_deleted: legacy_bucket.timeDeleted,
			hard_delete_time: legacy_bucket.hardDeleteTime
		} : { soft_deleted: false }
	}

}

async function detailed_billing_table() {

	try {

		const response = await google_request( `https://bigquery.googleapis.com/bigquery/v2/projects/${ project_id }/datasets/${ billing_dataset }/tables` )
		return ( response.tables || [] )
			.map( ( { tableReference: { tableId } } ) => tableId )
			.find( table_id => table_id.startsWith( `gcp_billing_export_resource_v1_` ) )

	} catch( error ) {

		if( error.message.includes( `(404)` ) ) return
		throw error

	}

}

const query_rows = ( schema, rows=[] ) => rows.map( ( { f } ) => Object.fromEntries( f.map( ( { v }, index ) => [ schema.fields[ index ].name, v ] ) ) )

async function run_billing_verification( table_id ) {

	const template = await readFile( join( __dirname, `verify-storage-costs.sql` ), `utf8` )
	const safe_table_id = table_id.match( /^[A-Za-z0-9_]+$/ )?.[0]
	if( !safe_table_id ) throw new Error( `Unexpected billing table name` )

	const table = `\`${ project_id }.${ billing_dataset }.${ safe_table_id }\``
	const query = template.replaceAll( `__DETAILED_TABLE__`, table )
	const response = await google_request( `https://bigquery.googleapis.com/bigquery/v2/projects/${ project_id }/queries`, {
		method: `POST`,
		body: JSON.stringify( { query, useLegacySql: false, location: `EU`, timeoutMs: 300_000 } )
	} )

	if( !response.jobComplete ) throw new Error( `Billing verification query did not complete within five minutes` )
	if( response.errors?.length ) throw new Error( `Billing verification query failed: ${ JSON.stringify( response.errors ) }` )

	return {
		status: `complete`,
		table: safe_table_id,
		rows: query_rows( response.schema, response.rows )
	}

}

function assert_storage_savings( storage ) {

	if( Date.now() < hard_delete_complete_at.getTime() ) throw new Error( `Verification must run after ${ hard_delete_complete_at.toISOString() }` )
	if( storage.legacy_artifact_bucket.soft_deleted ) throw new Error( `Legacy artifact bucket is still soft-deleted` )
	if( storage.soft_deleted_app_bucket.mainnet_svg.count ) throw new Error( `Soft-deleted mainnet SVGs remain` )
	if( storage.soft_deleted_app_bucket.rinkeby_svg.count ) throw new Error( `Soft-deleted rinkeby SVGs remain` )
	if( storage.app_bucket.all.gib > 30 ) throw new Error( `Live app bucket unexpectedly exceeds 30 GiB` )
	if( storage.app_bucket.mainnet_svg.gzip !== storage.app_bucket.mainnet_svg.count ) throw new Error( `A live mainnet SVG lacks gzip encoding` )
	if( storage.app_bucket.rinkeby_svg.gzip !== storage.app_bucket.rinkeby_svg.count ) throw new Error( `A live rinkeby SVG lacks gzip encoding` )

}

async function main() {

	const storage = await storage_report()
	const billing_table = await detailed_billing_table()
	const billing = billing_table
		? await run_billing_verification( billing_table )
		: { status: `pending`, reason: `Detailed Cloud Billing export table not found` }

	if( verify ) {

		assert_storage_savings( storage )
		if( billing.status !== `complete` ) throw new Error( billing.reason )

	}

	process.stdout.write( `${ JSON.stringify( { generated_at: new Date().toISOString(), project_id, storage, billing }, null, 2 ) }\n` )

}

main().catch( error => {

	process.stderr.write( `${ error.stack }\n` )
	process.exitCode = 1

} )
