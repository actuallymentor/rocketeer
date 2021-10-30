// Dependencies
const Web3 = require( 'web3' )
const functions = require( 'firebase-functions' )
const { infura } = functions.config()

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
    }
]

// Total current supply, in accordance with ERC721 spec
async function getTotalSupply( network='mainnet' ) {

	// Initialise contract connection
	const web3 = new Web3( `wss://${ network }.infura.io/ws/v3/${ infura.projectid }` )
	const contract = new web3.eth.Contract( ABI, contractAddress[ network ] )

	// Return the call promise which returns the total supply
	return contract.methods.totalSupply().call()

}

module.exports = {
	getTotalSupply: getTotalSupply
}