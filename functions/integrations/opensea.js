const { contractAddress } = require( '../modules/contract' )
const puppeteer = require( 'puppeteer-extra' )
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

/* ///////////////////////////////
// Force opensea to update metadata
// /////////////////////////////*/
exports.forceOpenseaToUpdateMetadataForRocketeer = async function( tokenId, network='mainnet' ) {

	try {

		const contract = contractAddress[ network ]

		puppeteer.use(StealthPlugin())

		const browser = await puppeteer.launch( { headless: true } )
		const page = await browser.newPage()

		await page.goto( `https://opensea.io/assets/${ contract }/${ tokenId }`, { waitUntil: 'networkidle2' } )
		await page.screenshot( { path: 'pre-debug.png' } )
		await page.click( `i[value=refresh]` )
		await page.waitForTimeout(5000)
		await browser.close()

		return true

	} catch( e ) {
		// Silently log but do not break
		console.error( e )
	}

}