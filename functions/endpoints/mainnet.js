const app = require( './express' )()
const { getTotalSupply } = require( '../modules/contract' )
const { web2domain } = require( '../nft-media/rocketeer' )
const { setAvatar, resetAvatar } = require( '../integrations/avatar' )
const { rocketeerFromRequest, multipleRocketeersFromRequest } = require( '../integrations/rocketeers' )
const { generateNewOutfit, setPrimaryOutfit, generateMultipleNewOutfits } = require( '../integrations/changingroom' )
const { subscribe_address_to_notifications } = require( '../integrations/notifier' )

// ///////////////////////////////
// Specific Rocketeer instances
// ///////////////////////////////
app.get( '/api/rocketeer/:id', async ( req, res ) => rocketeerFromRequest( req, res, 'mainnet' ) )
app.get( '/api/rocketeers/', async ( req, res ) => multipleRocketeersFromRequest( req, res, 'mainnet' ) )

/* ///////////////////////////////
// VGR's dashboard integration
// /////////////////////////////*/
app.post( '/api/integrations/avatar/', setAvatar )
app.post( '/api/rocketeers/:address', generateMultipleNewOutfits )
app.delete( '/api/integrations/avatar/', resetAvatar )

/* ///////////////////////////////
// Changing room endpoints
// /////////////////////////////*/
app.post( '/api/rocketeer/:id/outfits', generateNewOutfit )
app.put( '/api/rocketeer/:id/outfits', setPrimaryOutfit )

/* ///////////////////////////////
// Notification API
// /////////////////////////////*/
app.post( '/api/notifications/:address', subscribe_address_to_notifications )


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