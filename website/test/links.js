import expect from './modules/expect'
import { promises as fs } from 'fs'
import { urls, isBroken, getLinks } from './modules/linkman'

describe( 'Links in the source files', function( ) {

	this.timeout( 1000 * 60 * 10 )

	it( 'are all valid', async function() {

		let linksWithFile = await getLinks( `${__dirname}/../src` )

		if( process.env.verbose ) console.log( 'Validating ', linksWithFile.length, ' links' )

		const broken = await Promise.all( linksWithFile.map( link => isBroken( link ) ) )
		const filtered = broken.filter( notfalse => notfalse )

		if( process.env.verbose && filtered.length > 0 ) await fs.writeFile( `${__dirname}/../broken-links.json`, JSON.stringify( filtered, null, 2 ) )
		if( process.env.verbose && filtered.length > 0 ) console.log( filtered.length , ' links are broken' )

		return filtered.should.have.length( 0 )

	} )

} )