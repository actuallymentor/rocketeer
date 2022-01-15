const masterPath = `${ __dirname }/../assets/master.svg`
const jsdom = require("jsdom")
const { JSDOM } = jsdom
const { promises: fs } = require( 'fs' )
const { getStorage } = require( 'firebase-admin/storage' )

// SVG to JPEG
const { convert } = require("convert-svg-to-jpeg")

// Existing file checker
const failIfFilesExist = async ( svg, jpeg, path ) => {

	const [ [ svgExists ], [ jpegExists ] ] = await Promise.all( [ svg.exists(), jpeg.exists() ] )
	if( svgExists || jpegExists ) throw new Error( `${ svgExists ? 'SVG' : '' } ${ jpegExists ? ' and JPEG' : '' } already present at ${ path }. This should never happen!` )


}

module.exports = async function svgFromAttributes( attributes=[], path='' ) {

	// Validations
	if( !path.length ) throw new Error( 'svgFromAttributes missing path' )
	if( !attributes.length ) throw new Error( 'svgFromAttributes missing attributes' )

	// Create file references and check whether they already exist
	const storage = getStorage()
	const bucket = storage.bucket()
	const svgFile = bucket.file( `${path}.svg` )
	const rasterFile = bucket.file( `${path}.jpg` )
	await failIfFilesExist( svgFile, rasterFile, path )

	// Get properties
	const { value: primary_color } = attributes.find( ( { trait_type } ) => trait_type == "outfit color" )
	const { value: accent_color } = attributes.find( ( { trait_type } ) => trait_type == "outfit accent color" )
	const { value: backpack_color } = attributes.find( ( { trait_type } ) => trait_type == "backpack color" )
	const { value: visor_color } = attributes.find( ( { trait_type } ) => trait_type == "visor color" )
	const { value: backpack } = attributes.find( ( { trait_type } ) => trait_type == "backpack" )
	const { value: panel } = attributes.find( ( { trait_type } ) => trait_type == "panel" )
	const { value: patch } = attributes.find( ( { trait_type } ) => trait_type == "patch" )
	const { value: helmet } = attributes.find( ( { trait_type } ) => trait_type == "helmet" )
	const { value: background } = attributes.find( ( { trait_type } ) => trait_type == "background" )
	const { value: background_complexity } = attributes.find( ( { trait_type } ) => trait_type == "background complexity" )

	// Generate DOM to work with
	const svgString = await fs.readFile( masterPath, 'utf8' )
	const { window: { document } } = new JSDOM( svgString )

	// ///////////////////////////////
	// Attribute selection
	// ///////////////////////////////

	// Remove obsolete patches
	const obsoletePatches = [ 'nimbus', 'teku', 'lighthouse', 'prysm', 'rocketpool' ].filter( p => p !== patch )
	for ( let i = obsoletePatches.length - 1; i >= 0; i-- ) {
		const element  = document.querySelector( `#${ obsoletePatches[i] }` )
		if( element ) element.remove()
		else console.log( `Could not find #${ obsoletePatches[i] }` )
	}

	// Remove obsolete hemets
	const obsoleteHelmets = [ 'classic', 'racer', 'punk', 'knight', 'geek' ].filter( p => p !== helmet )
	for ( let i = obsoleteHelmets.length - 1; i >= 0; i-- ) {
		const element = document.querySelector( `#${ obsoleteHelmets[i] }` )
		if( element ) element.remove()
		else console.log( `Could not find #${ obsoleteHelmets[i] }` )
	}

	// Remove panel if need be
	if( panel === 'no' ) {
		const element = document.querySelector( `#panel` )
		if( element ) element.remove()
		else console.log( `Could not find #panel` )
	}

	// Remove backpack if need be
	if( backpack === 'no' ) {
		const element = document.querySelector( `#backpack` )
		if( element ) element.remove()
		else console.log( 'Could not find #backpack' )
	}

	// Remove obsolete backgrounds
	const obsoleteBackgrounds = [ 'planets', 'system', 'playful', 'moon', 'galaxy', 'chip' ].filter( p => p !== background )
	for ( let i = obsoleteBackgrounds.length - 1; i >= 0; i-- ) {
		const element = document.querySelector( `#${ obsoleteBackgrounds[i] }` )
		if( element ) element.remove()
		else console.log( `Could not find #${ obsoleteBackgrounds[i] }` )
	}

	// ///////////////////////////////
	// Background customisation
	// ///////////////////////////////

	// In playful, keeping things is basic, removing them is cool
	if( background === 'playful' ) {

		const toRemove = background_complexity
		for ( let i = 1; i <= toRemove; i++ ) {
			const element = document.querySelector( `#playful-element-${ 5 - i }` )
			if( element ) element.remove()
			else console.log( `Could not find #playful-element-${ 5 - i }` )
		}

	} else {

		// In others, keeping is cool, and removing is less cool
		// so higher rarity means less looping
		const toRemove = 4 - background_complexity
		for ( let i = 1; i <= toRemove; i++ ) {
			const element = document.querySelector( `#${ background }-element-${ 5 - i }` )
			if( element ) element.remove()
			else console.log( `Could not find #${ background }-element-${ 5 - i }` )
		}

	}

	// ///////////////////////////////
	// Color substitutions
	// ///////////////////////////////
	const defaultPrimary = /rgb\( ?252 ?, ?186 ?, ?157 ?\)/ig
	const defaultVisor = /rgb\( ?71 ?, ?22 ?, ?127 ?\)/ig
	const defaultAccent = /rgb\( ?243 ?, ?99 ?, ?113 ?\)/ig
	const defaultBackpack = /rgb\( ?195 ?, ?178 ?, ?249 ?\)/ig

	// Substitutions
	const replace = ( from, to ) => {
		const replaced = document.querySelector( 'svg' ).innerHTML.replace( from, to )
		document.querySelector( 'svg' ).innerHTML = replaced
	}
	replace( defaultPrimary, primary_color )
	replace( defaultAccent, accent_color )
	replace( defaultVisor, visor_color )
	replace( defaultBackpack, backpack_color )

	const bakedSvg = [
		`<?xml version="1.0" encoding="UTF-8" standalone="no"?>`,
		`<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">`,
		document.querySelector( 'svg' ).outerHTML
	].join( '' )

	const bakedRaster = await convert( bakedSvg, {
		quality: 80,
		// height: 500,
		// width: 500
	} )

	// Double check that files do not yet exist (in case of weird race condition)
	await failIfFilesExist( svgFile, rasterFile, path )

	// Save files
	await svgFile.save( bakedSvg )
	await rasterFile.save( bakedRaster )

	// Make file public
	await svgFile.makePublic( )
	await rasterFile.makePublic( )

	// Return public url
	return rasterFile.publicUrl()		


}