## Unit tests

> If you’re jumping in here, `git checkout 23_0.2.0` (tag [23_0.2.0](https://github.com/GraphQLGuide/guide-api/tree/23_0.2.0), or compare [23...24](https://github.com/GraphQLGuide/guide-api/compare/23_0.2.0...24_0.2.0))

We’ve written integration tests that cover most of our queries and mutations. If we want a higher test coverage, we could write more integration tests with different arguments or mock data that result in different parts of the code getting run. We could also write unit tests that cover individual functions. In this section we’ll write a unit test that covers the `user` query. As we can see in the coverage report, we’re missing three lines:

![User.js coverage showing 64%](../../img/coverage-user-16.png)

Let’s first write a unit test that triggers the invalid ObjectId error. We can either add it to `User.test.js` or create separate files for unit tests named `File.unit.test.js`. The latter has the benefit of smaller files and we can run all the unit tests together with `npm test -- unit`. 

> An alternative file structure would be to move all integration tests to the `test/` directory and only place unit tests next to the files they’re testing. So `test/User.test.js` for integration and `src/resolvers/User.test.js` for unit testing `src/resolvers/User.js`.

Instead of using the test server and client, we can import the resolver function and call it ourselves:

[`src/resolvers/User.unit.test.js`](https://github.com/GraphQLGuide/guide-api/blob/24_0.2.0/src/resolvers/User.unit.test.js)

```js
import resolvers from './User'
import { InputError } from '../util/errors'

test('user throws InputError', () => {
  expect(() =>
    resolvers.Query.user(
      null,
      { id: 'invalid' },
      { dataSources: { users: { findOneById: jest.fn() } } }
    )
  ).toThrow(InputError)
})
```

We mock the `dataSources.users.findOneById` function, and we assert that an instance of `InputError` will be thrown.

However if we want to fit the strict definition of a unit test that says everything must be mocked, we need to mock `ObjectId()`. Since it’s imported from an NPM module, we can use the [`jest.mock()`](https://jestjs.io/docs/en/jest-object#jestmockmodulename-factory-options) function, which mocks the module for all the tests in the same file:

```js
jest.mock('mongodb', () => ({
  ObjectId: id => {
    if (id === 'invalid') {
      throw new Error(
        'Argument passed in must be a single String of 12 bytes or a string of 24 hex characters'
      )
    }
  }
}))
```

Now when `User.js` imports the function (`import { ObjectId } from 'mongodb'`), it will get our version of it.

> For further examples of `jest.mock()`, check out the [SQL testing](#sql-testing) section later on in this chapter.

When we re-run `npm test` and refresh the coverage report, we see that the statements coverage has gone up from 16/25 to 18/25:

![User.js coverage showing 72%](../../img/coverage-user-18.png)

There’s one statement left in this function: the `throw error` line. For that, we need to have `dataSources.users.findOneById()` throw a different error and make sure that `resolvers.Query.user()` throws the same error.

[`src/resolvers/User.unit.test.js`](https://github.com/GraphQLGuide/guide-api/blob/24_0.2.0/src/resolvers/User.unit.test.js)

```js
import resolvers from './User'
import { InputError } from '../util/errors'

test('user throws data source errors', () => {
  const MOCK_MONGO_ERROR = 'Unable to connect to DB'

  expect(() =>
    resolvers.Query.user(
      null,
      { id: mockMongoId },
      {
        dataSources: {
          users: {
            findOneById: () => {
              throw new Error(MOCK_MONGO_ERROR)
            }
          }
        }
      }
    )
  ).toThrow(MOCK_MONGO_ERROR)
})
```

![User.js coverage showing 76%](../../img/coverage-user-19.png)

Now the `user` query is completely green. And we could continue writing unit tests for more functions or files, either until we covered the most important pieces of logic, or until we met our overall desired test coverage percentage.

