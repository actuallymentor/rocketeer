const { location } = window
export const dev = process.env.NODE_ENV === 'development' || ( typeof location !== 'undefined' && location.href.includes( 'debug=true' ) )


export const log = ( ...messages ) => {
	if( dev ) console.log( ...messages )
}

export async function callApi( path ) {

	const api = {
      mainnet: 'https://rocketeer.fans/api',
      testnet: 'https://rocketeer.fans/testnetapi'
    }

    const querySaysTestnet = window.location.pathname.includes( 'testnet' )
    const isLocal = window.location.hostname === 'localhost'
    const chain = ( isLocal || querySaysTestnet ) ? 'testnet' : 'mainnet'
    const callPath = api[ chain ] + path

    log( 'Calling ', callPath )
    return fetch( `${ api[ chain ] }${ path }` ).then( res => res.json() )

}

const loadImage = imageUrl => new Promise( resolve => {
	const image = new Image()
	image.addEventListener( 'load', () => resolve(image), { once: true } )
	image.src = imageUrl
} )

export async function exportSvg( string, size, exportFormat='jpeg' ) {

	const svgBlob = new Blob( [ string ], { type: 'image/svg+xml', } )
	const dataUri = URL.createObjectURL( svgBlob )

	const image = await loadImage( dataUri )
	image.width = size
	image.height = size
	URL.revokeObjectURL( dataUri )

	const canvas = document.createElement('canvas')
	canvas.width = image.width
	canvas.height = image.height

	const context = canvas.getContext('2d')
	context.drawImage(image, 0, 0, image.width, image.height)

	return canvas.toDataURL(`image/${exportFormat}`)

}