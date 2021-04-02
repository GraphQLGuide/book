import { HttpLink, split, ApolloLink } from '@apollo/client'
import { WebSocketLink } from '@apollo/client/link/ws'
import { setContext } from '@apollo/client/link/context'
import { getMainDefinition } from '@apollo/client/utilities'
import { getAuthToken } from 'auth0-helpers'
import { RestLink } from 'apollo-link-rest'
import fetch from 'isomorphic-fetch'

import { errorLink } from './errorLink'
import { inBrowser, inDevelopment } from './helpers'

export const spaceXLink = ApolloLink.from([
  errorLink,
  new HttpLink({
    uri: 'https://api.spacex.land/graphql',
    fetch,
  }),
])

const httpLink = new HttpLink({
  // uri: 'https://api.graphql.guide/graphql',
  uri: inDevelopment
    ? `http://localhost:4000/graphql`
    : 'https://api.graphql.guide/graphql',
  fetch,
})

const authLink = setContext(async (_, { headers }) => {
  const token = await getAuthToken({
    doLoginIfTokenExpired: true,
  })

  if (token) {
    return {
      headers: {
        ...headers,
        authorization: `Bearer ${token}`,
      },
    }
  } else {
    return { headers }
  }
})

const authedHttpLink = authLink.concat(httpLink)

const restLink = new RestLink({
  uri: 'https://api.openweathermap.org/data/2.5/',
})

let link

if (inBrowser) {
  const wsLink = new WebSocketLink({
    uri: inDevelopment
      ? `ws://localhost:4000/subscriptions`
      : `wss://api.graphql.guide/subscriptions`,
    // uri: `wss://api.graphql.guide/subscriptions`,
    options: {
      reconnect: true,
    },
  })

  const networkLink = split(
    ({ query }) => {
      const { kind, operation } = getMainDefinition(query)
      return kind === 'OperationDefinition' && operation === 'subscription'
    },
    wsLink,
    authedHttpLink
  )

  link = ApolloLink.from([errorLink, restLink, networkLink])
} else {
  link = ApolloLink.from([errorLink, restLink, authedHttpLink])
}

export default link
