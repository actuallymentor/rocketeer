const { db } = require( '../modules/firebase' )

// Web3 APIs
const Web3 = require( 'web3' )
const web3 = new Web3()

/* ///////////////////////////////
// POST handler for notifier signup
// /////////////////////////////*/
exports.subscribe_address_to_notifications = async function( req, res ) {

	// Parse the request
  let { address } = req.params
  if( !address ) return res.json( { error: `No address specified in URL` } )

  // Protect against malformed input
  if( !address.match( /0x.{40}/ ) ) return res.json( { error: `Malformed request` } )

	// Lowercase the address
	address = address.toLowerCase()

	try {

		// Get request data
		const { message, signature, signatory } = req.body
		if( !message || !signatory || !signature ) throw new Error( `Malformed request` )

		// Decode message
		const confirmedSignatory = web3.eth.accounts.recover( message, signature )
		if( signatory.toLowerCase() !== confirmedSignatory.toLowerCase() ) throw new Error( `Bad signature` )

		// Validate message
		const messageObject = JSON.parse( message )
		let { signer, discord_handle, chainId } = messageObject
		const network = chainId == '0x1' ? 'mainnet' : 'rinkeby'
		if( signer.toLowerCase() !== confirmedSignatory.toLowerCase() || !discord_handle || !network ) {
			throw new Error( `Invalid subscribeToAddress message with ${ signer }, ${confirmedSignatory}, ${discord_handle}, ${chainId}, ${network}` )
		}

		await db.collection( `${network}Notifications` ).doc( address ).set( {
			discord_handle
		} )

		return res.json( {
			success: true
		} )



  } catch( e ) {

      // Log error for debugging
      console.error( `POST subscribeToAddress ${ address }: `, e )

      // Return error to frontend
      return res.json( { error: e.mesage || e.toString() } )

  }

}