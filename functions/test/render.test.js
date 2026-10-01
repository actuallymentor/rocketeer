const assert = require( `assert` )

// Exercise the bundled serverless Chromium exactly as production does, not a local Chrome
delete process.env.PUPPETEER_EXECUTABLE_PATH

const { render_svg_to_jpeg } = require( `../modules/browser` )

;( async () => {

	// Single-process serverless Chromium crashed on per-render browser contexts; this is the regression guard
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000px" height="1000px"><rect width="1000" height="1000" fill="rgb( 252, 186, 157 )"/></svg>`
	const jpeg = await render_svg_to_jpeg( svg, { quality: 80 } )

	// JPEG magic bytes and SOF0 dimensions
	assert.deepStrictEqual( [ ...jpeg.subarray( 0, 3 ) ], [ 0xFF, 0xD8, 0xFF ] )
	const sof = jpeg.indexOf( Buffer.from( [ 0xFF, 0xC0 ] ) )
	assert.strictEqual( jpeg.readUInt16BE( sof + 5 ), 1000 )
	assert.strictEqual( jpeg.readUInt16BE( sof + 7 ), 1000 )

	// Two renders in a row prove the browser lifecycle is clean
	await render_svg_to_jpeg( svg )

	process.stdout.write( `Render tests passed\n` )

} )().catch( error => {
	console.error( error )
	process.exit( 1 )
} )
