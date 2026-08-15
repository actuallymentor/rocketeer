const assert = require( `assert` )
const { JSDOM } = require( `jsdom` )
const { gzip, gunzip, constants: zlib_constants } = require( `zlib` )
const { promisify } = require( `util` )
const { compress_svg, prune_unused_raster_definitions } = require( `../nft-media/svg-compressor` )

const gzip_async = promisify( gzip )
const gunzip_async = promisify( gunzip )

const used_raster = `dXNlZA==`
const nested_raster = `bmVzdGVk`
const unused_raster = `dW51c2Vk`
const titled_raster = `dGl0bGVk`
const direct_raster = `ZGlyZWN0`

const source_svg = `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <defs>
        <image id="used" href="data:image/png;base64,${ used_raster }" />
        <image id="unused" href="data:image/png;base64,${ unused_raster }" />
        <image id='unused-with-title' href='data:image/png;base64,${ titled_raster }'><title>Unused</title></image>
        <g id="used-group">
            <image id="nested" href="data:image/png;base64,${ nested_raster }" />
        </g>
    </defs>
    <image id="visible-direct" href="data:image/png;base64,${ direct_raster }" />
    <use xlink:href="#used" />
    <use href="#used-group" />
</svg>`

const test_document_pruning = () => {

	const { window } = new JSDOM( source_svg )

	try {

		const result = prune_unused_raster_definitions( window.document )
		const output = window.document.querySelector( `svg` ).outerHTML

		assert.deepStrictEqual( result, { removed: 2, retained: 2 } )
		assert( output.includes( used_raster ) )
		assert( output.includes( nested_raster ) )
		assert( output.includes( direct_raster ) )
		assert( !output.includes( unused_raster ) )
		assert( !output.includes( titled_raster ) )

	} finally {

		window.close()

	}

}

const test_serialized_svg_compression = async () => {

	const result = compress_svg( source_svg )
	const compressed = await gzip_async( result.svg, { level: zlib_constants.Z_BEST_COMPRESSION } )
	const restored = await gunzip_async( compressed )

	assert.strictEqual( result.removed, 2 )
	assert.strictEqual( result.retained, 2 )
	assert( result.svg.startsWith( `<?xml version="1.0"?>` ) )
	assert( result.svg.includes( used_raster ) )
	assert( result.svg.includes( nested_raster ) )
	assert( result.svg.includes( direct_raster ) )
	assert( !result.svg.includes( unused_raster ) )
	assert( !result.svg.includes( titled_raster ) )
	assert( result.svg.includes( `<use xlink:href="#used" />` ) )
	assert.strictEqual( restored.toString(), result.svg )
	assert( compressed.length < Buffer.byteLength( result.svg ) )

}

Promise.resolve()
	.then( test_document_pruning )
	.then( test_serialized_svg_compression )
	.then( () => process.stdout.write( `SVG compressor tests passed\n` ) )
	.catch( error => {

		process.stderr.write( `${ error.stack }\n` )
		process.exitCode = 1

	} )
