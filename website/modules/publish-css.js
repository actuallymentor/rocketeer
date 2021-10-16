const sass = require( 'node-sass' )
const { promises: fs } = require( 'fs' )
const { mkdir } = require( './parse-fs' )

const postcss = require( 'postcss' )
const autoprefixer = require( 'autoprefixer' )
const cssnano = require( 'cssnano' )
const doiuse = require( 'doiuse' )

const cssWarning = warning => {

	const { feature, featureData } = warning
	const { title, missing, partial } = featureData
	if( partial ) console.log( "\x1b[33m", `[CSS] partial support - ${ title } - ${ partial }`, "\x1b[0m" )
	if( missing ) console.log( "\x1b[31m", `[CSS] missing support - ${ title } - ${ missing } missing support`, "\x1b[0m" )

}

const file = site => new Promise( ( resolve, reject ) => { 

	const css = { 
		from: `${site.system.source}css/styles.sass`,
		to: `${site.system.public}assets/css/styles.css`
	}

	mkdir( `${site.system.public}assets/css/` ).then( f => { 
		sass.render( { 
			file: css.from,
			// Add source map if in dev mode
			...( !( process.env.NODE_ENV == 'production' ) && { sourceMap: true, sourceMapEmbed: true } )
		}, ( err, result ) => { 
			if( err || !result ) return reject( err )
			// Run postcss with plugins
			postcss( [
				autoprefixer,
				cssnano,
				doiuse( { ...site.system.browser, onFeatureUsage: cssWarning } )
			] )
			.process( result.css, { from: css.from, to: css.to } )
			.then( result => fs.writeFile( css.to, result.css ) )
			.then( resolve )
		} )
	} )
	
 } )

const inline = ( site, path ) => new Promise( ( resolve, reject ) => { 

	sass.render( { 
		file: path,
		// Add source map if in dev mode
		...( !( process.env.NODE_ENV == 'production' ) && { sourceMap: true, sourceMapEmbed: true } )
	}, ( err, result ) => { 
		if( err || !result ) return reject( err )
		// Run postcss with plugins
		postcss( [
			autoprefixer,
			cssnano,
			doiuse( { ...site.system.browser, onFeatureUsage: cssWarning } )
		] )
		.process( result.css, { from: path, to: path + 'dummy' } )
		.then( result => resolve( result.css ) )
		.catch( err => console.log( err ) )
	} )
	
} )

module.exports = { 
	inlinecss: inline,
	css: file
}