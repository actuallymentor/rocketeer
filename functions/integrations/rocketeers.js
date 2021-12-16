const { safelyReturnRocketeer, safelyReturnMultipleRocketeers } = require( '../nft-media/rocketeer' )

exports.rocketeerFromRequest = async function( req, res, network='mainnet' ) {


    // Parse the request
    let { id } = req.params
    if( !id ) return res.json( { error: `No ID specified in URL` } )

    // Protect against malformed input
    id = Math.floor( Math.abs( id ) )
    if( typeof id !== 'number' ) return res.json( { error: `Malformed request` } )

    // Set ID to string so firestore can handle it
    id = `${ id }`

    try {

        // Get old rocketeer if it exists
        const rocketeer = await safelyReturnRocketeer( id, network )

        // Return the new rocketeer
        return res.json( rocketeer )

    } catch( e ) {

        // Log error for debugging
        console.error( `${ network } api error for ${ id }: `, e )

        // Return error to frontend
        return res.json( { error: e.mesage || e.toString() } )

    }


}

exports.multipleRocketeersFromRequest = async function( req, res, network='mainnet' ) {

	try {

        // Parse the request
        let { ids } = req.query
        ids = ids.split( ',' )
        if( ids.length > 250 ) throw new Error( 'Please do not ask for so much data at once :)' )
        const rocketeers = await safelyReturnMultipleRocketeers( ids, network )
        return res.json( rocketeers )

    } catch( e ) {
        return res.json( { error: e.message || e.toString() } )
    }

}