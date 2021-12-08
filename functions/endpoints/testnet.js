const app = require( './express' )()
const { getTotalSupply } = require( '../modules/contract' )
const { web2domain } = require( '../nft-media/rocketeer' )
const { rocketeerFromRequest, multipleRocketeersFromRequest } = require( '../integrations/rocketeers' )
const { generateNewOutfit, setPrimaryOutfit, generateMultipleNewOutfits } = require( '../integrations/changingroom' )

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