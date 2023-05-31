const { db, dataFromSnap } = require("../modules/firebase")
const { dev, log } = require("../modules/helpers")

exports.mark_rocketeers_as_gitched = async function( items ) {

    try {

        log( `Running: `, items )

        if( !dev ) return log( `Developpment only endpoint` )

        // Mark logs in case of recovery need
        log( `Setting glitch logs` )
        await Promise.all( items.map( id => {

            log( `Setting glitch log ${ id }` )
            return db.collection( 'glitch_logs' ).doc( `${ id }` ).set( { updated: Date.now(), updated_human: new Date().toString() } )

        } ) )
        log( `Logs written` )

        // Mark as glitched
        log( `Marking items as glitched` )
        await Promise.all( items.map( async id => {

            // Formulate new attributes
            log( `Getting attributes for ${ id }` )
            const { attributes } = await db.collection( 'mainnetRocketeers' ).doc( `${ id }` ).get().then( dataFromSnap )
            const new_attributes = attributes.map( attribute => {
                if( attribute.trait_type == 'edition' ) return {
                    trait_type: 'edition',
                    value: 'glitched'
                }
                else return attribute
            } )

            // Update attributes
            await db.collection( 'mainnetRocketeers' ).doc( `${ id }` ).set( {
                attributes: new_attributes
            }, { merge: true } )

        } ) )
        
        log( `Glitch writing complete` )

    } catch( e ) {
        log( `Error marking ${ items.length } rocketeers as glitched` )
    }

}