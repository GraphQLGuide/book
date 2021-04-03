---
title: Testing
description: How to mock during tests, and the different types of texts
---

# Testing

- [Mocking](#mocking)
- [Types of tests](#types-of-tests)

## Mocking

First let’s go over *mocking*. Let’s say we have a file with math functions:

`math.js`

```js
export const add = (a, b) => a + b
export const multiply = (a, b) => a * b
```

And our app, which uses the math functions:

`app.js`

```js
import { add, multiply } from './math'

export const addThenMultiply = (a, b, c) => multiply(add(a, b), c)
```

A test for our app might look like this:

`app.test.js`

```js
import { addThenMultiply } from './app'

test('returns the correct result', () => {
  const result = addThenMultiply(2, 2, 5)
  expect(result).toEqual(20)
})
```

The test calls `addThenMultiply()`, which then calls `add()` and `multiply()`.

But what if we only want to test the logic inside `addThenMultiply()` and *not* the logic inside `add()` and `multiply()`? Then we need to *mock* `add()` and `multiply()`—replace them with mock functions that either don’t do anything, or just return a set number. We replace them with mock functions that don’t do anything with `jest.mock()`:

```js
import { addThenMultiply } from './app'
import * as math from './math'

jest.mock('./math.js')

test('calls add and multiply', () => {
  addThenMultiply(2, 2, 5)
  expect(math.add).toHaveBeenCalled()
  expect(math.multiply).toHaveBeenCalled()
})
```

`add()` and `multiply()` don’t return anything—they just track whether they’ve been called. So that’s what we test. If we want to also test whether they’re called in the right way, we can control what they return():

```js
import { addThenMultiply } from './app'
import * as math from './math'

jest.mock('./math.js', () => ({
  add: jest.fn(() => 4),
  multiply: jest.fn(() => 20)
}))

test('calls with the right parameters and returns the result of multiply', () => {
  const result = addThenMultiply(2, 2, 5)
  expect(math.add).toHaveBeenCalledWith(2, 2)
  expect(math.multiply).toHaveBeenCalledWith(4, 5)
  expect(result).toEqual(20)
})
```

One danger of mocking too much is that we generally don’t want to test the implementation of something—just the output. In this case, `addThenMultiply()` could have been implemented differently, for instance:

`app.js`

```js
import { add } from './math'

export const addThenMultiply = (a, b, c) => {
  const multiplicand = add(a, b)
  let total = 0
  for (let i = 0; i < c; i++) {
    total = add(total, multiplicand)
  }
  return total
}
```

Now even though the function is correct, our test would fail. An example of testing the implementation for React components would be looking at state values instead of just looking at the output (what the render function returns).

## Types of tests

There are three main types of automated tests:

- **Unit**: tests a function (or more generally, a small piece of code) and mocks any functions called by that function.
- **Integration**: tests a function and the functions called by that function, mocking as little as possible. Usually functions that involve network requests are mocked.
- **End-to-end (e2e)**: tests the whole running application. Usually refers to the whole stack—including frontend server, API server, and database—running as they would in production, and the tests click and type in the UI. In the context of backend, it can mean just the API server and database are running, and tests send HTTP requests to the API server.

Should we write tests? What kind, and how many?

> “Write tests. Not too many. Mostly integration.”
> —[Guillermo Rauch](https://twitter.com/rauchg/status/807626710350839808)

Yes, we should write tests. No, we don’t need them to cover 100% of our code. Most of our tests should be integration tests. 

We write tests so that when we write new code, we can have confidence that the new code won’t break things that used to work. We can cover most of our code (or more importantly, our use cases) with integration tests. Why not cover everything with unit tests? Because it would take forever to write all of them, and some of them would test implementation, so whenever we refactored, we would have to rewrite our tests. We can cover the same amount of code with fewer integration tests, because each test mocks fewer things and covers more code. We don’t cover everything with e2e tests because they would take forever to run—after clicking or submitting a form, the test runner has to wait for the animation to complete or the network request to finish, which in one test might just add up to seconds, but with a whole test suite could take minutes. And it would slow down development if we had to wait minutes to see if the change we just made broke anything.

So the first thing we should do when writing tests is create integration tests to cover our important use cases. Then we can look at the code coverage and fill in the holes with more integration tests or with unit tests. How many e2e tests we write depends on how much of a difference there is between the integration and the e2e environments. For full-stack tests, there might be a lot of differences between the integration test runner and an actual browser, so we should at least test the critical path (the most important user actions, for example, in `twitter.com`’s case, logging in, posting a tweet, and scrolling the feed). For backend, where the integration tests include apollo server’s request pipeline, there’s not much difference between integration and e2e—in which case we can just do a couple tests that make sure the HTTP server runs and the connection to the database works.

How we write tests depends on our *test runner*—the tool we use to run our testing code and report the results to us. For JavaScript unit and integration tests, we recommend [Jest](https://jestjs.io/), and for JS integration tests, we recommend [Cypress](https://www.cypress.io/).

