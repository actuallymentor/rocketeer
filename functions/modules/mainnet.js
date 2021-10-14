const app = require( './express' )()
const name = require( 'random-name' )
const { db } = require( './firebase' )
const { getTotalSupply } = require( './contract' )

// ///////////////////////////////
// Data sources
// ///////////////////////////////
const globalAttributes = [
    { trait_type: "Age", display_type: "number", values: [
        { value: 35, probability: .5 },
        { value: 45, probability: .25 },
        { value: 25, probability: .25 }
    ] }
]
const heavenlyBodies = [ "Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "the Moon", "the Sun" ]
const web2domain = 'https://mentor.eth.link/'

// ///////////////////////////////
// Rocketeer helpers
// ///////////////////////////////

// Pick random item from array with equal probability
const pickRandomArrayEntry = array => array[ Math.floor( Math.random() * array.length ) ]

// Pick random attributes based on global attribute array
function pickRandomAttributes( attributes ) {

    // Decimal accuracy, if probabilities have the lowest 0.01 then 100 is enough, for 0.001 1000 is needed
    const probabilityDecimals = 3

    // Remap the trait so it has a 'lottery ticket box' based on probs
    const attributeLottery = attributes.map( ( { values, ...attribute } ) => ( {
        // Attribute meta stays the same
        ...attribute,
        // Values are reduced from objects with probabilities to an array with elements
        values: values.reduce( ( acc, val ) => {

            const { probability, value } = val

            // Map probabilities to a flat array of items
            const amountToAdd = 10 * probabilityDecimals * probability
            for ( let i = 0; i < amountToAdd; i++ ) acc.push( value )
            return acc

        }, [] )
    } ) )

    // Pick a random element from the lottery box array items
    return attributeLottery.map( ( { values, ...attribute } ) => ( {
        // Attribute meta stays the same
        ...attribute,
        // Select random entry from array
        value: pickRandomArrayEntry( values )
    } ) )

}

// ///////////////////////////////
// Specific Rocketeer instances
// ///////////////////////////////
app.get( '/rocketeer/:id', async ( req, res ) => {

    // Parse the request
    const { id } = req.params
    if( !id ) return res.json( { error: `No ID specified in URL` } )

    // Chech if this is an illegal ID
    try {

        // Get the last know total supply
        const { cachedTotalSupply } = await db.collection( 'meta' ).doc( 'contract' ).get().then( doc => doc.data() )

        // If the requested ID is larger than that, check if the new total supply is more
        if( cachedTotalSupply < id ) {

            // Get net total supply through infura, if infura fails, return the cached value just in case
            const totalSupply = await getTotalSupply().catch( f => cachedTotalSupply )

            // Write new value to cache
            await db.collection( 'meta' ).doc( 'contract' ).set( { cachedTotalSupply: totalSupply }, { merge: true } )

            // If the requested ID is larger than total supply, exit
            if( totalSupply < id ) return res.json( {
                trace: 'total supply getter',
                error: 'This Rocketeer does not yet exist.'
            } )

        }
    } catch( e ) {
        return res.json( { trace: 'total supply getter', error: e.message || JSON.stringify( e ) } )
    }

    // Get existing rocketeer if it exists
    try {

        const oldRocketeer = await db.collection( 'rocketeers' ).doc( id ).get().then( doc => doc.data() )
        if( oldRocketeer ) return res.json( oldRocketeer )

    } catch( e ) {
        return res.json( { trace: 'firestore rocketeer read',error: e.message || JSON.stringify( e ) } )
    }

    // The base object of a new Rocketeer
    const rocketeer = {
        name: `${ name.first() } ${ name.middle() } ${ name.last() } of ${ pickRandomArrayEntry( heavenlyBodies ) }`,
        description: ``,
        image: ``,
        external_url: `${ web2domain }rocketeer/${ id }`,
        attributes: []
    }

    // Generate randomized attributes
    rocketeer.attributes = pickRandomAttributes( globalAttributes )

    // TODO: Generate, compile and upload image
    rocketeer.image = web2domain

    // Save new Rocketeer
    try {
        await db.collection( 'rocketeers' ).doc( id ).set( rocketeer )
    } catch( e ) {
        return res.json( { trace: 'firestore rocketeer save', error: e.message || JSON.stringify( e ) } )
    }

    // Return the new rocketeer
    return res.json( rocketeer )

} )


// ///////////////////////////////
// Static collection data
// ///////////////////////////////
app.get( '/collection', ( req, res ) => res.json( {
    description: "A testnet collection",
    external_url: `https://openseacreatures.io/`,
    image: "https://rocketpool.net/images/rocket.png",
    name: `Rocketeer collection`,
    seller_fee_basis_points: 0,
    fee_recipient: "0x0"
} ) )

module.exports = app