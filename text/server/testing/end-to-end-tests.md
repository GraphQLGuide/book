## End-to-end tests

> If you’re jumping in here, `git checkout 24_0.2.0` (tag [24_0.2.0](https://github.com/GraphQLGuide/guide-api/tree/24_0.2.0), or compare [24...25](https://github.com/GraphQLGuide/guide-api/compare/24_0.2.0...25_0.2.0))

The final type of testing is end-to-end, or e2e. In backend e2e testing, we start the server and database, and then we test by sending HTTP requests to the server. So our tests will look something like this:

```js
beforeAll(startE2EServer)
afterAll(stopE2EServer)

test('query A', () => {
  const result = makeHttpRequest(queryA)

  expect(result).toMatchSnapshot()
})
```

Let’s start by writing the `startE2EServer()` helper. We want it to look like this:

[`test/guide-test-utils.js`](https://github.com/GraphQLGuide/guide-api/compare/24_0.2.0...25_0.2.0)

```js
export const startE2EServer = () => {
  // start server and connect to db

  return {
    stop: () => // stops server and db client
    request: () => // send http request to server
  }
}
```

It returns the `stop()` and `request()` functions for the tests to use. We can fill in the first comment:

```js
import { server } from '../src/'
import { connectToDB } from '../src/db'

export const startE2EServer = async () => {
  // start server and connect to db
  const e2eServer = await server.listen({ port: 0 })
  await connectToDB()

  return {
    stop: () => // stops server and db client
    request: () => // send http request to server
  }
}
```

`{ port: 0 }` uses any available port, which we do because the default port (4000) will be in use if our dev server is running while we run our tests. In order to `await` our call to `connectToDB()`, we need to make it async instead of callback-based:

[`src/db.js`](https://github.com/GraphQLGuide/guide-api/compare/24_0.2.0...25_0.2.0)

```js
export let db

export const connectToDB = async () => {
  const client = new MongoClient(URL, { useNewUrlParser: true })
  await client.connect()
  db = client.db()
  return client
}
```

We also need to `return client` so that we can close the connection when testing is done. For stopping the server, there is a `e2eServer.server.close`, but it’s callback-based. We can use node’s [`promisify()`](https://nodejs.org/api/util.html#util_util_promisify_original) to turn it into a Promise that we can `await`:

[`test/guide-test-utils.js`](https://github.com/GraphQLGuide/guide-api/compare/24_0.2.0...25_0.2.0)

```js
import { promisify } from 'util'

export const startE2EServer = async () => {
  const e2eServer = await server.listen({ port: 0 })
  const dbClient = await connectToDB()

  const stopServer = promisify(e2eServer.server.close.bind(e2eServer.server))

  return {
    stop: async () => {
      await stopServer()
      await dbClient.close()
    }
    request: () => // send http request to server
  }
}
```

We also use [bind](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind) to maintain the function’s `this`.

We can make our function run faster by performing startup and stopping in parallel using [`Promise.all()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all):

```js
export const startE2EServer = async () => {
  const [e2eServer, dbClient] = await Promise.all([
    server.listen({ port: 0 }),
    connectToDB()
  ])

  const stopServer = promisify(e2eServer.server.close.bind(e2eServer.server))

  return {
    stop: () => Promise.all([stopServer(), dbClient.close()]),
    request: () => // send http request to server
  }
}
```

Lastly, we can send HTTP requests to the server using Apollo Link. [`apollo-link-http`](https://www.apollographql.com/docs/link/links/http/) has the basic `HttpLink` and `apollo-link` has [`execute()`](https://github.com/apollographql/apollo-link/blob/70f342380117fdfdbb5bad0987cd120689659ef2/packages/apollo-link/src/link.ts#L126-L138), a function that sends GraphQL operations over a link, and `toPromise()`, which converts the Observable that `execute()` returns into a Promise. All together, that’s:

[`test/guide-test-utils.js`](https://github.com/GraphQLGuide/guide-api/compare/24_0.2.0...25_0.2.0)

```js
import { promisify } from 'util'
import { HttpLink } from 'apollo-link-http'
import fetch from 'node-fetch'
import { execute, toPromise } from 'apollo-link'

import { server } from '../src/'
import { connectToDB } from '../src/db'

export const startE2EServer = async () => {
  const [e2eServer, dbClient] = await Promise.all([
    server.listen({ port: 0 }),
    connectToDB()
  ])

  const stopServer = promisify(e2eServer.server.close.bind(e2eServer.server))

  const link = new HttpLink({
    uri: e2eServer.url,
    fetch
  })

  return {
    stop: () => Promise.all([stopServer(), dbClient.close()]),
    request: operation => toPromise(execute(link, operation))
  }
}
```

We also need `src/index.js` to add `server` to its exports:

[`src/index.js`](https://github.com/GraphQLGuide/guide-api/compare/24_0.2.0...25_0.2.0)

```js
const server = new ApolloServer({
  typeDefs,
  resolvers,
  dataSources,
  context,
  formatError
})

...

export { server, typeDefs, resolvers, context, formatError }
```

Now we can write our e2e test:

[`test/e2e.test.js`](https://github.com/GraphQLGuide/guide-api/blob/25_0.2.0/test/e2e.test.js)

```js
import { gql, startE2EServer } from 'guide-test-utils'

let stop, request

beforeAll(async () => {
  const server = await startE2EServer()
  stop = server.stop
  request = server.request
})

afterAll(() => stop())

const HELLO = gql`
  query {
    hello
  }
`

test('hello', async () => {
  const result = await request({ query: HELLO })

  expect(result).toMatchSnapshot()
})
```

We start the server in `beforeAll()` and stop it in `afterAll()`. Then we create our query document, which we send to the server using `request()` in our one test. After we run the test, we check the snapshot:

[`test/__snapshots__/e2e.test.js.snap`](https://github.com/GraphQLGuide/guide-api/blob/25_0.2.0/test/__snapshots__/e2e.test.js.snap)

```js
exports[`hello 1`] = `
Object {
  "data": Object {
    "hello": "🌍🌏🌎",
  },
}
`;
```

We can test with a set of operations that we write, or we could generate random operations with IBM’s [query generator](https://github.com/IBM/GraphQL-Query-Generator).

