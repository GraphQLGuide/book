---
title: Federated gateway
---

### Federated gateway

> If you’re jumping in here, `git checkout federation2_0.1.0` (tag [federation2_0.1.0](https://github.com/GraphQLGuide/guide-api/tree/federation2_0.1.0), or compare [federation2...federation3](https://github.com/GraphQLGuide/guide-api/compare/federation2_0.1.0...federation3_0.1.0))

In the last section we implemented the users service. In this section, we’ll implement the gateway. The basic process is creating an `ApolloGateway()` that points to a list of the services, and then giving that to `ApolloServer()`:

[`gateway.js`](https://github.com/GraphQLGuide/guide-api/blob/federation3_0.2.0/gateway.js)

```js
import { ApolloServer } from 'apollo-server'
import { ApolloGateway } from '@apollo/gateway'

const gateway = new ApolloGateway({
  serviceList: [
    { name: 'users', url: 'http://localhost:4001/graphql' },
  ]
})

const server = new ApolloServer({
  gateway,
  subscriptions: false
})

server.listen().then(({ url }) => {
  console.log(`Gateway ready at ${url}`)
})
```

We disable subscriptions because they don’t yet work with `ApolloGateway`. This works, but it’s not yet sending the `user` HTTP header our `users` service expects. This takes two steps: copying our monolith’s context function to give to `ApolloServer()` and defining a `buildService()` function to add the header in requests to services:

```js
import { ApolloServer } from 'apollo-server'
import { ApolloGateway, RemoteGraphQLDataSource } from '@apollo/gateway'

import context from './context'
import { mongoClient } from './lib/db'

class AuthenticatedDataSource extends RemoteGraphQLDataSource {
  willSendRequest({ request, context }) {
    request.http.headers.set('user', JSON.stringify(context && context.user))
  }
}

const gateway = new ApolloGateway({
  serviceList: [
    { name: 'users', url: 'http://localhost:4001/graphql' },
    { name: 'reviews', url: 'http://localhost:4002/graphql' }
  ],
  buildService({ url }) {
    return new AuthenticatedDataSource({ url })
  }
})

const server = new ApolloServer({
  gateway,
  context,
  subscriptions: false
})

mongoClient.connect()

server.listen().then(({ url }) => {
  console.log(`Gateway ready at ${url}`)
})
```

`buildService()` returns an `AuthenticatedDataSource` which sets the stringified user doc from the context as a header. `willSendRequest()` is then called for each request from the gateway to the services. We also import `mongoClient` in order to initiate the connection and import context from:

[`context.js`](https://github.com/GraphQLGuide/guide-api/blob/federation3_0.2.0/context.js)

```js
import { AuthenticationError } from 'apollo-server'

import { getAuthIdFromJWT } from './lib/auth'
import { mongoClient } from './lib/db'

export default async ({ req }) => {
  const context = {}

  const jwt = req && req.headers.authorization
  let authId

  if (jwt) {
    try {
      authId = await getAuthIdFromJWT(jwt)
    } catch (e) {
      let message
      if (e.message.includes('jwt expired')) {
        message = 'jwt expired'
      } else {
        message = 'malformed jwt in authorization header'
      }
      throw new AuthenticationError(message)
    }

    const user = await mongoClient
      .db()
      .collection('users')
      .findOne({ authId })
    if (user) {
      context.user = user
    } else {
      throw new AuthenticationError('no such user')
    }
  }

  return context
}
```

The only difference between this and the monolith’s version is importing `mongoClient` instead of the `db` directly.

We can now run our `users` service and gateway in two different terminals:

```sh
$ npm run start-service-users

> guide-api@0.1.0 start-service-users /guide-api
> babel-watch services/users/index.js

Users service ready at http://localhost:4001/
```

```sh
$ npm start

> guide-api@0.1.0 start /guide-api
> babel-watch gateway.js

Gateway ready at http://localhost:4000/
[INFO] Wed Mar 1 2020 04:55:43 GMT-0400 (EST) apollo-gateway: Gateway successfully loaded schema.
        * Mode: unmanaged
```

When we open the gateway URL, set our authorization header, and query, it works! 💃

![user and me queries with authorization header](../img/user-through-gateway.png)

