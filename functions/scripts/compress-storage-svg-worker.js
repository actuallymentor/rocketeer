const { parentPort } = require( `worker_threads` )
const { gzip, constants: zlib_constants } = require( `zlib` )
const { promisify } = require( `util` )
const { compress_svg } = require( `../nft-media/svg-compressor` )

const gzip_async = promisify( gzip )

// JSDOM retains substantial heap after large SVGs. Compress one document per
// disposable worker so the operating system can reclaim that memory exactly.
parentPort.once( `message`, async contents => {

	try {

		const optimized = compress_svg( Buffer.from( contents ).toString() )
		const compressed = await gzip_async( optimized.svg, { level: zlib_constants.Z_BEST_COMPRESSION } )
		const transferable = compressed.buffer.slice( compressed.byteOffset, compressed.byteOffset + compressed.byteLength )

		parentPort.postMessage( {
			compressed: transferable,
			removed: optimized.removed,
			retained: optimized.retained
		}, [ transferable ] )

	} catch( error ) {

		parentPort.postMessage( { error: error.stack || error.message } )

	}

} )
