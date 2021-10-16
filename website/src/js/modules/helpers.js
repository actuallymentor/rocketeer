// Selectors
export const q = query => document.querySelector( query )
export const qa = query => document.querySelectorAll( query )

// Debuggins
export const log = ( ...messages ) => {

	try {

		const { NODE_ENV } = process.env
		const { href } = location || {}
		if( NODE_ENV == 'development' || ( href && href.includes( 'debug' ) ) ) console.log( ...messages )

	} catch( e ) {

		console.log( 'Error in logger: ', e )
		console.log( ...messages )

	}

}