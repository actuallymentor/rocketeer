

let app_cache = undefined

function get_app() {

    const { getTotalSupply } = require( '../modules/contract' )
    const { web2domain } = require( '../nft-media/rocketeer' )
    const { rocketeerFromRequest, multipleRocketeersFromRequest } = require( '../integrations/rocketeers' )
    const { generateNewOutfit, setPrimaryOutfit, generateMultipleNewOutfits } = require( '../integrations/changingroom' )
    const { subscribe_address_to_notifications } = require( '../integrations/notifier' )
    const { order_merch } = require( '../integrations/merch' )
    const app = require( './express' )()

    // Return app cache if exists
    if( app_cache ) return app_cache

    ////////////////////////////////
    // Specific Rocketeer instances
    ////////////////////////////////
    app.get( '/testnetapi/rocketeer/:id', ( req, res ) => rocketeerFromRequest( req, res, 'rinkeby' ) )
    app.get( '/testnetapi/rocketeers/', ( req, res ) => multipleRocketeersFromRequest( req, res, 'rinkeby' ) )

    /* ///////////////////////////////
    // Changing room endpoints
    // /////////////////////////////*/
    app.post( '/testnetapi/rocketeer/:id/outfits', generateNewOutfit )
    app.post( '/testnetapi/rocketeers/:address', generateMultipleNewOutfits )
    app.put( '/testnetapi/rocketeer/:id/outfits', setPrimaryOutfit )

    /* ///////////////////////////////
    // Notification API
    // /////////////////////////////*/
    app.post( '/testnetapi/notifications/:address', subscribe_address_to_notifications )

    /* ///////////////////////////////
    // Merch API
    // /////////////////////////////*/
    app.post( '/testnetapi/merch/order', order_merch )

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

    // Cache and return
    app_cache = app

    return app

}

module.exports = ( req, res ) => get_app()( req, res )