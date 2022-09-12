import {startServer} from './graphql'

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY
if (!GOOGLE_API_KEY || GOOGLE_API_KEY === 'change-me') {
  throw new Error(
    'Please set GOOGLE_API_KEY in env.sh - see: https://developers.google.com/youtube/v3/getting-started for details',
  )
}

const TIYARO_API_KEY = process.env.TIYARO_API_KEY
if (!TIYARO_API_KEY || TIYARO_API_KEY === 'change-me') {
  throw new Error(
    'Please set TIYARO_API_KEY in env.sh - signup for free at https://console.tiyaro.ai',
  )
}

async function main() {
  console.log('Start server, NODE_ENV=', process.env.NODE_ENV)

  startServer()
}

main()
