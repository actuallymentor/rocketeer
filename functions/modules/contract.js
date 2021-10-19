// Dependencies
const Web3 = require( 'web3' )
const functions = require( 'firebase-functions' )
const { infura } = functions.config()

// Contract data
const contractAddress = {
	mainnet: '',
	rinkeby: '0x2829ba9d76e675b8867E1707A9aB49B280D916c6'
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