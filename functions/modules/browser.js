const chromium = require( `@sparticuz/chromium` )

/**
 * Returns launch options for local Chromium or the compressed cloud binary.
 * @returns {Promise<Object>} Puppeteer launch options.
 */
async function get_browser_launch_options() {

	const local_executable = process.env.PUPPETEER_EXECUTABLE_PATH
	if( local_executable ) return {
		executablePath: local_executable,
		args: [ `--no-sandbox`, `--disable-setuid-sandbox` ],
		headless: true
	}

	return {
		executablePath: await chromium.executablePath(),
		args: chromium.args,
		headless: `shell`
	}

}

/**
 * Renders an SVG string to a JPEG in the browser's default context.
 * Serverless Chromium runs in single-process mode, which crashes when a new
 * browser context is created, so this avoids converters that open one per render.
 * @param {string} svg - Complete SVG document
 * @param {Object} options
 * @param {number} options.quality - JPEG quality, 0-100
 * @param {number} options.size - Square output size in pixels, matching the 1000px master
 * @returns {Promise<Buffer>} JPEG bytes
 */
async function render_svg_to_jpeg( svg, { quality=80, size=1000 } = {} ) {

	const puppeteer = require( `puppeteer-core` )
	const browser = await puppeteer.launch( await get_browser_launch_options() )

	try {

		// White page with no margins so the SVG fills the viewport exactly
		const page = await browser.newPage()
		await page.setViewport( { width: size, height: size } )
		await page.setContent( `<!DOCTYPE html><html><head><meta charset="utf-8"><style>* { margin: 0; padding: 0; } html { background-color: #FFF; }</style></head><body>${ svg }</body></html>`, { waitUntil: `load` } )

		const jpeg = await page.screenshot( { type: `jpeg`, quality, clip: { x: 0, y: 0, width: size, height: size } } )
		return Buffer.from( jpeg )

	} finally {
		await browser.close().catch( error => console.error( `Error closing render browser: `, error ) )
	}

}

module.exports = { get_browser_launch_options, render_svg_to_jpeg }
