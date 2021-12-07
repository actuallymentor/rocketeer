import { log } from './helpers'
import { useChainId, useTokenIds } from './web3'
import { useState, useEffect } from 'react'

export async function callApi( path, options={} ) {

    const api = {
      mainnet: 'https://rocketeer.fans/api',
      testnet: 'https://rocketeer.fans/testnetapi'
    }

    const querySaysTestnet = window.location.href.includes( 'testnet' )
    const isLocal = window.location.hostname === 'localhost'
    const chain = ( isLocal || querySaysTestnet ) ? 'testnet' : 'mainnet'
    const callPath = api[ chain ] + path

    log( 'Calling ', callPath, ' with ', options )
    return fetch( `${ api[ chain ] }${ path }`, options ).then( res => res.json() )

}

export function getImage( id, ext='jpg', network ) {

    const api = {
      mainnet: 'https://storage.googleapis.com/rocketeer-nft.appspot.com/mainnetRocketeers',
      testnet: 'https://storage.googleapis.com/rocketeer-nft.appspot.com/rinkebyRocketeers'
    }

    if( network ) return api[ network ] + `/${ id }.${ext}`

    const querySaysTestnet = window.location.href.includes( 'testnet' )
    const isLocal = window.location.hostname === 'localhost'
    const chain = ( isLocal || querySaysTestnet ) ? 'testnet' : 'mainnet'

    return api[ chain ] + `/${ id }.${ext}`

}

export function useRocketeers( onlyGrabThisId ) {

    const tokenIds = useTokenIds()
    const ids = onlyGrabThisId ? [ onlyGrabThisId ] : tokenIds
    const [ rocketeers, setRocketeers ] = useState( [] )

    useEffect( (  ) => {

        let cancelled = false;

        ( async () => {

            try {

                if( !ids.length || cancelled ) return
                const rocketeerMetas = await callApi( `/rocketeers/?ids=${ ids.join( ',' ) }` )
                log( 'Received rocketeers: ', rocketeerMetas )
                if( !cancelled ) setRocketeers( rocketeerMetas )

            } catch( e ) {

            } finally {

            }

        } )( )

        return () => cancelled = true

    }, [ tokenIds, onlyGrabThisId ] )


    return rocketeers

}

export function useRocketeerImages() {

    const ids = useTokenIds()
    const chainId = useChainId()
    const rocketeers = useRocketeers()
    const [ images, setImages ] = useState( [] )

    useEffect( f => {

        if( rocketeers.length ) setImages( rocketeers.map( ( { image, id }, i ) => ( { src: image, id: id || i } ) ) )
        setImages( ids.map( id => ( {
            id,
            src: getImage( id, 'jpg', chainId === '0x1' ? 'mainnet' : 'testnet' )
        } ) ) )

    }, [ ids, chainId, rocketeers ] )

    return images

}

