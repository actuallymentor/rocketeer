const { JSDOM } = require( `jsdom` )

// Raster definitions are referenced through <use href="#id"> elements. URL
// references cover the less common case where CSS points at a definition.
const href_reference = /^#(.+)$/
const url_reference = /url\(\s*["']?#([^)'"\s]+)["']?\s*\)/g

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

	const svg_start = svg.indexOf( `<svg` )
	const document_prefix = svg.slice( 0, svg_start )
	const { window } = new JSDOM( svg )

	try {

		const { document } = window
		const result = prune_unused_raster_definitions( document )
		const root = document.querySelector( `svg` )

		return { svg: `${ document_prefix }${ root.outerHTML }`, ...result }

	} finally {

		window.close()

	}

}

module.exports = {
	compress_svg,
	prune_unused_raster_definitions
}
