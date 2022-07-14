// ///////////////////////////////
// Helper functions
// ///////////////////////////////
exports.dev = !!process.env.development
const log = ( ...messages ) => {
    if( process.env.development ) console.log( ...messages )
}
exports.log = log

// Wait in async
const wait = timeInMs => new Promise( resolve => setTimeout( resolve ), timeInMs )
exports.wait = wait

// Pick random item from an array
const pickRandomArrayEntry = array => array[ Math.floor( Math.random() * array.length ) ]
exports.pickRandomArrayEntry = pickRandomArrayEntry

// Generate random number between x and y
exports.randomNumberBetween = ( min, max ) => Math.floor( Math.random() * ( max - min + 1 ) + min )

// Random attribute picker
exports.pickRandomAttributes = ( attributes ) => {

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

const nameColor = require('color-namer')
const Color = require('color')
exports.getColorName = ( rgb ) => {
    try {
        return nameColor( rgb ).basic[0].name
    } catch( e ) {
        return rgb
    }
}
exports.getRgbArrayFromColorName = name => {

    const { hex } = nameColor( name ).basic[0]
    const color = Color( hex )
    return color.rgb().array()

}

// ///////////////////////////////
// Attribute sources
// ///////////////////////////////
exports.globalAttributes = [
    { trait_type: "helmet", values: [
        { value: 'classic', probability: .2 },
        { value: 'racer', probability: .1 },
        { value: 'punk', probability: .1 },
        { value: 'knight', probability: .2 },
        { value: 'geek', probability: .2 }

    ] },
    { trait_type: "patch", values: [
        { value: 'nimbus', probability: .1 },
        { value: 'teku', probability: .1 },
        { value: 'lighthouse', probability: .1 },
        { value: 'prysm', probability: .2 },
        { value: 'rocketpool', probability: .5 }

    ] },
    { trait_type: "backpack", values: [
        { value: 'yes', probability: .9 },
        { value: 'no', probability: .1 }
    ] },
    { trait_type: "panel", values: [
        { value: 'yes', probability: .9 },
        { value: 'no', probability: .1 }
    ] },
    { trait_type: "background", values: [
        { value: 'planets', probability: .2 },
        { value: 'system', probability: .2 },
        { value: 'playful', probability: .1 },
        { value: 'moon', probability: .05 },
        { value: 'galaxy', probability: .2 },
        { value: 'chip', probability: .05 }

    ] },
    { trait_type: "background complexity", values: [
        { value: 1, probability: .05 },
        { value: 2, probability: .10 },
        { value: 3, probability: .10 },
        { value: 4, probability: .75 }
    ] }


]
exports.heavenlyBodies = [ "Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "the Moon", "the Sun" ]
exports.web2domain = 'https://rocketeer.fans'
exports.lorem = 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'

/* ///////////////////////////////
// Retryable & throttled async
// /////////////////////////////*/
const Throttle = require( 'promise-parallel-throttle' )
const Retrier = require( 'promise-retry' )

/**
* Make async function (promise) retryable
* @param { function } async_function The function to make retryable
* @param { string } logging_label The label to add to the log entries
* @param { number } retry_times The amount of times to retry before throwing
* @param { number } cooldown_in_s The amount of seconds to wait between retries
* @param { boolean } cooldown_entropy Whether to add entropy to the retry delay to prevent retries from clustering in time
* @returns { function } An async function (promise) that will retry retry_times before throwing
*/
function make_retryable( async_function, logging_label='unlabeled retry', retry_times=5, cooldown_in_s=10, cooldown_entropy=true ) {

	// Formulate retry logic
	const retryable_function = () => Retrier( ( do_retry, retry_counter ) => {

		// Failure handling
		return async_function().catch( async e => {

			// If retry attempts exhausted, throw out
			if( retry_counter >= retry_times ) {
				log( `♻️🚨 ${ logging_label } retry failed after ${ retry_counter } attempts` )
				throw e
			}

			// If retries left, retry with a progressive delay
			const entropy = !cooldown_entropy ? 0 : ( .1 + Math.random() )
			const cooldown_in_ms = ( cooldown_in_s + entropy ) * 1000
			const cooldown = cooldown_in_ms + ( cooldown_in_ms * ( retry_counter - 1 ) )
			log( `♻️ ${ logging_label } retry failed ${ retry_counter }x, waiting for ${ cooldown / 1000 }s` )
			await wait( cooldown )
			log( `♻️ ${ logging_label } cooldown complete, continuing...` )
			return do_retry()

		} )

	} )

	return retryable_function

}

/**
* Make async function (promise) retryable
* @param { array } async_function_array Array of async functions (promises) to run in throttled parallel
* @param { number } max_parallell The maximum amount of functions allowed to run at the same time
* @param { string } logging_label The label to add to the log entries
* @param { number } retry_times The amount of times to retry before throwing
* @param { number } cooldown_in_s The amount of seconds to wait between retries
* @returns { Promise } An async function (promise) that will retry retry_times before throwing
*/
async function throttle_and_retry( async_function_array=[], max_parallell=2, logging_label, retry_times, cooldown_in_s ) {

	// Create array of retryable functions
	const retryable_async_functions = async_function_array.map( async_function => {
		const retryable_function = make_retryable( async_function, logging_label, retry_times, cooldown_in_s )
		return retryable_function
	} )

	// Throttle configuration
	const throttle_config = {
		maxInProgress: max_parallell	
	}

	// Return throttler
	return Throttle.all( retryable_async_functions, throttle_config )

}

exports.throttle_and_retry = throttle_and_retry