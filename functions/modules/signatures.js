const { recoverMessageAddress } = require( `viem` )

/**
 * Recovers the address that signed a personal_sign (EIP-191) message
 * @param {string} message - The plain text message that was signed
 * @param {string} signature - Hex signature
 * @returns {Promise<string>} Checksummed signer address
 */
const recover_signer = ( message, signature ) => recoverMessageAddress( { message, signature } )

/**
 * Case-insensitive address comparison
 * @param {string} a - Address
 * @param {string} b - Address
 * @returns {boolean} Whether both are the same address
 */
const same_address = ( a='', b='' ) => `${ a }`.toLowerCase() === `${ b }`.toLowerCase()

module.exports = { recover_signer, same_address }
