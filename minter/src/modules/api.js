import { log } from './helpers'
import { useChainId, useTokenIds } from './web3'
import { useState, useEffect, useRef } from 'react'

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

    // Track whether a request is already going
    const loading = useRef()

    useEffect( (  ) => {

        if( loading.current ) {
            log( 'Already loading Rocketeers, doing nothing' )
            return
        }

        let cancelled = false;

        ( async () => {

            try {

                // Set loading status to throttle dupes
                loading.current = true

                // if onlyGrabThisId changed but rocketeer is already present, do not continue
                if( onlyGrabThisId && rocketeers.find( ( { id } ) => id == onlyGrabThisId ) ) {
                    return log( 'Rocketeer already in cache, not refreshing' )
                }

                // If not onlyGrabThisId and tokenIds are equal length to cache, exit
                if( !onlyGrabThisId && rocketeers.length === tokenIds.length ) {
                    return log( 'Requested token length same as cache, not doing a request' )
                }

                if( !ids.length || cancelled ) return

                // Grab Rocketeer metadata
                const rocketeerMetas = await callApi( `/rocketeers/?ids=${ ids.join( ',' ) }` )
                log( 'Received rocketeers: ', rocketeerMetas )

                // Annotate Rocketeers
                const annotatedRocketeers = rocketeerMetas.map( rocketeer => {

                	// This is a dev environment issue where the token ids do not correspond to date
                	if( !rocketeer.attributes ) return rocketeer

                	const newOutfitAllowedInterval = 1000 * 60 * 60 * 24 * 30
									const { value: outfits } = rocketeer.attributes.find( ( { trait_type } ) => trait_type === 'available outfits' ) || { value: 0 }
									const { value: last_outfit_change } = rocketeer.attributes.find( ( { trait_type } ) => trait_type === 'last outfit change' ) || { value: 0 }
									const timeUntilAllowedToChange = newOutfitAllowedInterval - ( Date.now() - last_outfit_change )

									rocketeer.outfits = outfits
									rocketeer.last_outfit_change = last_outfit_change
									rocketeer.new_outfit_available = timeUntilAllowedToChange < 0
									rocketeer.when_new_outfit = new Date( Date.now() + timeUntilAllowedToChange )

									const [ full, outfitnumber ] = rocketeer.image.match( /(?:-)(\d*)(?:\.jpg)/ ) || []
									rocketeer.current_outfit = outfitnumber || 0

									return rocketeer

                } )

                if( !cancelled ) setRocketeers( annotatedRocketeers )

            } catch( e ) {
                log( 'Error getting Rocketeers: ', e )
            } finally {

                // Set loading status to let newer requests continue
                loading.current = false
            }

        } )( )

        return () => {
            cancelled = true
            loading.current = false
        }

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

