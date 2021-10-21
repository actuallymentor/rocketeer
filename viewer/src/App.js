import { Container, Loading } from './components/generic'
import { log, callApi, exportSvg } from './modules/helpers'
import download from 'downloadjs'

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

  // ///////////////////////////////
  // Lifesycle management
  // ///////////////////////////////

  // Get ID from url
  useEffect( () => {

    // Expecting /rocketeer/:id
    const { pathname } = window.location

    // Remove '/rocketeer/'
    const id = Number( pathname.replace( '/rocketeer/', '' ) )

    // Check if id is a number
    if( isNaN( id ) ) return setError( 'No rocketeer selected' )

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
  // Functions
  // ///////////////////////////////
  async function downloadJPEG( e, size ) {

    e.preventDefault()

    try {

      setLoading( `Generating ${ size }x${ size } JPEG` )

      // Fetch SVG as string
      const svg = await fetch( rocketeer.image, { mode: 'no-cors' } ).then( res => res.text() )
      const imageUri = await exportSvg( svg, 'jpeg' )

      download( imageUri, `rocketeer-${ rocketeerId }.jpg` )

      setLoading( false )

    } catch( e ) {

      log( 'JPEG error ', e )
      setError( 'JPEG error' )

    } finally {
      setLoading( false )
    }

  }

  // ///////////////////////////////
  // Rendering
  // ///////////////////////////////

  if( error ) return <Container>
    { error }
  </Container>

  if( rocketeerId === undefined || loading ) return <Loading message={ loading || "Loading Rocketeer data" } />

	if( rocketeer ) return <Container>
		
    <img src={ rocketeer.image } />
    <h1>{ rocketeer.name }</h1>
    <p>{ rocketeer.description }</p>

    <div>
      
      <a href={ rocketeer.image } className="button">Download SVG</a>

      <a onClick={ e => downloadJPEG( e, 500 ) } className="button">Download JPEG</a>

    </div>

	</Container>

  return null

}

export default App
