import dir from 'recursive-readdir'
import { normalize } from 'path'
import { promises as fs } from 'fs'
import request from 'request-promise-native'

// Fallback request
const get = async link => {

	// If it has a protocol:
	if( !link.url.match( /^\/\// ) ) return request( {
		uri: link.url,
		resolveWithFullResponse: true,
		headers: {
			'User-Agent': 'Chrome/79.0.3945.117'
		}
	} )

	// If it has no protocol
	console.log( `https:${ link.url }` )

	// Try https
	const https = await request( {
		uri: `https:${ link.url }`,
		resolveWithFullResponse: true,
		headers: {
			'User-Agent': 'Chrome/79.0.3945.117'
		}
	} ).catch( e => false )
	if( https ) return https

	console.log( 'Https didnt bite' )

	// Otherwise try http
	const http = await request( {
		uri: `http:${ link.url }`,
		resolveWithFullResponse: true,
		headers: {
			'User-Agent': 'Chrome/79.0.3945.117'
		}
	} ).catch( e => false )
	if( http ) return http

	// If neither worked..
	return { message: `Link has no protocol and doesn't respond on http or https` }


}

// Match all hrefs that have a // (external)
export const urls = str => Array.from( str.matchAll( /(?:href=(?:'|"))(.*?\/\/.*?)(?:"|')/g ), m => m[1] )

// CHeck if url is broken
export const isBroken = link => get( link )
.then( ( { statusCode } ) => statusCode == 200 ? false : { ...link, code: statusCode } )
.catch( ( { statusCode, name, message, ...other } ) => ( { ...link, code: statusCode || name || message || other } ) )

// Get links with files
export const getLinks = async path => {
	// Get the paths to files
	const paths = await dir( path, [ '*.png', '*.jpg', '*.pdf', '*.gif' ] )

	// Get markdown and fix footnoe structure to match npm module syntax
	const files = await Promise.all( paths.map( async path => ( {
		path: normalize( path ), content: await fs.readFile( path, 'utf8' )
	} ) ) )

	const linksByFile = files.map( md => ( {
		path: md.path,
		urls: urls( md.content )
	} ) )

	let linksWithFile = linksByFile.map( file => {
		return file.urls.map( url => ( { url: url, path: file.path } ) )
	} ).flat()

	return linksWithFile
}