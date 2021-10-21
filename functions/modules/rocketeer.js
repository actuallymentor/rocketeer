const name = require( 'random-name' )
const { db } = require( './firebase' )
const { getTotalSupply } = require( './contract' )

// ///////////////////////////////
// Attribute sources
// ///////////////////////////////
const globalAttributes = [
    { trait_type: "Age", display_type: "number", values: [
        { value: 35, probability: .5 },
        { value: 45, probability: .25 },
        { value: 25, probability: .25 }
    ] }
]
const heavenlyBodies = [ "Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "the Moon", "the Sun" ]
const web2domain = 'https://rocketeer.fans'

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
// Caching
// ///////////////////////////////
async function isInvalidRocketeerId( id, network='mainnet' ) {

    // Chech if this is an illegal ID
    try {

        // Get the last know total supply
        const { cachedTotalSupply } = await db.collection( 'meta' ).doc( network ).get().then( doc => doc.data() ) || {}

        // If the requested ID is larger than that, check if the new total supply is more
        if( !cachedTotalSupply || cachedTotalSupply < id ) {

            // Get net total supply through infura, if infura fails, return the cached value just in case
            const totalSupply = await getTotalSupply( network )

            // Write new value to cache
            await db.collection( 'meta' ).doc( network ).set( { cachedTotalSupply: totalSupply }, { merge: true } )

            // If the requested ID is larger than total supply, exit
            if( totalSupply < id ) throw new Error( `Invalid ID ${ id }, total supply is ${ totalSupply }` )

            // If all good, return true
            return false

        }
    } catch( e ) {
        return e
    }


}

async function getExistingRocketeer( id, network='mainnet' ) {

    return db.collection( `${ network }Rocketeers` ).doc( id ).get().then( doc => doc.data() ).catch( f => false )

}

// ///////////////////////////////
// Rocketeer generator
// ///////////////////////////////
async function generateRocketeer( id, network='mainnet' ) {

    // The base object of a new Rocketeer
    const rocketeer = {
        name: `${ name.first() } ${ name.middle() } ${ name.last() } of ${ pickRandomArrayEntry( heavenlyBodies ) }`,
        description: ``,
        image: ``,
        external_url: `https://viewer.rocketeer.fans/rocketeer/${ id }` + network == 'mainnet' ? '' : '?testnet=true',
        attributes: []
    }

    // Generate randomized attributes
    rocketeer.attributes = pickRandomAttributes( globalAttributes )

    // TODO: Generate, compile and upload image
    rocketeer.image = web2domain

    // Save new Rocketeer
    await db.collection( `${ network }Rocketeers` ).doc( id ).set( rocketeer )

    return rocketeer

}

async function safelyReturnRocketeer( id, network ) {

    // Chech if this is an illegal ID
    const invalidId = await isInvalidRocketeerId( id, network )
    if( invalidId ) throw invalidId

    // Get old rocketeer if it exists
    const oldRocketeer = await getExistingRocketeer( id, network )
    if( oldRocketeer ) return oldRocketeer

    // If no old rocketeer exists, make a new one and save it
    return generateRocketeer( id, network )

}

module.exports = {
    web2domain: web2domain,
    safelyReturnRocketeer: safelyReturnRocketeer
}