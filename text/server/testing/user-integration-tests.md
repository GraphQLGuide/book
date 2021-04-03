---
title: User integration tests
description: Implementing integration tests for the User data type
---

## User integration tests

> If you’re jumping in here, `git checkout 22_0.2.0` (tag [22_0.2.0](https://github.com/GraphQLGuide/guide-api/tree/22_0.2.0), or compare [22...23](https://github.com/GraphQLGuide/guide-api/compare/22_0.2.0...23_0.2.0))

Let’s try to meet our 40% coverage threshold. Looking at `src/resolvers/User.js`, we can see that our queries are red:

![HTML coverage report of src/resolvers/User.js](../../img/coverage-user-red.png)

This makes sense, as our tests haven’t sent any user queries—they’ve just selected `User` fields in review operations. Accordingly, when we scroll down, we see the only covered lines are for `User` field resolvers:

![User field resolvers mostly not red](../../img/coverage-user-fields.png)

Let’s write some integration tests that query user operations. We’ll start with the same imports and test format (one for each operation) as we did with `Review.test.js`:

[`src/resolvers/User.test.js`](https://github.com/GraphQLGuide/guide-api/blob/23_0.2.0/src/resolvers/User.test.js)

```js
import {
  createTestServer,
  createTestClient,
  gql,
  mockUser
} from 'guide-test-utils'

test('me', async () => {
  ...
})

test('user', async () => {
  ...
})

test('searchUsers', async () => {
  ...
})

test('createUser', async () => {
  ...
})
```

For the `me` test, we can set the `context` to a user with a certain `_id`, and then check to make sure the result’s `id` matches:

```js
const ME = gql`
  query {
    me {
      id
    }
  }
`

test('me', async () => {
  const { server } = createTestServer({
    context: () => ({ user: { _id: 'itme' } })
  })
  const { query } = createTestClient(server)

  const result = await query({ query: ME })
  expect(result.data.me.id).toEqual('itme')
})
```

We don’t need to worry about selecting and testing other fields, as we know they’ve been covered.

Next is the `user` query. We know our mock users collection always returns `mockUser`, so we’ll query for that user:

```js
const USER = gql`
  query User($id: ID!) {
    user(id: $id) {
      id
    }
  }
`

test('user', async () => {
  const { server } = createTestServer()
  const { query } = createTestClient(server)

  const id = mockUser._id.toString()
  const result = await query({
    query: USER,
    variables: { id }
  })
  expect(result.data.user.id).toEqual(id)
})
```

For the `searchUsers` test, let’s set it up so that multiple results are returned. For that, we’ll need to temporarily change the mocked `users.find` function. To get access to that function, we need to get the dataSources from `createTestServer()`:

```js
test('searchUsers', async () => {
  const userA = { _id: 'A' }
  const userB = { _id: 'B' }
  const { server, dataSources } = createTestServer()

  dataSources.users.collection.find.mockReturnValueOnce({
    toArray: jest.fn().mockResolvedValue([userA, userB])
  })
```

`mockReturnValueOnce()` will have `users.find` return the given value once and then go back to returning `[mockUser]` as it was before. After we make the query, we can also test to see what `users.find` was called with:

```js
  expect(dataSources.users.collection.find).toHaveBeenCalledWith({
    $text: { $search: 'foo' }
  })
```

All together, that’s:

```js
const SEARCH_USERS = gql`
  query SearchUsers($term: String!) {
    searchUsers(term: $term) {
      ... on User {
        id
      }
    }
  }
`

test('searchUsers', async () => {
  const userA = { _id: 'A' }
  const userB = { _id: 'B' }
  const { server, dataSources } = createTestServer()

  dataSources.users.collection.find.mockReturnValueOnce({
    toArray: jest.fn().mockResolvedValue([userA, userB])
  })

  const { query } = createTestClient(server)

  const result = await query({
    query: SEARCH_USERS,
    variables: { term: 'foo' }
  })

  expect(dataSources.users.collection.find).toHaveBeenCalledWith({
    $text: { $search: 'foo' }
  })
  expect(result.data.searchUsers[0].id).toEqual('A')
  expect(result.data.searchUsers[1].id).toEqual('B')
})
```

For the last test, our `createUser` mutation will be calling `users.insertOne`, which we haven’t mocked yet. Let’s reuse the `insertOne` function we used for reviews:

[`test/guide-test-utils.js`](https://github.com/GraphQLGuide/guide-api/compare/22_0.2.0...23_0.2.0)

```js
const insertOne = jest.fn(
  doc => (doc._id = new ObjectId('5cf8b6ff37568a1fa500ba4e'))
)

export const createTestServer = ({ context = defaultContext } = {}) => {
  const reviews = new Reviews({
    find: jest.fn(() => ({
      toArray: jest.fn().mockResolvedValue(mockReviews)
    })),
    insertOne
  })

  const users = new Users({
    createIndex: jest.fn(),
    find: jest.fn(() => ({
      toArray: jest.fn().mockResolvedValue(mockUsers)
    })),
    insertOne
  })
  
  ...
```

For the mutation input, let’s `pick` the fields from `mockUser`:

[`src/resolvers/User.test.js`](https://github.com/GraphQLGuide/guide-api/blob/23_0.2.0/src/resolvers/User.test.js)

```js
import { pick } from 'lodash'

const CREATE_USER = gql`
  mutation CreateUser($user: CreateUserInput!, $secretKey: String!) {
    createUser(user: $user, secretKey: $secretKey) {
      id
    }
  }
`

test('createUser', async () => {
  const { server } = createTestServer()
  const { mutate } = createTestClient(server)

  const user = pick(mockUser, [
    'firstName',
    'lastName',
    'username',
    'email',
    'authId'
  ])

  const result = await mutate({
    mutation: CREATE_USER,
    variables: {
      user,
      secretKey: process.env.SECRET_KEY
    }
  })

  expect(result).toMatchSnapshot()
})
```

Whenever we’re using a snapshot, we should check it on the first run to make sure it’s correct. If we run `npm test`, then we should see a new file:

[`src/resolvers/__snapshots__/User.test.js.snap`](https://github.com/GraphQLGuide/guide-api/blob/23_0.2.0/src/resolvers/__snapshots__/User.test.js.snap)

```js
// Jest Snapshot v1, https://goo.gl/fbAQLP

exports[`createUser 1`] = `
Object {
  "data": Object {
    "createUser": Object {
      "id": "5cf8b6ff37568a1fa500ba4e",
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
```

Looks good! ✅ We can also see that our statement coverage is above the 40% minimum, so our tests pass!

![Passing console output with statements at 42.68%](../../img/coverage-above-threshold.png)

