---
title: Review integration tests
---

## Review integration tests

> If you’re jumping in here, `git checkout 20_0.2.0` (tag [20_0.2.0](https://github.com/GraphQLGuide/guide-api/tree/20_0.2.0), or compare [20...21](https://github.com/GraphQLGuide/guide-api/compare/20_0.2.0...21_0.2.0))

The different types of testing are basically defined by how much is mocked 😄. In integration tests, we usually just mock network requests. The main type of network request our server makes is to the database, so we’ll be mocking our MongoDB collection methods. We also won’t need our tests to make network requests to the GraphQL server because Apollo has [`createTestClient()`](https://www.apollographql.com/docs/apollo-server/features/testing/#createtestclient) which allows us to query the server without starting the server. It puts our queries through the Apollo Server request pipeline as if they were HTTP requests. 

`createTestClient()` returns an object with `query` and `mutate` functions, which each take a `GraphQLRequest` object:

[`apollo-server-types`](https://github.com/apollographql/apollo-server/blob/master/packages/apollo-server-types/src/index.ts)

```ts
export interface GraphQLRequest {
  query?: string;
  operationName?: string;
  variables?: VariableValues;
  extensions?: Record<string, any>;
  http?: Pick<Request, 'url' | 'method' | 'headers'>;
}
```

Usually we just use the `query` and `variables` properties, but we can also use `http`, for instance to include an authorization header:

```js
const { query } = createTestClient(server)
query({
  query: gql`...`,
  http: {
    headers: {
      authorization: `Bearer ${token}`
    }
  }
})
```

Then the server would run our context function, decode the auth token, and add the user doc to the context that it gives to resolvers.

`createTestClient()`’s only parameter is an instance of Apollo Server, so our tests will need one. We can’t use the one created in `src/index.js` because our tests will need to be able to modify data sources and context. So let’s make a `createTestServer()` function. And let’s create a new file that exports all of our testing helper functions and data, so that the test files can import whatever they need from one place:

[`test/guide-test-utils.js`](https://github.com/GraphQLGuide/guide-api/blob/21_0.2.0/test/guide-test-utils.js)

```js
import { ApolloServer } from 'apollo-server'

import { Reviews, Users } from '../src/data-sources/'
import {
  typeDefs,
  resolvers,
  context as defaultContext,
  formatError
} from '../src/'

export const createTestServer = ({ context = defaultContext } = {}) => {
  const reviews = new Reviews({})

  const users = new Users({})

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    dataSources: () => ({ reviews, users }),
    context,
    formatError
  })

  return { server, dataSources: { reviews, users } }
}

export { createTestClient } from 'apollo-server-testing'
export { default as gql } from 'graphql-tag'
```

`createTestServer()` returns both the server instance and the data sources (so that tests can spy on or modify data source functions). In order for the above code to work, we need to add some exports:

[`src/data-sources/index.js`](https://github.com/GraphQLGuide/guide-api/compare/20_0.2.0...21_0.2.0)

```js
...

export { Reviews, Users, Github }
```

[`src/index.js](https://github.com/GraphQLGuide/guide-api/compare/20_0.2.0...21_0.2.0)

```js
...

export { typeDefs, resolvers, context, formatError }
```

Now that we’ve got our `guide-test-utils.js` file, we can import from it into our test files. It would be nice if we could import without thinking about relative paths, as if it were a node module:

```js
import {
  createTestServer,
  createTestClient,
  gql
} from 'guide-test-utils'
```

To enable this, we can create a config file:

[`jest.config.js`](https://github.com/GraphQLGuide/guide-api/blob/21_0.2.0/jest.config.js)

```js
const path = require('path')

module.exports = {
  moduleDirectories: ['node_modules', path.join(__dirname, 'test')]
}
```

Jest will now look for modules both in `node_modules/` and in `test/`. ([Jest](https://jestjs.io), made by Facebook, is the most popular JavaScript testing framework.)

While it will run, it won’t pass linting, which we’ll find out either in our editor—if ESLint is enabled—or when we try to commit and it fails:

```sh
husky > pre-commit (node v8.11.3)

> guide-api@0.1.0 lint /guide-api
> eslint src/


/guide-api/src/resolvers/Review.test.js
  6:8  error  "guide-test-utils" is not found  node/no-missing-import

✖ 1 problem (1 error, 0 warnings)
```

ESLint is looking in our `node_modules/` to make sure that anything we import is there. But there is no `node_modules/guide-test-utils/`, so it gives an error. If we look at the documentation for the [`node/no-missing-import` rule](https://github.com/mysticatea/eslint-plugin-node/blob/master/docs/rules/no-missing-import.md), we learn that there’s a way to tell it to look in additional locations for modules—in this case, we want it to look in the `./test` directory:

[`.eslintrc.js`](https://github.com/GraphQLGuide/guide-api/compare/20_0.2.0...21_0.2.0)

```js
module.exports = {
  ...
  rules: {
    ...
    'node/no-missing-import': [
      'error',
      {
        resolvePaths: ['./test']
      }
    ]
  }
}
```

Now committing or doing `npm run lint` succeeds ✅.

Let’s move on to writing the review tests themselves. Since the entry point to review operations and most of the logic is in the resolvers, let’s put our test file next to the `Review.js` resolvers file, adding `.test` to the filename:

[`src/resolvers/Review.test.js`](https://github.com/GraphQLGuide/guide-api/blob/21_0.2.0/src/resolvers/Review.test.js)

```js
import {
  createTestServer,
  createTestClient,
  gql
} from 'guide-test-utils'

test('something', () => {
  const result = ...

  expect(result).toSomething()
})
```

Jest provides a set of [global functions](https://jestjs.io/docs/en/api#describename-fn), including the basic test function [`test()`](https://jestjs.io/docs/en/api#testname-fn-timeout) (or `it()`), in which we run part of our code and assert something about the result. We use `expect()` for assertions, which is followed by any of [a number of *matcher* methods](https://jestjs.io/docs/en/expect), such as:

```js
expect(result).toBeTruthy()
expect(result).toBe('this string')
expect(array).not.toContain(10)
expect(doSomething).toThrow('must be logged in')
```

We’ll write two tests, one for each review operation (`reviews` query and `createReview` mutation):

```js
import {
  createTestServer,
  createTestClient,
  gql
} from 'guide-test-utils'

test('reviews', () => {

})

test('createReview', () => {

})
```

For the first, we’ll start by first creating a test server and then a test client:

```js
import {
  createTestServer,
  createTestClient,
  gql
} from 'guide-test-utils'

test('reviews', async () => {
  const { server } = createTestServer()
  const { query } = createTestClient(server)

  const result = await query({ query: ... })
})
```

We need a query document to give to `query()`. To try to cover as many resolvers as possible, let’s select all `Review` and `User` fields except `User.email` (it requires authentication, which we’ll do in the second test).

```js
const REVIEWS = gql`
  query {
    reviews {
      id
      text
      stars
      author {
        id
        firstName
        lastName
        username
        photo
        createdAt
        updatedAt
      }
      createdAt
      updatedAt
    }
  }
`

test('reviews', async () => {
  const { server } = createTestServer()
  const { query } = createTestClient(server)

  const result = await query({ query: REVIEWS })
})
```

This test will send the `REVIEWS` query via the test client to our server. But before we make an assertion and run our code, we have to mock the database! Specifically, we have to mock the collection functions that will be called when our query is run. Looking at `src/resolvers/Review.js`, we see that `dataSources.reviews.all` and `dataSources.users.findOneById` are called. They both call `this.collection.find().toArray()`, so we need to mock `.find().toArray()` for both collections, as well as `this.collection.createIndex()`, which we call in the `Users` data source constructor.

[`test/guide-test-utils.js`](https://github.com/GraphQLGuide/guide-api/blob/21_0.2.0/test/guide-test-utils.js)

```js
export const createTestServer = ({ context = defaultContext } = {}) => {
  const reviews = new Reviews({
    find: () => ({
      toArray: jest.fn().mockResolvedValue(mockReviews)
    })
  })

  const users = new Users({
    createIndex: jest.fn(),
    find: () => ({
      toArray: jest.fn().mockResolvedValue(mockUsers)
    })
  })

  const server = new ApolloServer({
    dataSources: () => ({ reviews, users }),
    ...
  })

  ...
}
```

We’ll create a mock function using [`jest.fn()`](https://jestjs.io/docs/en/mock-function-api). By default it returns `undefined`, which works for `createIndex()`, but for `find()` we need to return an object that has a `toArray()` method that returns a Promise that resolves to an array of documents 😵😄. We’ll also need to create the `mockReviews` and `mockUsers` constants:

```js
import { ObjectId } from 'mongodb'

const updatedAt = new Date('2020-01-01')

export const mockUser = {
  _id: ObjectId('5d24f846d2f8635086e55ed3'),
  firstName: 'First',
  lastName: 'Last',
  username: 'mockA',
  authId: 'mockA|1',
  email: 'mockA@gmail.com',
  updatedAt
}

const mockUsers = [mockUser]

const reviewA = {
  _id: ObjectId('5ce6e47b5f97fe69e0d63479'),
  text: 'A+',
  stars: 5,
  updatedAt,
  authorId: mockUser._id
}

const reviewB = {
  _id: ObjectId('5cf8add4c872001f31880a97'),
  text: 'Passable',
  stars: 3,
  updatedAt,
  authorId: mockUser._id
}

const mockReviews = [reviewA, reviewB]
```

Now our `'reviews'` test should return `reviewA` and `reviewB`, both with author `mockUser`. Let’s complete the test with an assertion:

```js
test('reviews', async () => {
  const { server } = createTestServer()
  const { query } = createTestClient(server)

  const result = await query({ query: REVIEWS })
  expect(result).toMatchSnapshot()
})
```

To run the test, let’s add an npm script:

[`package.json`](https://github.com/GraphQLGuide/guide-api/compare/20_0.2.0...21_0.2.0)

```json
{ 
  ...
  "scripts": {
    ...
    "test": "jest"    
  }
}
```

Now when we do `npm run test` (or just `npm test`), Jest will find all `*.test.js` files and run the tests it finds inside them. 

Our assertion `expect(result).toMatchSnapshot()` will save a snapshot (a serialization of the result, saved to a new `__snapshots__/` directory). Whenever we get a different result from the saved snapshot, the test will fail, and we’ll either need to fix the code or (in the case when the result is correctly different) tell Jest to update the snapshot.

> Snapshots should be added to git.

```
$ npm test

> guide-api@0.1.0 test /guide-api
> jest

 PASS  src/resolvers/Review.test.js
  ✓ reviews (58ms)

 › 1 snapshot written.
  console.log src/index.js:22
    GraphQL server running at http://localhost:4000/

Snapshot Summary
 › 1 snapshot written from 1 test suite.

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   1 written, 1 total
Time:        3.375s, estimated 4s
Ran all test suites.
Jest did not exit one second after the test run has completed.

This usually means that there are asynchronous operations that weren’t stopped in your tests. Consider running Jest with `--detectOpenHandles` to troubleshoot this issue.
```

> To terminate the command, type `Ctrl-C`.

We see that our one test passes, and a new snapshot is written. We can look at the file to make sure it’s correct:

[`src/resolvers/__snapshots__/Review.test.js.snap`](https://github.com/GraphQLGuide/guide-api/blob/21_0.2.0/src/resolvers/__snapshots__/Review.test.js.snap)

```js
// Jest Snapshot v1, https://goo.gl/fbAQLP

exports[`reviews 1`] = `
Object {
  "data": Object {
    "reviews": Array [
      Object {
        "author": Object {
          "createdAt": 1562703942000,
          "firstName": "First",
          "id": "5d24f846d2f8635086e55ed3",
          "lastName": "Last",
          "photo": "https://avatars.githubusercontent.com/u/1",
          "updatedAt": 1577836800000,
          "username": "mockA",
        },
        "createdAt": 1558635643000,
        "id": "5ce6e47b5f97fe69e0d63479",
        "stars": 5,
        "text": "A+",
        "updatedAt": 1577836800000,
      },
      Object {
        "author": Object {
          "createdAt": 1562703942000,
          "firstName": "First",
          "id": "5d24f846d2f8635086e55ed3",
          "lastName": "Last",
          "photo": "https://avatars.githubusercontent.com/u/1",
          "updatedAt": 1577836800000,
          "username": "mockA",
        },
        "createdAt": 1559801300000,
        "id": "5cf8add4c872001f31880a97",
        "stars": 3,
        "text": "Passable",
        "updatedAt": 1577836800000,
      },
    ],
  },
  "errors": undefined,
  "extensions": undefined,
  "http": Object {
    "headers": Headers {
      Symbol(map): Object {},
    },
  },
}
`;
```

That looks good! We’ve got what we expected in the `"data"` result attribute and nothing in the `"errors"` attribute. However, if we look at the end of the test output, we see a problem:

```
Jest did not exit one second after the test run has completed.

This usually means that there are asynchronous operations that weren’t stopped in your tests. Consider running Jest with `--detectOpenHandles` to troubleshoot this issue.
```

It’s saying we’ve started code running that hasn’t stopped running. If we look above that, we see this output:

```
  console.log src/index.js:22
    GraphQL server running at http://localhost:4000/
```

It looks like our non-test server is running—that’s the running code that Jest is warning us about. So we need to edit `src/index.js` to not start the server during tests. Jest sets `NODE_ENV` to `'test'`, so let’s use that:

[`src/index.js`](https://github.com/GraphQLGuide/guide-api/compare/20_0.2.0...21_0.2.0)

```js
const start = () => {
  server
    .listen({ port: 4000 })
    .then(({ url }) => console.log(`GraphQL server running at ${url}`))
}

if (process.env.NODE_ENV !== 'test') {
  start()
}
```

Instead of starting the server with `server.listen()` at the top level, we put it in a function and only call it when we’re not testing. However, when we run `npm test` again, while we no longer get the `console.log`, we still get the warning, which means there must be more code that we start running at the top level...

The database connection! Let’s put that in a function as well:

[`src/db.js`](https://github.com/GraphQLGuide/guide-api/compare/20_0.2.0...21_0.2.0)

```js
import { MongoClient } from 'mongodb'

export let db

const URL = 'mongodb://localhost:27017/guide'

export const connectToDB = () => {
  const client = new MongoClient(URL, { useNewUrlParser: true })
  client.connect(e => {
    if (e) {
      console.error(`Failed to connect to MongoDB at ${URL}`, e)
      return
    }

    db = client.db()
  })
}
```

And we’ll call it from `start()`. We’ll also move `Github.startPolling()` from the top level of `src/data-sources/index.js`:

[`src/index.js`](https://github.com/GraphQLGuide/guide-api/compare/20_0.2.0...21_0.2.0)

```js
import dataSources, { Github } from './data-sources'
import { connectToDB } from './db'

const start = () => {
  connectToDB()
  Github.startPolling()
  server
    .listen({ port: 4000 })
    .then(({ url }) => console.log(`GraphQL server running at ${url}`))
}

if (process.env.NODE_ENV !== 'test') {
  start()
}
```

Now `npm test` completes normally. To recap, we set up integration tests for review operations by:

- Creating a test version of the server.
- Making a test utilities file that can be used like a node module.
- Writing a test.
- Mocking MongoDB collection methods.
- Preventing long-running server code from starting during testing.

Lastly, we have our second test to write—`'createReview'`:

[`src/resolvers/Review.test.js`](https://github.com/GraphQLGuide/guide-api/blob/21_0.2.0/src/resolvers/Review.test.js)

```js
test('createReview', async () => {
  const { server } = createTestServer({
    context: () => ({ user: mockUser })
  })
  const { mutate } = createTestClient(server)

  const result = await mutate({
    mutation: CREATE_REVIEW,
    variables: { review: { text: 'test', stars: 1 } }
  })
  expect(result).toMatchSnapshot()
})
```

Similarly to `'reviews'`, we create a test server and client, send an operation via the test client, and assert the response matches the snapshot. The differences are:

- We need to set the server’s context as if we’re logged in as `mockUser` so that we don’t get the `ForbiddenError`.
- We use `mutate()` instead of `query()`, and provide the `review` variable.

For the mutation, we have:

```js
const CREATE_REVIEW = gql`
  mutation CreateReview($review: CreateReviewInput!) {
    createReview(review: $review) {
      id
      text
      stars
      author {
        id
        email
      }
      createdAt
    }
  }
`
```

We include `email`, which we’ll have access to because we’re logged in as `mockUser` and `mockUser` will be used for the new review’s `author` field.

The one thing we haven’t done yet is update our database mock functions. It looks like the only new function that will be called is `this.collection.insertOne()`, which is used in `src/data-sources/Reviews.js`:

```js
export default class Reviews extends MongoDataSource {
  ...

  create(review) {
    review.authorId = this.context.user._id
    review.updatedAt = new Date()
    this.collection.insertOne(review)
    return review
  }
}
```

The only thing we were depending on `insertOne()` doing was adding an `_id` property, so let’s mock that:

[`test/guide-test-utils.js`](https://github.com/GraphQLGuide/guide-api/blob/21_0.2.0/test/guide-test-utils.js)

```js
export const createTestServer = ({ context = defaultContext } = {}) => {
  const reviews = new Reviews({
    find: jest.fn(() => ({
      toArray: jest.fn().mockResolvedValue(mockReviews)
    })),
    insertOne: jest.fn(
      doc => (doc._id = new ObjectId('5cf8b6ff37568a1fa500ba4e'))
    )
  })

  ...
}
```

Now when we run the tests, we see that two are passing, and one new snapshot is written:

```
$ npm test

> guide-api@0.1.0 test /guide-api
> jest

 PASS  src/resolvers/Review.test.js
  ✓ reviews (41ms)
  ✓ createReview (21ms)

 › 1 snapshot written.
Snapshot Summary
 › 1 snapshot written from 1 test suite.

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Snapshots:   1 written, 1 passed, 2 total
Time:        3.745s
Ran all test suites.
```

And one new snapshot is written:

[`src/resolvers/__snapshots__/Review.test.js.snap`](https://github.com/GraphQLGuide/guide-api/blob/21_0.2.0/src/resolvers/__snapshots__/Review.test.js.snap)

```js
exports[`createReview 1`] = `
Object {
  "data": Object {
    "createReview": Object {
      "author": Object {
        "email": "mockA@gmail.com",
        "id": "5d24f846d2f8635086e55ed3",
      },
      "createdAt": 1559803647000,
      "id": "5cf8b6ff37568a1fa500ba4e",
      "stars": 1,
      "text": "test",
    },
  },
  "errors": undefined,
  "extensions": undefined,
  "http": Object {
    "headers": Headers {
      Symbol(map): Object {},
    },
  },
}
`;

...
```

Looks good! ✅

