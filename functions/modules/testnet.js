const app = require( './express' )()
const { getTotalSupply } = require( './contract' )

// Specific Rocketeer instances
app.get( '/rocketeer/:id', async ( req, res ) => res.json( {
    description: "A testnet Rocketeer",
    external_url: `https://openseacreatures.io/${ req.params.id }`,
    image: "https://rocketpool.net/images/rocket.png",
    name: `Rocketeer number ${ req.params.id }`,
    attributes: [
      { trait_type: "Occupation", value: "Rocketeer" },
      { trait_type: "Age", display_type: "number", value: req.params.id + 42 }
    ]
} ) )


// Collection data
app.get( '/collection', async ( req, res ) => res.json( {
	totalSupply: await getTotalSupply( 'rinkeby' ),
    description: "A testnet collection",
    external_url: `https://openseacreatures.io/`,
    image: "https://rocketpool.net/images/rocket.png",
    name: `Rocketeer collection`,
    seller_fee_basis_points: 0,
    fee_recipient: "0x0"
} ) )

module.exports = app