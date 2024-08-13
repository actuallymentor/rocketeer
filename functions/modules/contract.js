// Dependencies
const functions = require( 'firebase-functions' )
const { rpc } = functions.config()

// Contract data
const contractAddress = {
	mainnet: '0xb3767b2033CF24334095DC82029dbF0E9528039d',
	rinkeby: '0x95d6b9549315212D3FDce9FdCa9d80978b8bB41D'
}

// ABI with only the supply definitions
const ABI = [
	{
      "inputs": [],
      "name": "totalSupply",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "ownerOf",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "tokenOfOwnerByIndex",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  }
]

// Provider
let provider_cache = {}
function get_web3( network='mainnet' ) {
  const Web3 = require( 'web3' )
  if( provider_cache[ network ] ) return provider_cache[ network ]
  provider_cache[ network ] = new Web3( rpc.mainnet )
  return provider_cache[ network ]
}

function get_contract( network='mainnet' ) {
  const web3 = get_web3( network )
  return new web3.eth.Contract( ABI, contractAddress[ network ] )
}

// Total current supply, in accordance with ERC721 spec
async function getTotalSupply( network='mainnet' ) {

  // The  mint has completed at 3475, so we can hardcode this
  if( network == 'mainnet' ) return 3475

  try {
    // Initialise contract connection
    const contract = get_contract( network )

    // Return the call promise which returns the total supply
    return contract.methods.totalSupply().call()


  } catch( e ) {
    console.error( `Error in getTotalSupply: `, e )
    return 0
  }

}

// Total current supply, in accordance with ERC721 spec
async function getOwingAddressOfTokenId( id, network='mainnet' ) {

  // Initialise contract connection
  const contract = get_contract( network )

  // Return the call promise which returns the total supply
  return contract.methods.ownerOf( id ).call()

}

async function getTokenIdsOfAddress( address, network='mainnet' ) {

  // Initialise contract connection
  const contract = get_contract( network )

  // Get balance of address
  const balance = await contract.methods.balanceOf( address ).call()

  // Get tokens of address
  const ids = await Promise.all( Array.from( { length: balance } ).map( async ( val, index ) => {
    const id = await contract.methods.tokenOfOwnerByIndex( address, index ).call()
    return id.toString()
  } ) )

  return ids

}

module.exports = {
	getTotalSupply,
  contractAddress,
  getOwingAddressOfTokenId,
  getTokenIdsOfAddress
}