import { log } from './helpers'
import { useTokenIds } from './web3'
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

    log( 'Calling ', callPath )
    return fetch( `${ api[ chain ] }${ path }`, options ).then( res => res.json() )

}

export function getImage( id, ext='jpg' ) {

    const api = {
      mainnet: 'https://storage.googleapis.com/rocketeer-nft.appspot.com/mainnetRocketeers',
      testnet: 'https://storage.googleapis.com/rocketeer-nft.appspot.com/rinkebyRocketeers'
    }

    const querySaysTestnet = window.location.href.includes( 'testnet' )
    const isLocal = window.location.hostname === 'localhost'
    const chain = ( isLocal || querySaysTestnet ) ? 'testnet' : 'mainnet'

    return api[ chain ] + `/${ id }.${ext}`

}

export function useRocketeers() {

    const ids = useTokenIds()
    const [ rocketeers, setRocketeers ] = useState( [] )

    useEffect( f => {

        ( async function() {

            const rocketeerMetas = await Promise.all( ids.map( id => callApi( `/rocketeer/${ id }` ) ) )
            log( 'Received rocketeers: ', rocketeerMetas )
            setRocketeers( rocketeerMetas )

        } )(  )

    }, [ ids ] )

    return rocketeers

}

export function useRocketeerImages() {

    const ids = useTokenIds()
    const [ images, setImages ] = useState( [] )

    useEffect( f => {

        setImages( ids.map( id => ( {
            id,
            src: getImage( id )
        } ) ) )

    }, [ ids ] )

    return images

}

