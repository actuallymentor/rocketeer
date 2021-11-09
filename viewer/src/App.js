import { Container, Loading } from './components/generic'
import { log, callApi } from './modules/helpers'
// import download from 'downloadjs'
import DraftRocketeer from './assets/draft-rocketeer.png'

import './App.css'
import { useEffect, useState } from 'react'

function App() {

	// ///////////////////////////////
  // State management
  // ///////////////////////////////
  const [ rocketeerId, setRocketeerId ] = useState()
  const [ rocketeer, setRocketeer ] = useState()
  const [ loading, setLoading ] = useState( false )
  const [ error, setError ] = useState( false )
  const [ manualSelect, setManualSelect ] = useState(  )

  // ///////////////////////////////
  // Lifesycle management
  // ///////////////////////////////

  // Get ID from url
  useEffect( () => {

    const { search } = window.location
    const query = new URLSearchParams( search )
    const id = Number( query.get( 'rocketeer' ) || 'none' )

    log( 'Id found: ', id )

    // Check if id is a number
    if( isNaN( id ) ) return setManualSelect( true )

    // If all is good, set the ID to state
    return setRocketeerId( id )

  }, [] )

  // Get data from remote
  useEffect( (  ) => {

    if( !rocketeerId ) return

    
    // Load the rocketeer async
    ( async () => {
      try {

        setLoading( `Loading Rocketeer ${ rocketeerId }` )
        const rocketeer = await callApi( `/rocketeer/${ rocketeerId }` )
        log( 'Loaded rocketeer ', rocketeer )
        setRocketeer( rocketeer )

      } catch( e ) {
        setError( 'Rocketeer API error' )
        log( 'Error getting rocketeer ', e )
      } finally {
        setLoading( false )
      }

    } )( )


  }, [ rocketeerId ] )


  // ///////////////////////////////
  // Rendering
  // ///////////////////////////////
  if( manualSelect ) return <Container>
    <input type='number' placeholder='Input Rocketeer ID' onChange={ ( { target } ) => setRocketeerId( target.value ) } />
    <a href={ `/?rocketeer=${ rocketeerId }` } className="button">View Rocketeer</a>
  </Container>
  if( error ) return <Container>
    { error }
  </Container>

  if( rocketeerId === undefined || loading ) return <Loading message={ loading || "Loading Rocketeer data" } />

	if( rocketeer ) return <Container>
		
    <img alt={ `Rocketeer ${ rocketeerId }` } src={ rocketeer.image || DraftRocketeer } />
    <h1>{ rocketeer.name }</h1>
    <p>{ rocketeer.description || "This is a generic Rocketeer without a description. That should only happen during testing. Contact us on Discord if you see this." }</p>

    <ul id="traits">
      { rocketeer.attributes?.map( ( { trait_type, value } ) => <li key={ trait_type }><span>{ trait_type }</span><span>{ value }</span></li> ) }
    </ul>

    <div>
      
      <a href={ rocketeer.image } className="button">Download Jpeg</a>

      <a href={ rocketeer?.image?.replace( 'jpg', 'svg' ) } className="button">Download Svg</a>

      <a rel="noreferrer" target="_blank" href={ `https://opensea.io/assets/0xb3767b2033cf24334095dc82029dbf0e9528039d/${ rocketeerId }` }  className="button">View on Opensea</a>

    </div>

	</Container>

  return null

}

export default App
