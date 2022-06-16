const functions = require( 'firebase-functions' )
const juice = require('juice')

// Email package
const { mailgun } = functions.config()
const formData = require( 'form-data' )
const Mailgun = require( 'mailgun.js' )
const instance = new Mailgun( formData )
const mail = instance.client( {
	username: 'api',
	key: mailgun.api_key,
	url: mailgun.api_url
})
)
// Email templates
const pug = require('pug')
const { promises: fs } = require( 'fs' )
const csso = require('csso')

async function compilePugToEmail( pugFile, rocketeer ) {

	const [ emailPug, inlineNormalise, styleExtra, styleOutlook, rocketeerStyles ] = await Promise.all( [
		fs.readFile( pugFile ),
		fs.readFile( `${ __dirname }/../templates/css-resets/normalize.css`, 'utf8' ),
		fs.readFile( `${ __dirname }/../templates/css-resets/extra.css`, 'utf8' ),
		fs.readFile( `${ __dirname }/../templates/css-resets/outlook.css`, 'utf8' ),
		fs.readFile( `${ __dirname }/../templates/rocketeers.css`, 'utf8' )
	] )

	const { css } = csso.minify( [ styleExtra, styleOutlook, inlineNormalise, rocketeerStyles ].join( '\n' ) )
	const html = pug.render( emailPug, { rocketeer, headStyles: css } )
	const emailifiedHtml = juice.inlineContent( html, [ inlineNormalise, rocketeerStyles ].join( '\n' ), { removeStyleTags: false } )

	return emailifiedHtml

}


exports.send_email_outfit_available = async ( email, rocketeer ) => {

	try {

		rocketeer = { ...rocketeer, first_name: rocketeer.name.split( ' ' )[0] }

		// Build email
		const msg = {
			to: email,
			from: mailgun.from_email,
			subject: `Outfit available for Rocketeer ${ rocketeer.name }`,
			text: ( await fs.readFile( `${ __dirname }/../templates/outfit-available.txt`, 'utf8' ) ).replace( '%%name%%', rocketeer.name ),
			html: await compilePugToEmail( `${ __dirname }/../templates/outfit-available.email.pug`, rocketeer ),
		}

		await mail.messages.create( mailgun.from_domain, msg )

	} catch( e ) {

		console.error( e )

	}

}