const name = require( 'random-name' )
const { db } = require( './firebase' )
const { getTotalSupply } = require( './contract' )
const { pickRandomArrayEntry, pickRandomAttributes, randomNumberBetween, globalAttributes, heavenlyBodies, web2domain, lorem } = require( './helpers' )
const svgFromAttributes = require( './svg-generator' )

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
        description: lorem,
        image: ``,
        external_url: `https://viewer.rocketeer.fans/?rocketeer=${ id }` + ( network == 'mainnet' ? '' : '&testnet=true' ),
        attributes: []
    }

    // Generate randomized attributes
    rocketeer.attributes = pickRandomAttributes( globalAttributes )

    // Generate color attributes
    rocketeer.attributes.push( {
        "trait_type": "outfit color",
        value: `rgb( ${ randomNumberBetween( 0, 255 ) }, ${ randomNumberBetween( 0, 255 ) }, ${ randomNumberBetween( 0, 255 ) } )`
    } )
    rocketeer.attributes.push( {
        "trait_type": "outfit accent color",
        value: `rgb( ${ randomNumberBetween( 0, 255 ) }, ${ randomNumberBetween( 0, 255 ) }, ${ randomNumberBetween( 0, 255 ) } )`
    } )
    rocketeer.attributes.push( {
        "trait_type": "backpack color",
        value: `rgb( ${ randomNumberBetween( 0, 255 ) }, ${ randomNumberBetween( 0, 255 ) }, ${ randomNumberBetween( 0, 255 ) } )`
    } )
    rocketeer.attributes.push( {
        "trait_type": "visor color",
        value: `rgb( ${ randomNumberBetween( 0, 255 ) }, ${ randomNumberBetween( 0, 255 ) }, ${ randomNumberBetween( 0, 255 ) } )`
    } )

    // Write to demo file


    // TODO: Generate, compile and upload image
    rocketeer.image = await svgFromAttributes( rocketeer.attributes )

    // Save new Rocketeer
    await db.collection( `${ network }Rocketeers` ).doc( id ).set( rocketeer )

    return rocketeer

}

async function safelyReturnRocketeer( id, network ) {

    // // Chech if this is an illegal ID
    // const invalidId = await isInvalidRocketeerId( id, network )
    // if( invalidId ) throw invalidId

    // // Get old rocketeer if it exists
    // const oldRocketeer = await getExistingRocketeer( id, network )
    // if( oldRocketeer ) return oldRocketeer

    // If no old rocketeer exists, make a new one and save it
    return generateRocketeer( id, network )

}

module.exports = {
    web2domain: web2domain,
    safelyReturnRocketeer: safelyReturnRocketeer
}