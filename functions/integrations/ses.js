const AWS = require('aws-sdk')
const functions = require( 'firebase-functions' )
const { aws } = functions.config()
const { log } = require( '../modules/helpers' )
const SES_CONFIG = {
    accessKeyId: aws?.ses?.keyid,
    secretAccessKey: aws?.ses?.secretkey,
    region: aws?.ses?.region,
}
const AWS_SES = new AWS.SES( SES_CONFIG )

// Email templates
const pug = require('pug')
const { promises: fs } = require( 'fs' )
const csso = require('csso')
const juice = require('juice')

async function compile_pug_to_email( pugFile, data ) {

    const [ emailPug, inlineNormalise, styleExtra, styleOutlook, rocketeerStyles ] = await Promise.all( [
        fs.readFile( pugFile ),
        fs.readFile( `${ __dirname }/../templates/css-resets/normalize.css`, 'utf8' ),
        fs.readFile( `${ __dirname }/../templates/css-resets/extra.css`, 'utf8' ),
        fs.readFile( `${ __dirname }/../templates/css-resets/outlook.css`, 'utf8' ),
        fs.readFile( `${ __dirname }/../templates/rocketeers.css`, 'utf8' )
    ] )

    const { css } = csso.minify( [ styleExtra, styleOutlook, inlineNormalise, rocketeerStyles ].join( '\n' ) )
    const html = pug.render( emailPug, { data, headStyles: css } )
    const emailifiedHtml = juice.inlineContent( html, [ inlineNormalise, rocketeerStyles ].join( '\n' ), { removeStyleTags: false } )

    return emailifiedHtml

}

async function send_email( recipient, subject, html, text ) {

    const options = {
        Source: aws.ses.fromemail,
        Destination: {
            ToAddresses: [ recipient ]
        },
        ReplyToAddresses: [],
        Message: {
            Body: {
                Html: { Charset: 'UTF-8', Data: html },
                Text: { Charset: 'UTF-8', Data: text }
            },
            Subject: { Charset: 'UTF-8', Data: subject }
        }
        
    }

    log( `Sending email "${ options.Message.Subject.Data }" from ${ options.Source } to ${ options.Destination.ToAddresses[0] }` )

    return AWS_SES.sendEmail( options ).promise()

}

exports.send_outfit_available_email = async ( rocketeers, email ) => {


    const email_html = await compile_pug_to_email( `${ __dirname }/../templates/outfit_available.email.pug`, rocketeers )
    const email_text = ( await fs.readFile( `${ __dirname }/../templates/outfit_available.email.txt`, 'utf8' ) )
                                // .replace( '%%address%%', email_data.address )

    return send_email( email, `Your Rocketeer${rocketeers.length > 1 ? 's' : '' } ${rocketeers.length > 1 ? 'have outfits' : 'has an outfit' } available!`, email_html, email_text )


}