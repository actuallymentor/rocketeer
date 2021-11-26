const app = require( './express' )()
const { getTotalSupply } = require( '../modules/contract' )
const { safelyReturnRocketeer, web2domain } = require( '../nft-media/rocketeer' )
const { setAvatar, resetAvatar } = require( '../integrations/avatar' )


// ///////////////////////////////
// Specific Rocketeer instances
// ///////////////////////////////
app.get( '/api/rocketeer/:id', async ( req, res ) => {

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
        const rocketeer = await safelyReturnRocketeer( id, 'mainnet' )

        // Return the new rocketeer
        return res.json( rocketeer )

    } catch( e ) {

        // Log error for debugging
        console.error( `Mainnet api error for ${ id }: `, e )

        // Return error to frontend
        return res.json( { error: e.mesage || e.toString() } )

    }

} )

app.post( '/api/integrations/avatar/', setAvatar )
app.delete( '/api/integrations/avatar/', resetAvatar )


// ///////////////////////////////
// Static collection data
// ///////////////////////////////
app.get( '/api/rocketeer', async ( req, res ) => res.json( {
    totalSupply: await getTotalSupply( 'mainnet' ).catch( f => 'error' ),
    description: '"Moon boots touch the earth. Visored faces tilt upward. Their sole thought is wen." ~ Rocketeer Haiku\n\nThe Rocketeer NFT collection is inspired by the undying patience and excited optimism of the Rocket Pool and ETH2 staking communites.\n\nJoin us at https://rocketeer.fans/',
    external_url: web2domain,
    image: "https://rocketeer.fans/assets/draft-rocketeer.png",
    name: `Rocketeers`,
    seller_fee_basis_points: 500,
    fee_recipient: "0x7DBF6820D32cFBd5D656bf9BFf0deF229B37cF0E"
} ) )

module.exports = app