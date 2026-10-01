const assert = require( `assert` )
const { generatePrivateKey, privateKeyToAccount } = require( `viem/accounts` )

// A dead primary RPC forces every read through the chainlist fallbacks
process.env.RUNTIME_CONFIG = JSON.stringify( { rpc: { mainnet: `https://rpc.example.invalid` } } )
process.env.GCLOUD_PROJECT = `rocketeer-nft`

const { getOwingAddressOfTokenId, getTokenIdsOfAddress, getTotalSupply } = require( `../modules/contract` )
const { recover_signer, same_address } = require( `../modules/signatures` )

const address_regex = /^0x[a-fA-F0-9]{40}$/

;( async () => {

	// Mainnet supply is fixed after the completed mint
	assert.strictEqual( await getTotalSupply(), 3475 )

	// Live mainnet reads against the real contract
	const owner = await getOwingAddressOfTokenId( 1 )
	assert.match( owner, address_regex )

	const ids = await getTokenIdsOfAddress( owner )
	assert( ids.includes( `1` ), `owner of #1 must enumerate token 1, got ${ ids.slice( 0, 10 ) }` )
	assert( ids.every( id => typeof id == `string` ) )

	// A fresh wallet owns nothing
	const account = privateKeyToAccount( generatePrivateKey() )
	assert.deepStrictEqual( await getTokenIdsOfAddress( account.address ), [] )

	// Signatures from a real key recover to that key's address
	const message = JSON.stringify( { signer: account.address.toLowerCase(), outfitId: 1, chainId: `0x1` } )
	const signature = await account.signMessage( { message } )
	assert( same_address( await recover_signer( message, signature ), account.address ) )

	// A tampered message recovers to someone else
	assert( !same_address( await recover_signer( `${ message } `, signature ), account.address ) )

	// Garbage signatures throw instead of recovering
	await assert.rejects( recover_signer( message, `0x00` ) )

	process.stdout.write( `Chain tests passed\n` )

} )().catch( error => {
	console.error( error )
	process.exit( 1 )
} )
