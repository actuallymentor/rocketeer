const { JSDOM } = require( `jsdom` )

// Raster definitions are referenced through <use href="#id"> elements. URL
// references cover the less common case where CSS points at a definition.
const href_reference = /^#(.+)$/
const url_reference = /url\(\s*["']?#([^)'"\s]+)["']?\s*\)/g
const embedded_raster_data = /((?:href|xlink:href)\s*=\s*["']data:image\/[^;,"']+(?:;[^,"']*)?;base64,)[^"']*(["'])/gi
const image_element = /<image\b[^>]*?(?:\/\s*>|>[\s\S]*?<\/image\s*>)/gi
const id_attribute = /\sid\s*=\s*(["'])(.*?)\1/i

const masked_svg = svg => svg.replace( embedded_raster_data, `$1$2` )

const canonical_svg_root = svg => {

	const { window } = new JSDOM( svg )

	try {

		const root = window.document.querySelector( `svg` )
		if( !root ) throw new Error( `Cannot verify input without an <svg> root` )

		return root.outerHTML

	} finally {

		window.close()

	}

}

const referenced_definition_ids = document => {

	const attribute_references = [ ...document.querySelectorAll( `*` ) ].flatMap( element => {

		return [ ...element.attributes ].flatMap( ( { name, value } ) => {

			const href_match = [ `href`, `xlink:href` ].includes( name ) && value.match( href_reference )
			const url_matches = [ ...value.matchAll( url_reference ) ].map( ( [ , id ] ) => id )

			return [ ...( href_match ? [ href_match[1] ] : [] ), ...url_matches ]

		} )

	} )

	const style_references = [ ...document.querySelectorAll( `style` ) ].flatMap( style => {

		return [ ...style.textContent.matchAll( url_reference ) ].map( ( [ , id ] ) => id )

	} )

	return new Set( [ ...attribute_references, ...style_references ] )

}

const definition_or_ancestor_is_referenced = ( image, referenced_ids ) => {

	let definition = image

	while( definition && definition.tagName.toLowerCase() !== `defs` ) {

		if( definition.id && referenced_ids.has( definition.id ) ) return true
		definition = definition.parentElement

	}

	return false

}

/**
 * Removes embedded raster definitions that the rendered SVG cannot reach.
 *
 * The operation is lossless: referenced images and images nested inside a
 * referenced definition remain untouched.
 *
 * @param {Document} document - SVG document to modify in place.
 * @returns {{removed: number, retained: number}} Raster definition counts.
 */
function prune_unused_raster_definitions( document ) {

	const referenced_ids = referenced_definition_ids( document )
	const raster_definitions = [ ...document.querySelectorAll( `defs image[id]` ) ]
	const unused_definitions = raster_definitions.filter( image => !definition_or_ancestor_is_referenced( image, referenced_ids ) )

	unused_definitions.forEach( image => image.remove() )

	return {
		removed: unused_definitions.length,
		retained: raster_definitions.length - unused_definitions.length
	}

}

/**
 * Prunes unused embedded rasters from an existing serialized SVG.
 *
 * @param {string} svg - Complete SVG document.
 * @returns {{svg: string, removed: number, retained: number}} Optimized SVG and counts.
 */
function compress_svg( svg ) {

	if( !svg.includes( `<svg` ) ) throw new Error( `Cannot compress input without an <svg> root` )

	// Base64 payloads dominate these documents. JSDOM does not need their bytes
	// to resolve references, so mask them while calculating the unreachable IDs.
	const masked_input = masked_svg( svg )
	const { window } = new JSDOM( masked_input )

	try {

		const { document } = window
		const raster_ids = new Set( [ ...document.querySelectorAll( `defs image[id]` ) ].map( image => image.id ) )
		const result = prune_unused_raster_definitions( document )
		const retained_ids = new Set( [ ...document.querySelectorAll( `defs image[id]` ) ].map( image => image.id ) )
		const removed_ids = new Set( [ ...raster_ids ].filter( id => !retained_ids.has( id ) ) )
		const optimized_svg = svg.replace( image_element, element => {

			const opening_tag = element.slice( 0, element.indexOf( `>` ) + 1 )
			const match = opening_tag.match( id_attribute )
			return match && removed_ids.has( match[2] ) ? `` : element

		} )
		const expected_root = document.querySelector( `svg` ).outerHTML
		const actual_root = canonical_svg_root( masked_svg( optimized_svg ) )

		if( actual_root !== expected_root ) throw new Error( `Source-preserving SVG prune did not match the DOM result` )

		return { svg: optimized_svg, ...result }

	} finally {

		window.close()

	}

}

module.exports = {
	compress_svg,
	prune_unused_raster_definitions
}
