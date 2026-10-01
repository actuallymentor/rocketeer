const { createPublicClient, fallback, http, parseAbi } = require( `viem` )
const { mainnet } = require( `viem/chains` )
const { get_runtime_config } = require( `./runtime-config` )

// Contract data, rinkeby is a dead chain kept only for the legacy testnet endpoints
const contractAddress = {
	mainnet: `0xb3767b2033CF24334095DC82029dbF0E9528039d`,
	rinkeby: `0x95d6b9549315212D3FDce9FdCa9d80978b8bB41D`
}

// Only the ERC721 reads the backend needs
const abi = parseAbi( [
	`function totalSupply() view returns (uint256)`,
	`function ownerOf(uint256 tokenId) view returns (address)`,
	`function balanceOf(address owner) view returns (uint256)`,
	`function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)`
] )

/**
 * Public mainnet RPCs without user tracking, used as fallbacks behind the configured RPC.
 * Imports the raw chainlist data file because the package entry point uses extensionless
 * ESM imports that plain Node cannot resolve.
 * @returns {Promise<string[]>} RPC urls
 */
async function get_public_rpcs() {

	const { default: chainlist } = await import( `chainlist-rpcs/constants/extraRpcs.js` )
	const { rpcs = [] } = chainlist[ 1 ] || {}

	// Entries are either plain urls or { url, tracking } objects
	const entries = rpcs.map( rpc => typeof rpc == `string` ? { url: rpc, tracking: `none` } : rpc )
	return entries
		.filter( ( { url, tracking } ) => url?.startsWith( `https://` ) && tracking == `none` )
		.map( ( { url } ) => url )

}

// One client per cold start, the configured RPC goes first
let client_cache
async function get_client() {

	if( client_cache ) return client_cache

	const { rpc } = get_runtime_config()
	const rpc_urls = [ rpc?.mainnet, ...await get_public_rpcs() ].filter( Boolean )
	const transports = rpc_urls.map( url => http( url, { timeout: 10_000, retryCount: 0 } ) )

	// Multicall batching folds parallel reads, like token enumeration, into one RPC call
	client_cache = createPublicClient( { chain: mainnet, transport: fallback( transports ), batch: { multicall: true } } )
	return client_cache

}

// Shorthand for a read call on the Rocketeer contract
const read = async ( functionName, args=[], network=`mainnet` ) => {
	const client = await get_client()
	return client.readContract( { address: contractAddress[ network ], abi, functionName, args } )
}

/**
 * Total supply in accordance with the ERC721 spec
 * @param {string} network - mainnet or rinkeby
 * @returns {Promise<number>} Total supply, 0 on failure
 */
async function getTotalSupply( network=`mainnet` ) {

	// The mint completed at 3475, so we can hardcode this
	if( network == `mainnet` ) return 3475

	try {
		return Number( await read( `totalSupply`, [], network ) )
	} catch( e ) {
		console.error( `Error in getTotalSupply: `, e )
		return 0
	}

}

/**
 * Owner of a Rocketeer
 * @param {string|number} id - Token id
 * @param {string} network - mainnet or rinkeby
 * @returns {Promise<string>} Checksummed owner address
 */
const getOwingAddressOfTokenId = ( id, network=`mainnet` ) => read( `ownerOf`, [ BigInt( id ) ], network )

/**
 * Token ids held by an address
 * @param {string} address - Wallet address
 * @param {string} network - mainnet or rinkeby
 * @returns {Promise<string[]>} Token ids as strings
 */
async function getTokenIdsOfAddress( address, network=`mainnet` ) {

	const balance = await read( `balanceOf`, [ address ], network )

	// Enumerate in parallel, the client batches these into a single multicall
	const indices = Array.from( { length: Number( balance ) }, ( _, index ) => BigInt( index ) )
	const ids = await Promise.all( indices.map( index => read( `tokenOfOwnerByIndex`, [ address, index ], network ) ) )

	return ids.map( id => id.toString() )

}

module.exports = {
	getTotalSupply,
	contractAddress,
	getOwingAddressOfTokenId,
	getTokenIdsOfAddress
}
