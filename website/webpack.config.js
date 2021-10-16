// Browser sync stuff
const BrowserSyncPlugin = require( 'browser-sync-webpack-plugin' )
const bs = require( 'browser-sync' )

// Webpack and css
const webpack = require( 'webpack' )

// Workflow
const { watch } = require( 'fs' )
const { css } = require( __dirname + '/modules/publish-css' )


// Site config 
const site = require( __dirname + '/modules/config' )

// Conversions
const publishpug = require( __dirname + '/modules/publish-pug' )
const publishassets = require( __dirname + '/modules/publish-assets' )

// Get environment variables
const dotenv = require( 'dotenv' )
const { NODE_ENV } = process.env
const dev = NODE_ENV == 'development'

// Helpers
const error = e => {
  console.log( "\007" ) // Beep
  console.error( "\x1b[31m", `\n 🛑 error: `, e && e.message || e, "\x1b[0m" )
}

// ///////////////////////////////
// Plugins
// ///////////////////////////////
let thebs
const servername = 'bsserver'
const bsconfig = {
  host: 'localhost',
  open: true,
  cors: true,
  port: 3000,
  server: { 
    baseDir: [ site.system.public ],
    serveStaticOptions: {
      extensions: ['html']
    }
  },
  notify: false
}
const bsyncplugconfig = {
  name: servername,
  callback: f => { thebs = bs.get( servername ) }
}

const envPlugin = new webpack.DefinePlugin( {
  process: {
    env: {
      ...JSON.stringify( dotenv.config().parsed ),
      NODE_ENV: JSON.stringify( process.env.NODE_ENV )
    }
  }
} )

// ///////////////////////////////
// Watchers for non webpack files
// ///////////////////////////////

// Watch pug/sass
if ( dev ) watch( site.system.source, { recursive: true }, async ( eventType, filename ) => {

  // Pug file was updated
  if( filename.includes( 'pug' ) ) await publishpug( site, filename ).catch( error )

  // Sass file was updated, rebuild sass and pug files
  else if ( filename.includes( 'sass' ) || filename.includes( 'scss' ) ) {
    if( filename.includes( 'essential-above-the-fold' ) ) await publishpug( site ).catch( error )
    await css( site ).catch( error )
  }

  // Reload browser after every change
  thebs.reload()


} )

// Watch asset folder
if ( dev ) watch( `${ site.system.source }/assets`, { recursive: true }, async ( eventType, filename ) => {

  // Republish assets
  await publishassets( site, filename ).catch( error )

  // Reload browser after every change
  thebs.reload()


} )


module.exports = async f => {

  await Promise.all( [ publishpug( site ), publishassets( site ), css( site ) ] )

  return {
    entry: site.system.source + 'js/main.js',
    mode: NODE_ENV,
    output: {
      filename: `app-${site.system.timestamp}.js`,
      path: `${site.system.public}assets/js/`
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader'
          }
        }
      ]
    },
    devtool: NODE_ENV == 'production' ? false : 'inline-source-map',
    plugins: NODE_ENV == 'production' ? [ envPlugin ] : [ envPlugin, new BrowserSyncPlugin( bsconfig, bsyncplugconfig ) ]
  }
}