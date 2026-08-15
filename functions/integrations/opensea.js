const { contractAddress } = require( '../modules/contract' )
const puppeteer = require( 'puppeteer-extra' )
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const { get_browser_launch_options } = require( `../modules/browser` )

puppeteer.use( StealthPlugin() )

/* ///////////////////////////////
// Force opensea to update metadata
// /////////////////////////////*/
exports.forceOpenseaToUpdateMetadataForRocketeer = async function( tokenId, network='mainnet' ) {

	let browser

	try {

		const contract = contractAddress[ network ]

		browser = await puppeteer.launch( await get_browser_launch_options() )
		const page = await browser.newPage()

		await page.goto( `https://opensea.io/assets/${ contract }/${ tokenId }`, { waitUntil: 'networkidle2' } )
		await page.click( `i[value=refresh]` )
		await new Promise( resolve => setTimeout( resolve, 5_000 ) )

		return true

	} catch( e ) {
		// Silently log but do not break
		console.error( e )
	} finally {

		if( browser ) await browser.close().catch( error => console.error( error ) )

	}

}
