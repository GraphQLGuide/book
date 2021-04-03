---
title: Authentication
description: Authenticating the client by decoding their JWT and adding the user data to context
---

## Authentication

Background: [Authentication](../../background/authentication.md)

> If you’re jumping in here, `git checkout 2_0.2.0` (tag [2_0.2.0](https://github.com/GraphQLGuide/guide-api/tree/2_0.2.0), or compare [2...3](https://github.com/GraphQLGuide/guide-api/compare/2_0.2.0...3_0.2.0))

One thing that’s done outside of types and resolvers is creating *context*, which is an object provided to resolvers. We set context using the [`context`](https://www.apollographql.com/docs/apollo-server/api/apollo-server#constructoroptions-apolloserver) of `ApolloServer()`. The `context` param is either an object or, more commonly, a function that returns an object. The function is called at the beginning of every request. The most common use of the `context` function is authenticating the user making the request and adding their info to the context. Here’s an example with a hard-coded user:

[`src/index.js`](https://github.com/GraphQLGuide/guide-api/compare/2_0.2.0...3_0.2.0)

```js
const server = new ApolloServer({
  typeDefs: gql`
    type Query {
      me: User
      ...
    }
    type User {
      firstName: String
      lastName: String
    }
    ...
  `,
  resolvers: {
    Query: {
      me: (_, __, context) => context.user,
      ...
    },
    ...
  },
  context: () => {
    const user = {
      firstName: 'John',
      lastName: 'Resig'
    }

    return { user }
  }
})
```

Context is resolvers’ third parameter. For the `me` resolver, we just return the `user` property. We can try it out:

![me query](../../img/me-query.png)

[localhost:4000: `{ me { firstName lastName } }`](http://localhost:4000/)

Now let’s figure out the real user. The Guide uses JWTs stored in LocalStorage, so authentication is done by cryptographically verifying the token provided in the request’s authorization header. We get the request as an argument to the [context function](https://www.apollographql.com/docs/apollo-server/api/apollo-server#parameters):

```js
import { getAuthIdFromJWT } from './util/auth'

const server = new ApolloServer({
  ...
  context: async ({ req }) => {
    const context = {}

    const jwt = req.headers.authorization
    const authId = await getAuthIdFromJWT(jwt)
    console.log(authId)

    return context
  }  
})
```

`getAuthIdFromJWT()` verifies the given JWT and returns what we’re calling the user’s *authId*—a unique string identifying the user that we get as the OpenID subject (`verifiedToken.sub` below). Here’s the function’s implementation:

[`src/util/auth.js`](https://github.com/GraphQLGuide/guide-api/blob/3_0.2.0/src/util/auth.js)

```js
import jwt from 'jsonwebtoken'
import jwks from 'jwks-rsa'
import { promisify } from 'util'

const verify = promisify(jwt.verify)

const jwksClient = jwks({
  cache: true,
  rateLimit: true,
  jwksUri: 'https://graphql.auth0.com/.well-known/jwks.json'
})

const getPublicKey = (header, callback) => {
  jwksClient.getSigningKey(header.kid, (e, key) => {
    callback(e, key.publicKey || key.rsaPublicKey)
  })
}

export const getAuthIdFromJWT = async token => {
  if (!token) {
    return
  }

  const verifiedToken = await verify(token, getPublicKey, {
    algorithms: ['RS256'],
    audience: 'https://api.graphql.guide',
    issuer: 'https://graphql.auth0.com/'
  })

  return verifiedToken.sub
}
```

> It calls `verify()` from the [`jsonwebtoken` package](https://github.com/auth0/node-jsonwebtoken/). In order to verify, it needs the Guide’s public signing key. To get that, we use the [`jwks-rsa` package](https://github.com/auth0/node-jwks-rsa).

Now if we send a `{ hello }` query in Playground, we see `undefined` in the server logs. `authId` is undefined because `req.headers.authorization` is undefined. Which means that Playground isn’t sending an authorization header with our query. We can set it by clicking “HTTP HEADERS” in the bottom-left to open the JSON headers section. We want to set the authorization header to our JWT, but how do we get that? It’s produced by Auth0 during the login process and saved to localStorage, so we can get it by logging in at [graphql.guide/me](https://graphql.guide/me), opening the console, and entering:

```js
localStorage.getItem('auth.accessToken')
```

And it prints our JWT! It’s a long, random-looking, mostly alphanumeric string with some periods, dashes, and underscores. We can copy it to the Playground headers section:

```json
{ 
  "authorization": "your JWT here"
}
```

![Playground with authorization header filled in](../../img/authorization-header-playground.png)

> If you get a `jwt malformed` error, you likely didn't copy the whole token. Try opening the Application tab in Chrome dev tools, selecting `auth.accessToken`, and copying from the value panel at the bottom of the window.

Make note of your authorization header—you’ll need it for making queries in other sections of this chapter.

Now when we run the query, we see our `authId` logged—something like this:

```sh
$ npm run dev

> guide-api@0.1.0 dev /guide-api
> babel-watch src/index.js

GraphQL server running at http://localhost:4000/
undefined
github|1615
```

The format is `github|N`, where `N` is our primary key in the users table of GitHub’s database. (It’s an incrementing integer, which means that author John was GitHub’s 1,615th user! 😄)

The next thing that should happen in the code is looking up the user in our database—something like:

```js
  context: async ({ req }) => {
    const context = {}

    const jwt = req.headers.authorization
    const authId = await getAuthIdFromJWT(jwt)
    context.user = await db.collection('users').findOne({ authId })

    return context
  }
```

But we don’t have a database set up yet (we’ll set it up in the next section and add users in [Setting user context](creating-users.md#setting-user-context)), so let’s just test whether the `authId` is ours (replacing the strings with your own):

```js
  context: async ({ req }) => {
    const context = {}

    const jwt = req.headers.authorization
    const authId = await getAuthIdFromJWT(jwt)
    if (authId === 'github|1615') {
      context.user = {
        firstName: 'John',
        lastName: 'Resig'
      }
    }

    return context
  }
```

Now if we do a `me` query with our authorization header, we get our name:

![me query with results](../../img/me-query-with-auth-header.png)

But if we remove the header, we get null:

![me query with null](../../img/me-query-with-null-results.png)

This is because the `Query.me` resolver returns `context.user`, which is not defined.

In this section we learned how to put our JWT in the authorization header, verify it on the server, add the user to context, and access the context in resolvers. In the next section we’ll look at connecting to a database and creating users.

