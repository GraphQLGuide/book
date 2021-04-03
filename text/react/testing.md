---
title: Testing
description: Testing with mock GraphQL data
---

## Testing

Background: [Testing](../background/testing.md)

> If you’re jumping in here, `git checkout 27_1.0.0` (tag [`27_1.0.0`](https://github.com/GraphQLGuide/guide/tree/27_1.0.0)). Tag [`28_1.0.0`](https://github.com/GraphQLGuide/guide/tree/28_1.0.0) contains all the code written in this section.

As we learned in [Background > Testing > Types of tests](../background/testing.md#types-of-tests), we should be writing *some* unit and e2e tests but mostly integration tests. When we test a component, for instance `<TableOfContents />`, that contains Apollo operations, we need to wrap it with a *provider* like we do in the app:

[`index.js`](https://github.com/GraphQLGuide/guide/blob/27_1.0.0/src/index.js)

```js
render(
  <BrowserRouter>
    <ApolloProvider client={apollo}>
      <MuiThemeProvider theme={theme}>
        <App />
      </MuiThemeProvider>
    </ApolloProvider>
  </BrowserRouter>,
  document.getElementById('root')
)
```

We could use the same `<ApolloProvider client={apollo}>` in our tests, but that would cause queries to be sent to the GraphQL server. In integration tests (and in our component library, if we’re using something like [Storybook](https://storybook.js.org/)), we usually [mock](../background/testing.md#mocking) network requests in order to reduce test runtime and avoid test failures due to internet connection issues or the backend data changing. If we mock our GraphQL operations, then:

- We decide what data is returned, so we can:
  - Test for the presence of the same data.
  - Trust that the data won’t change.
- The operation response "arrives" immediately 😄.

There are two main methods of mocking GraphQL operations with Apollo Client: 

- [`<MockedProvider>`](https://www.apollographql.com/docs/react/development-testing/testing/#mockedprovider): A basic mocking provider included in Apollo Client, with which we write out `{ request, result }` pairs to match requests in our component.
- [`apollo-mocked-provider`](https://github.com/benawad/apollo-mocked-provider): An easier-to-use library that allows us to create an `<ApolloMockedProvider>` with reusable resolvers and customizable links. It also allows us to create an error provider and a loading provider.

We’ll use the latter in our code, and show an example of the former at the end.

For React integration and unit tests, we recommend [`react-testing-library`](https://testing-library.com/react) with [Jest](https://jestjs.io/). We’ll be using both in this section. If you’d like a video introduction to them, as well as testing in general, we recommend [this course](https://testingjavascript.com/) from Kent Dodds.

We run our tests with `npm test`, which runs `react-scripts test`, which runs Jest. It looks for JS files in any `__tests__` directory, for instance `src/components/__tests__/Foo.js`, or with the `.test.js` suffix. The only file it finds is:

[`src/components/App.test.js`](https://github.com/GraphQLGuide/guide/blob/27_1.0.0/src/components/App.test.js)

```js
import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'

it('renders without crashing', () => {
  const div = document.createElement('div')
  ReactDOM.render(<App />, div)
})
```

The test fails with this error message:

`Invariant failed: You should not use <Switch> outside a <Router>`

![npm test output with red FAIL message](../img/npm-test-App-fail.png)

We’re rendering `<App />`, which contains a `<Switch>`, without wrapping it in a router like `<BrowserRouter>` as we do in `src/index.js`. Instead of including a router component in each test, we can make [our own render function](https://testing-library.com/docs/react-testing-library/setup#custom-render) to use in lieu of `ReactDOM.render()`:

[`src/setupTests.js`](https://github.com/GraphQLGuide/guide/blob/28_1.0.0/src/setupTests.js)

```js
import React from 'react'
import {
  createApolloErrorProvider,
  createApolloMockedProvider,
  createApolloLoadingProvider,
} from 'apollo-mocked-provider'
import { printSchema, buildClientSchema } from 'graphql'
import fs from 'fs'
import { render, waitFor } from '@testing-library/react'
import { createMemoryHistory } from 'history'
import { Router } from 'react-router-dom'

const schema = JSON.parse(fs.readFileSync('schema.json'))
const typeDefs = printSchema(buildClientSchema(schema.data))
const ApolloMockedProvider = createApolloMockedProvider(typeDefs)

global.ApolloMockedProvider = ApolloMockedProvider
global.ApolloErrorProvider = createApolloErrorProvider()
global.ApolloLoadingProvider = createApolloLoadingProvider()

const RouterWrapper = ({ children }) => {
  const history = createMemoryHistory()

  return <Router history={history}>{children}</Router>
}

global.render = (ui, options) =>
  render(ui, { wrapper: RouterWrapper, ...options })

global.mockedRender = (ui, customResolvers, options) => {
  const MockedWrapper = ({ children }) => (
    <RouterWrapper>
      <ApolloMockedProvider customResolvers={customResolvers}>
        {children}
      </ApolloMockedProvider>
    </RouterWrapper>
  )

  return render(ui, { wrapper: MockedWrapper, ...options })
}

global.wait = () => waitFor(() => {})
```

We create two global render functions: `render(<Component />)`, which wraps the component with a router, and `mockedRender(<Component />)`, which also adds an `<ApolloMockedProvider>`, which we get from `createApolloMockedProvider(typedefs)`, which comes from `apollo-mocked-provider`. The `typeDefs` we get from parsing the `schema.json` file we got from introspecting the server. For testing, we don’t need the `<BrowserRouter>` we use in the app—we can use a plain `<Router>` with history tracked in memory.

`apollo-mocked-provider` also exports `createApolloErrorProvider` and `createApolloLoadingProvider`, which we use to create the `<ApolloErrorProvider>` and `<ApolloLoadingProvider>` components. The former causes operations to return an error and no data, and the latter causes operations to just return `loading: true`. Lastly, we add a global `wait()` that we can `await` during our tests. Before the `wait()`, Apollo hooks will return `loading: true`, and after the `wait()`, they’ll return the data or error (except for the `<ApolloLoadingProvider>`, which keeps Apollo in the loading state).

Let’s delete `src/components/App.test.js` and use `mockedRender()` with a smaller component, `<TableOfContents>`:

`src/components/TableOfContents.test.js`

```js
import React from 'react'
import { screen } from '@testing-library/react'

import TableOfContents from './TableOfContents'

describe('TableOfContents', () => {
  it('renders loading status and chapters', async () => {
    mockedRender(<TableOfContents />, {
      Chapter: () => ({
        title: () => 'Chapter-title',
      }),
    })

    screen.getByRole('status')
    await wait()
    screen.getAllByText('Chapter-title')
  })
})
```

We pass a custom resolver for `Chapter.title` to `mockedRender()` so that all the chapter titles in the mocked response have the title `Chapter-title`. Then, we can check at the end of the test whether that text is found (`screen.getAllByText('Chapter-title')` will error if it doesn’t find any matching nodes). 

To check that the loading skeleton renders at first, we need something to search for. The recommended priority order for queries is:

- `getByRole` (role refers to [ARIA roles](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques#Roles))
- `getByLabelText`
- `getByPlaceholderText`
- `getByText`
- `getByDisplayValue` (the current value of a form field)
- `getByAltText`
- `getByTitle`
- `getByTestId` (e.g., `<div data-testid="custom-element" />`)

We’re using `getByRole`. Some HTML elements have inherent roles: for instance, a `<button>` has the `button` role. We just have divs and a header in our `LoadingSkeleton` component, so we need to set the role attribute. While we’re at it, let’s also add loading text that a screen reader would read (hidden with CSS):

[`src/components/TableOfContents.js`](https://github.com/GraphQLGuide/guide/blob/28_1.0.0/src/components/TableOfContents.js)

```js
const LoadingSkeleton = () => (
  <div>
    <div className="sr-only" role="status">
      Loading
    </div>
    <h1>
      <Skeleton />
    </h1>
    <Skeleton count={4} />
  </div>
)
```

Now we can run the test and see that it passes, albeit with an error:

```sh
$ npm test
```

![Warning: Encountered two children with the same key, `9`](../img/table-of-contents-test-error.png)

Our `<li>`s have duplicate `key` attributes:

```js
<ul className="TableOfContents-sections">
  {chapter.sections.map((section) => (
    <li key={section.number}>
```

So `section.number` must be the same for multiple sections. To see what the mocked provider is returning, let’s add a link that logs all responses:

[`src/setupTests.js`](https://github.com/GraphQLGuide/guide/blob/28_1.0.0/src/setupTests.js)

```js
import { ApolloLink } from '@apollo/client'

const responseLogger = new ApolloLink((operation, forward) => {
  return forward(operation).map((result) => {
    console.log(JSON.stringify(result, null, '  '))
    return result
  })
})

const ApolloMockedProvider = createApolloMockedProvider(typeDefs, {
  links: () => [responseLogger],
})
```

Now when we `npm test`, we see in the terminal:

```
console.log src/setupTests.js:18
  {
    "data": {
      "chapters": [
        {
          "id": 46,
          "number": -59.910131803037636,
          "title": "Chapter-title",
          "sections": [
            {
              "id": "Hello World",
              "number": 19,
              "title": "Hello World",
              "__typename": "Section"
            },
            {
              "id": "Hello World",
              "number": 17,
              "title": "Hello World",
              "__typename": "Section"
            }
          ],
          "__typename": "Chapter"
        },
        {
          "id": -74,
          "number": 27.46611005161776,
          "title": "Chapter-title",
          "sections": [
            {
              "id": "Hello World",
              "number": 73,
              "title": "Hello World",
              "__typename": "Section"
            },
            {
              "id": "Hello World",
              "number": 14,
              "title": "Hello World",
              "__typename": "Section"
            }
          ],
          "__typename": "Chapter"
        }
      ]
    }
  }
```

The sections have different numbers in the response, so how do they wind up with the same number in the JSX? 

Since the section `id`s are the same, only a single `Section` object is saved to the cache, and the JSX maps over two references to that object. We can fix this issue by adding a custom resolver for `id` to the `ApolloMockedProvider` we set up here:

[`src/setupTests.js`](https://github.com/GraphQLGuide/guide/blob/28_1.0.0/src/setupTests.js)

```js
global.mockedRender = (ui, customResolvers, options) => {
  const MockedWrapper = ({ children }) => (
    <RouterWrapper>
      <ApolloMockedProvider customResolvers={customResolvers}>
        {children}
      </ApolloMockedProvider>
    </RouterWrapper>
  )

  return render(ui, { wrapper: MockedWrapper, ...options })
}
```

We can either pass in `customResolvers` to `mockedRender()` or add them here. Since distinct `id`s is something we’d like throughout all of our tests, let’s add it here:

```js
global.mockedRender = (ui, customResolvers, options) => {
  let id = 1

  const MockedWrapper = ({ children }) => (
    <RouterWrapper>
      <ApolloMockedProvider
        customResolvers={{
          Section: () => ({
            id: id++,
            number: id++,
          }),
          ...customResolvers,
        }}
      >
        {children}
      </ApolloMockedProvider>
    </RouterWrapper>
  )

  return render(ui, { wrapper: MockedWrapper, ...options })
}
```

Now any `Section.id` will be a distinct number. We include `Section.number` (which is currently randomly generated) as well, just to make sure it will also be distinct.

And now our test passes:

```
 PASS  src/components/TableOfContents.test.js
  TableOfContents
    ✓ renders loading status and chapters (173ms)

  console.log src/setupTests.js:18
    {
      "data": {
        "chapters": [
          {
            "id": 52,
            "number": 4.76048836297727,
            "title": "Chapter-title",
            "sections": [
              {
                "id": "1",
                "number": 2,
                "title": "Hello World",
                "__typename": "Section"
              },
              {
                "id": "3",
                "number": 4,
                "title": "Hello World",
                "__typename": "Section"
              }
            ],
            "__typename": "Chapter"
          },
          {
            "id": -26,
            "number": -66.27698741173478,
            "title": "Chapter-title",
            "sections": [
              {
                "id": "5",
                "number": 6,
                "title": "Hello World",
                "__typename": "Section"
              },
              {
                "id": "7",
                "number": 8,
                "title": "Hello World",
                "__typename": "Section"
              }
            ],
            "__typename": "Chapter"
          }
        ]
      }
    }

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
Time:        6.083s
Ran all test suites related to changed files.
```

✅

While we’re writing and debugging tests, we may find the `screen.debug()` function useful: it logs the current HTML, like this:

```js
describe('TableOfContents', () => {
  it('renders loading status and chapters', async () => {
    mockedRender(<TableOfContents />, {
      Chapter: () => ({
        title: () => 'Chapter-title',
      }),
    })

    screen.getByRole('status')
    screen.debug()
    await wait()
    screen.getAllByText('Chapter-title')
  })
})
```

```html
<body>
  <div>
    <nav
      class="TableOfContents"
    >
      <div>
        <div
          class="sr-only"
          role="status"
        >
          Loading
        </div>
        <h1>
          <span>
            <span
              class="react-loading-skeleton css-1vmnjpn-skeletonStyles-Skeleton"
            >
              ‌
            </span>
          </span>
        </h1>
        <span>
          <span
            class="react-loading-skeleton css-1vmnjpn-skeletonStyles-Skeleton"
          >
            ‌
          </span>
          <span
            class="react-loading-skeleton css-1vmnjpn-skeletonStyles-Skeleton"
          >
            ‌
          </span>
          <span
            class="react-loading-skeleton css-1vmnjpn-skeletonStyles-Skeleton"
          >
            ‌
          </span>
          <span
            class="react-loading-skeleton css-1vmnjpn-skeletonStyles-Skeleton"
          >
            ‌
          </span>
        </span>
      </div>
    </nav>
  </div>
</body>
```

Now that we’ve tested a component that calls `useQuery()`, let’s test a component that calls `useMutation()`. `<Review>` calls the `removeReview` mutation when the Delete menu item is selected (and the subsequent dialog’s "Sudo delete" button is pressed). In our test, we can wait until the `reviews` query data is rendered and then trigger the necessary clicks on the page. And we can mock an error response, which should result in `alert('👮‍♀️✋ You can only delete your own reviews!')` being called:

[`src/components/Reviews.js`](https://github.com/GraphQLGuide/guide/blob/28_1.0.0/src/components/Reviews.js)

```js
  function deleteReview() {
    closeMenu()
    removeReview({
      variables: { id },
      optimisticResponse: {
        removeReview: true,
      },
    }).catch((e) => {
      if (find(e.graphQLErrors, { message: 'unauthorized' })) {
        alert('👮‍♀️✋ You can only delete your own reviews!')
      }
    })
  }
```

Here’s the test:

[`src/components/Reviews.test.js`](https://github.com/GraphQLGuide/guide/blob/28_1.0.0/src/components/Reviews.test.js)

```js
import React from 'react'
import { screen, fireEvent } from '@testing-library/react'

import Reviews from './Reviews'

describe('Reviews', () => {
  it('alerts when deleting', async () => {
    jest.spyOn(window, 'alert').mockImplementation(() => {})

    mockedRender(<Reviews />, {
      Mutation: () => ({
        removeReview: () => {
          throw new Error('unauthorized')
        },
      }),
    })

    await wait()
    fireEvent.click(screen.getAllByRole('button', { name: 'Open menu' })[0])
    await wait()
    fireEvent.click(screen.getAllByRole('menuitem', { name: 'Delete' })[0])
    await wait()
    fireEvent.click(screen.getAllByRole('button', { name: 'Sudo delete' })[0])
    await wait()
    expect(window.alert).toHaveBeenCalled()
  })
})
```

First we spy on `window.alert` so that we can test at the end whether it’s been called. We also mock it, because otherwise, we’d get this error:

```
console.error node_modules/jsdom/lib/jsdom/virtual-console.js:29
  Error: Not implemented: window.alert
    at module.exports (/Users/me/gh/guide/node_modules/jsdom/lib/jsdom/browser/not-implemented.js:9:17)
    at /Users/me/gh/guide/node_modules/jsdom/lib/jsdom/browser/Window.js:728:7  
```

`jsdom`, the library that Jest is using to render our React components, doesn’t support `window.alert`, so we need to implement it.

We call `mockedRender()` with the component we’re testing, `<Reviews />`, and a custom resolver for `Mutation.removeReview`. After that, we `await wait()` so we know that the list of reviews has been provided by `useQuery(REVIEWS_QUERY)` and the component has been re-rendered with data. Then, we click the menu button, wait for React to react to the click and re-render, click and wait a couple more times, and then check that `window.alert` was called.

The below line doesn’t work yet, as there is no button with a name of `Open menu`:

```js
fireEvent.click(screen.getAllByRole('button', { name: 'Open menu' })[0])
```

We can give it a name by setting the button’s `aria-label`:

[`src/components/Review.js`](https://github.com/GraphQLGuide/guide/blob/28_1.0.0/src/components/Review.js)

```js
<IconButton aria-label="Open menu" onClick={openMenu}>
  <MoreVert />
</IconButton>
```

The other two clicks work, because `name` matches against the text node child:

```js
fireEvent.click(screen.getAllByRole('menuitem', { name: 'Delete' })[0])
fireEvent.click(screen.getAllByRole('button', { name: 'Sudo delete' })[0])
```

```js
<MenuItem
  onClick={() => {
    closeMenu()
    setDeleteConfirmationOpen(true)
  }}
>
  Delete
</MenuItem>
```

```js
<Button onClick={deleteReview} color="primary" autoFocus>
  Sudo delete
</Button>
```

We can run our test with:

```sh
$ npm test -- -t alerts
```

`--` tells npm to pass what follows to the test command, and `-t alerts` tells Jest to run tests with names that contain "alerts" (for more command-line options, run `npx jest -h`). 

We get this error:

```js
 FAIL  src/components/Reviews.test.js (7.098s)
  ● Console

    console.warn node_modules/react/cjs/react.development.js:315
      Warning: React.createFactory() is deprecated and will be removed in a future major release. Consider using JSX or use React.createElement() directly instead.
    console.log src/setupTests.js:18
      {
        "errors": [
          {
            "message": "No mock defined for type \"ObjID\"",
            "locations": [],
            "path": [
              "currentUser",
              "id"
            ]
          }
        ],
        "data": {
          "currentUser": null
        }
      }
```

The `React.createFactory()` warning we can ignore, but the `"No mock defined for type \"ObjID\""` error is a problem. That’s coming from `ApolloMockedProvider`, and it means we need to add a resolver for `ObjID`:

[`src/setupTests.js`](https://github.com/GraphQLGuide/guide/blob/28_1.0.0/src/setupTests.js)

```js
const MockedWrapper = ({ children }) => (
  <RouterWrapper>
    <ApolloMockedProvider
      customResolvers={{
        Section: () => ({
          id: id++,
          number: id++,
        }),
        ObjID: () => id++,
        ...customResolvers,
      }}
    >
      {children}
    </ApolloMockedProvider>
  </RouterWrapper>
)
```

Now our test passes:

```
$ npm test -- -t alerts

 PASS  src/components/Reviews.test.js (8.903s)
  ● Console

    console.log src/setupTests.js:18
      {
        "data": {
          "currentUser": {
            "id": 1,
            "firstName": "Hello World",
            "name": "Hello World",
            "username": "Hello World",
            "email": "Hello World",
            "photo": "Hello World",
            "hasPurchased": "TEAM",
            "favoriteReviews": [
              {
                "id": 2,
                "__typename": "Review"
              },
              {
                "id": 3,
                "__typename": "Review"
              }
            ],
            "__typename": "User"
          }
        }
      }
    console.log src/setupTests.js:18
      {
        "data": {
          "reviews": [
            {
              "id": 4,
              "text": "Hello World",
              "stars": 11,
              "createdAt": -50.81164015087056,
              "favorited": false,
              "author": {
                "id": 5,
                "name": "Hello World",
                "photo": "Hello World",
                "username": "Hello World",
                "__typename": "User"
              },
              "__typename": "Review"
            },
            {
              "id": 6,
              "text": "Hello World",
              "stars": -84,
              "createdAt": -38.71062432606376,
              "favorited": false,
              "author": {
                "id": 7,
                "name": "Hello World",
                "photo": "Hello World",
                "username": "Hello World",
                "__typename": "User"
              },
              "__typename": "Review"
            }
          ]
        }
      }
    console.log src/setupTests.js:18
      {
        "data": {
          "reviewCreated": {
            "id": 8,
            "text": "Hello World",
            "stars": 82,
            "createdAt": -69.828879356296,
            "favorited": false,
            "author": {
              "id": 9,
              "name": "Hello World",
              "photo": "Hello World",
              "username": "Hello World",
              "__typename": "User"
            },
            "__typename": "Review"
          }
        }
      }
    console.log src/setupTests.js:18
      {
        "data": {
          "reviewCreated": {
            "id": 10,
            "text": "Hello World",
            "stars": -27,
            "createdAt": -93.91597055206873,
            "favorited": true,
            "author": {
              "id": 11,
              "name": "Hello World",
              "photo": "Hello World",
              "username": "Hello World",
              "__typename": "User"
            },
            "__typename": "Review"
          }
        }
      }
    console.log src/setupTests.js:18
      {
        "errors": [
          {
            "message": "unauthorized",
            "locations": [],
            "path": [
              "removeReview"
            ]
          }
        ],
        "data": {
          "removeReview": null
        }
      }

Test Suites: 1 skipped, 1 passed, 1 of 2 total
Tests:       1 skipped, 1 passed, 2 total
Snapshots:   0 total
Time:        10.277s, estimated 11s
Ran all test suites with tests matching "alerts".

Active Filters: test name /alerts/
 › Press c to clear filters.
```

It passed! And it logs what data the mocked provider provides for all operations triggered during the test: `Query.currentUser`, `Query.reviews`, `Subscription.reviewCreated`, and `Mutation.removeReview`, which we can see contains the error we expect.

`apollo-mocked-provider` contains a convenience provider—the `ApolloErrorProvider` we have in `src/setupTests.js`. It returns an error for all operations, so we don’t need to write a resolver that throws. In our test, we could try using it with:

```js
render(
  <ApolloErrorProvider>
    <Reviews />
  </ApolloErrorProvider>
)
```

But then `Query.reviews` would return an error as well, and we wouldn’t have any reviews to click on during the test, so it would fail. Also, we’d want to set the specific error text to trigger our alert, so we’d do:

```js
render(
  <ApolloErrorProvider graphQLErrors={[{ message: 'unauthorized' }]>
    <Reviews />
  </ApolloErrorProvider>
)
```

Another provider we have from the library is `ApolloLoadingProvider`, which keeps Apollo in the loading state. We can use it like this:

[`src/components/Section.test.js`](https://github.com/GraphQLGuide/guide/blob/28_1.0.0/src/components/Section.test.js)

```js
import React from 'react'
import { screen } from '@testing-library/react'

import Section from './Section'

describe('Section', () => {
  it('should render loading status', async () => {
    render(
      <ApolloLoadingProvider>
        <Section />
      </ApolloLoadingProvider>
    )

    screen.getByRole('status')
  })
})
```

As before, we need to add a role to the skeleton that `<Section>` is using:

[`src/components/Section.js`](https://github.com/GraphQLGuide/guide/blob/28_1.0.0/src/components/Section.js)

```js
sectionContent = (
  <div role="status">
    <Skeleton count={7} />
  </div>
)
```

We can see that with `npm test -- -t Section`, it passes!

Also, note that our test would continue to pass if we waited, as `ApolloLoadingProvider` stays in the loading state:

```js
  it('should render loading status', async () => {
    render(
      <ApolloLoadingProvider>
        <Section />
      </ApolloLoadingProvider>
    )

    screen.getByRole('status')
    await wait()
    screen.getByRole('status')
  })
```

For our last test, let’s use [`<MockedProvider>`](https://www.apollographql.com/docs/react/development-testing/testing/#mockedprovider), the mocking provider included with Apollo Client. Instead of defining resolvers, we pass in a `mocks` parameter that lists `(request, result)` pairings. Then, during the test, whenever an operation is sent that matches a mock `request`, the corresponding `result` is returned. For `TableOfContents`, the `request` is `{ query: CHAPTER_QUERY }`, and we write out the result data to match the fields selected in the query:

[`src/components/TableOfContents.test.js`](https://github.com/GraphQLGuide/guide/blob/28_1.0.0/src/components/TableOfContents.test.js)

```js
import { MockedProvider } from '@apollo/client/testing'

import TableOfContents, { CHAPTER_QUERY } from './TableOfContents'

const mocks = [
  {
    request: { query: CHAPTER_QUERY },
    result: {
      data: {
        chapters: [
          {
            id: 1,
            number: 1,
            title: 'mocks-title',
            sections: [
              {
                id: '1',
                number: 1,
                title: 'Hello World',
              },
              {
                id: '2',
                number: 2,
                title: 'Hello World',
              },
            ],
          },
          {
            id: 2,
            number: 2,
            title: 'mocks-title',
            sections: [
              {
                id: '3',
                number: 3,
                title: 'Hello World',
              },
              {
                id: '4',
                number: 4,
                title: 'Hello World',
              },
            ],
          },
        ],
      },
    },
  },
]

describe('TableOfContents', () => {
  it('renders loading status and chapters', ...)

  it('works with MockedProvider', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <TableOfContents />
      </MockedProvider>
    )

    await wait()
    screen.getAllByText('mocks-title')
  })
})
```

For convenience, we’re omitting the `__typename` field in our mock response, so we tell Apollo to not add `__typename` to our request documents like it usually does (`addTypename={false}`).

Now we have all four tests passing across three test files. We’ve used `ApolloMockedProvider`, `ApolloLoadingProvider`, and `MockedProvider`, and seen how to use `ApolloErrorProvider`. We’ve tested queries and a mutation and seen `ApolloMockedProvider` working with a subscription. We’ve also seen the difference between testing `<TableOfContents>` with `ApolloMockedProvider` versus `MockedProvider` (the former was much shorter 😄).

One last thing is that while our tests are passing, our linting no longer is! 

```sh
$ npm run lint

> guide@1.0.0 lint /Users/me/gh/guide
> eslint src/


/Users/me/gh/guide/src/components/Reviews.test.js
  10:5   error  'mockedRender' is not defined  no-undef
  18:11  error  'wait' is not defined          no-undef
  20:11  error  'wait' is not defined          no-undef
  22:11  error  'wait' is not defined          no-undef
  24:11  error  'wait' is not defined          no-undef

/Users/me/gh/guide/src/components/Section.test.js
   8:5   error  'render' is not defined                 no-undef
   9:8   error  'ApolloLoadingProvider' is not defined  react/jsx-no-undef
  15:11  error  'wait' is not defined                   no-undef

/Users/me/gh/guide/src/components/TableOfContents.test.js
  55:5   error  'mockedRender' is not defined  no-undef
  62:11  error  'wait' is not defined          no-undef
  67:5   error  'render' is not defined        no-undef
  73:11  error  'wait' is not defined          no-undef

✖ 12 problems (12 errors, 0 warnings)
```

The global variables are not defined in the files in which we’re using them! The solution to this problem is:

- To say "John & Loren, y’all are silly. Global variables? What is this, jQuery?!" and fix `src/setupTests.js` by replacing all the `global.*` lines with export statements.
- Decide that the convenience is worth the overhead of new devs learning about them, and fix our linter!

To do the latter solution, we add a `globals` field to our config file:

[`.eslintrc.js`](https://github.com/GraphQLGuide/guide/blob/28_1.0.0/.eslintrc.js)

```js
module.exports = {
  extends: 'react-app',
  plugins: ['graphql'],
  parser: 'babel-eslint',
  globals: {
    wait: 'readonly',
    render: 'readonly',
    mockedRender: 'readonly',
    ApolloMockedProvider: 'readonly',
    ApolloErrorProvider: 'readonly',
    ApolloLoadingProvider: 'readonly',
  },
  rules: {
    'graphql/template-strings': [ ...  ],
    'react/jsx-no-undef': ['error', { allowGlobals: true }],
  },
}
```

`globals` takes care of the `no-undef` lint errors, but we still have the [`react/jsx-no-undef`](https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-no-undef.md) error, which we can fix with this rule: `'react/jsx-no-undef': ['error', { allowGlobals: true }],`.

And now `npm run lint` passes ✅😊.

