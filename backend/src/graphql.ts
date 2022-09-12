import express from 'express'
import {ApolloServer} from 'apollo-server-express'
import {ApolloServerPluginLandingPageGraphQLPlayground} from 'apollo-server-core'
import {typeDefs} from './typedefs'
import {resolvers} from './resolvers'

const graphqlApp = express()

// Add CORS headers
graphqlApp.use(async (req, res, next) => {
  const allowedOrigins = ['https://www.youtube.com', 'http://localhost:3000']
  if (allowedOrigins.includes(req.headers.origin || '')) {
    res.header('Access-Control-Allow-Origin', req.headers.origin)
  }
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
  context: ({req}) => {
    // Reference: https://www.apollographql.com/docs/apollo-server/security/authentication/

    // Note: This example uses the `req` argument to access headers,
    // but the arguments received by `context` vary by integration.
    // This means they vary for Express, Koa, Lambda, etc.
    //
    // To find out the correct arguments for a specific integration,
    // see https://www.apollographql.com/docs/apollo-server/api/apollo-server/#middleware-specific-context-fields

    const {headers} = req as any

    return {headers}
  },
})

export async function startServer() {
  await server.start()
  server.applyMiddleware({app: graphqlApp, path: '/', cors: true})
  const port = 3001
  graphqlApp.listen(port, () => {
    console.log(`YTCA server listening at http://localhost:${port}`)
  })
}
