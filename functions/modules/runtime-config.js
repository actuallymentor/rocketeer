const { defineJsonSecret } = require( `firebase-functions/params` )

// Keep the legacy configuration shape intact during the Secret Manager cutover.
const runtime_config = defineJsonSecret( `RUNTIME_CONFIG` )

/**
 * Returns the structured runtime configuration inside a function invocation.
 * @returns {Object} Runtime configuration stored in Secret Manager.
 */
function get_runtime_config() {

	const config = runtime_config.value()
	if( !config || typeof config !== `object` || Array.isArray( config ) ) throw new Error( `RUNTIME_CONFIG must contain a JSON object` )

	return config

}

module.exports = { runtime_config, get_runtime_config }
