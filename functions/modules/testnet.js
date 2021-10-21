const app = require( './express' )()
const { getTotalSupply } = require( './contract' )
const { safelyReturnRocketeer, web2domain } = require( './rocketeer' )

// Specific Rocketeer instances
app.get( '/testnetapi/rocketeer/:id', async ( req, res ) => {

    // Parse the request
    const { id } = req.params
    if( !id ) return res.json( { error: `No ID specified in URL` } )

    try {

        // Get old rocketeer if it exists
        const rocketeer = await safelyReturnRocketeer( id, 'rinkeby' )

        // Return the new rocketeer
        return res.json( rocketeer )

    } catch( e ) {

        // Log error for debugging
        console.error( `Testnet api error for ${ id }: `, Object.keys( e ) )

        // Return error to frontend
        return res.json( { error: e.mesage || e.toString() } )

    }

} )


// Collection data
app.get( '/testnetapi/collection', async ( req, res ) => res.json( {
    totalSupply: await getTotalSupply( 'rinkeby' ).catch( f => 'error' ),
    description: "A testnet collection",
    external_url: web2domain,
    image: "https://rocketeer.fans/assets/draft-rocketeer.png",
    name: `Rocketeer collection`,
    seller_fee_basis_points: 0,
    fee_recipient: "0x0"
} ) )

module.exports = app