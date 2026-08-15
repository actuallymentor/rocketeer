const assert = require( `assert` )

const expected_config = {
	rpc: { mainnet: `https://example.invalid` },
	discord: { webhookurl: `https://example.invalid/webhook` }
}

process.env.RUNTIME_CONFIG = JSON.stringify( expected_config )
process.env.GCLOUD_PROJECT = `rocketeer-nft`

const { get_runtime_config } = require( `../modules/runtime-config` )
const functions = require( `../index` )

assert.deepStrictEqual( get_runtime_config(), expected_config )

const secret_bound_functions = [
	`testnetMetadata`,
	`mainnetMetadata`,
	`mainnetGenerateOutfitsOnQueue`,
	`rinkebyGenerateOutfitsOnQueue`,
	`notify_holders_of_changing_room_updates`
]

secret_bound_functions.forEach( function_name => {

	const secrets = functions[ function_name ].__endpoint?.secretEnvironmentVariables || []
	assert( secrets.some( ( { key } ) => key === `RUNTIME_CONFIG` ), `${ function_name } must bind RUNTIME_CONFIG` )

} )

assert.deepStrictEqual( functions.mark_rocketeers_as_gitched.__endpoint?.secretEnvironmentVariables || [], [] )
assert.strictEqual( functions.testnetMetadata.__endpoint?.availableMemoryMb, 2_048 )
assert.strictEqual( functions.mainnetMetadata.__endpoint?.availableMemoryMb, 2_048 )
assert.strictEqual( functions.notify_holders_of_changing_room_updates.__endpoint?.availableMemoryMb, 512 )
process.stdout.write( `Runtime config tests passed\n` )
