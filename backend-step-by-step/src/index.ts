import {startServer} from './graphql'

async function main() {
  console.log('Start server, NODE_ENV=', process.env.NODE_ENV)
  startServer()
}

main()
