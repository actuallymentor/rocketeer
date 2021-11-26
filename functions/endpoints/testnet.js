const app = require( './express' )()
const { getTotalSupply } = require( '../modules/contract' )
const { safelyReturnRocketeer, web2domain } = require( '../nft-media/rocketeer' )
const { generateNewOutfit, setPrimaryOutfit } = require( '../integrations/changingroom' )

////////////////////////////////
// Specific Rocketeer instances
////////////////////////////////
app.get( '/testnetapi/rocketeer/:id', async ( req, res ) => {

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
        const rocketeer = await safelyReturnRocketeer( id, 'rinkeby' )

        // Return the new rocketeer
        return res.json( rocketeer )

    } catch( e ) {

        // Log error for debugging
        console.error( `Testnet api error for ${ id }: `, e )

        // Return error to frontend
        return res.json( { error: e.mesage || e.toString() } )

    }

} )

/* ///////////////////////////////
// Changing room endpoints
// /////////////////////////////*/
app.post( '/testnetapi/rocketeer/:id/outfits', generateNewOutfit )
app.put( '/testnetapi/rocketeer/:id/outfits', setPrimaryOutfit )

// Collection data
app.get( '/testnetapi/collection', async ( req, res ) => res.json( {
    totalSupply: await getTotalSupply( 'rinkeby' ).catch( f => 'error' ),
    description: "A testnet collection.\n\nTesting newlines.\n\nAnd emoji 😎.\n\nAlso: urls; https://rocketeer.fans/",
    external_url: web2domain,
    image: "https://rocketeer.fans/assets/draft-rocketeer.png",
    name: `Rocketeer collection`,
    seller_fee_basis_points: 0,
    fee_recipient: "0x0"
} ) )

module.exports = app