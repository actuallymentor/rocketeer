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

module.exports = { get_browser_launch_options }
