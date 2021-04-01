# Adding Apollo

> If you’re jumping in here, `git checkout ssr3_1.0.0` (tag [ssr3_1.0.0](https://github.com/GraphQLGuide/guide/tree/ssr3_1.0.0)). Tag [`ssr4_1.0.0`](https://github.com/GraphQLGuide/guide/tree/ssr4_1.0.0) contains all the code written in this section.

Let’s try rendering a component that uses Apollo. `ReviewList` calls `useQuery()`, and we can include it in our `App`:

[`server/api/server.js`](https://github.com/GraphQLGuide/guide/blob/ssr4_1.0.0/server/api/server.js)

```js
import ReviewList from '../src/components/ReviewList'

const App = () => (
  <div>
    <h1>Reviews:</h1>
    <ReviewList orderBy="createdAt_DESC" />
  </div>
)

export default (req, res) => { ... }
```

When we try to load the page, we get `502 BAD_GATEWAY`:

![“An error occurred with this application”](../img/ssr-502-error.png)

In the terminal, we can see the cause of the error:

```
Unhandled rejection: { Invariant Violation: Could not find "client" in the context or passed in as an option. Wrap the root component in an <ApolloProvider>, or pass an ApolloClient instance in via options.
```

This is Apollo Client throwing an error—`useQuery()` is looking for an `ApolloClient` instance and not finding one. Our previous code for creating the client doesn’t work in Node, so let’s create a new instance. Normally, we’d do:

```js
const apollo = new ApolloClient({
  uri: '/graphql',
  cache: new InMemoryCache(),
})
```

For SSR, we add `ssrMode: true`, we can’t use a relative path URI, and we need to provide an implementation of `fetch` (which is defined in the browser but not in Node):

[`server/api/server.js`](https://github.com/GraphQLGuide/guide/blob/ssr4_1.0.0/server/api/server.js)

```js
import {
  ApolloClient,
  createHttpLink,
  InMemoryCache,
  ApolloProvider,
} from '@apollo/client'
import fetch from 'cross-fetch'

const apollo = new ApolloClient({
  link: createHttpLink({
    uri: 'https://api.graphql.guide/graphql',
    fetch,
  }),
  ssrMode: true,
  cache: new InMemoryCache(),
})
```

We provide `fetch` from a library, and we use the full URI. Now we can provide the client to our app:

```js
const App = () => (
  <ApolloProvider client={apollo}>
    <h1>Reviews:</h1>
    <ReviewList orderBy="createdAt_DESC" />
  </ApolloProvider>
)
```

When we load the page, we only see the text “Reviews:”. If we hit `Cmd-Alt-U` to view page source, we can see that `<ReviewList>` is, in fact, being rendered (`<div class="Reviews-content">`), and we can tell from the spinner div that the query is in `loading` state:

![The HTML source for localhost:3000](../img/ssr-spinner.png)

This makes sense—we’re calling `renderToString()` on the app in its initial state, when Apollo hasn’t had time to make any GraphQL requests. We can give it time by calling `getDataFromTree()` from `@apollo/client/react/ssr` and waiting for it to complete with `.then()`:

```js
export default (req, res) => {
  getDataFromTree(<App />).then((content) => {
    // content has the HTML rendered with data from GraphQL requests
```

We can render the content with the root div to an HTML string to include in the response, and we can also extract Apollo Client’s state and include it in a script tag:

[`server/api/server.js`](https://github.com/GraphQLGuide/guide/blob/ssr4_1.0.0/server/api/server.js)

```js
export default (req, res) => {
  getDataFromTree(<App />).then((content) => {
    const appHtml = renderToString(
      <div id="root" dangerouslySetInnerHTML={{ __html: content }} />
    )
    const initialState = apollo.extract()

    res.status(200).send(`
      <!doctype html>
      <html lang="en">
      
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
        <title>The GraphQL Guide</title>
      </head>
      
      <body>
        ${appHtml}
        <script>
          window.__APOLLO_STATE__=${JSON.stringify(initialState).replace(
            /</g,
            '\\u003c'
          )}
        </script>
      </body>
      
      </html>
    `)
  })
}
```

> `getDataFromTree()` runs all queries encountered. If we want to skip one (and have that part of the page initially show the loading state), we can add the `{ ssr: false }` option to the query, like: `useQuery(USER_QUERY, { ssr: false })`.

We escape any `<` characters inside the state to guard against a `</script>...` being included for an [XSS attack](https://en.wikipedia.org/wiki/Cross-site_scripting). We save the state to a global variable so that we can use it to rehydrate our Apollo cache: our client-side JS would include it in the `ApolloClient` initialization:

```js
import { InMemoryCache, ApolloClient } from '@apollo/client'

const cache = new InMemoryCache({ typePolicies: ... })
cache.restore(JSON.parse(window.__APOLLO_STATE__))

const client = new ApolloClient({ link, cache, typeDefs })
```

> If we have queries that run on load and have a `network-only` or `cache-and-network` fetch policy, we probably don’t need them to send a network request, since the cache has fresh data. We can have them just load from the cache by adding the `ssrForceFetchDelay: 100` option to the `ApolloClient` creation.

If we reload [localhost:3000](http://localhost:3000/), we see it works! Albeit without CSS—the reviewer user images and star icons are rather large 😄. To get CSS working, we’d need to include it in our HTML string, which our version of Material UI [has instructions for](https://v3.material-ui.com/guides/server-rendering/#the-server-side).

We also don’t have routing set up—all URL paths result in the reviews page. Our CRA app uses `<BrowserRouter>`, and our SSR app would need to use `<StaticRouter>` with the route [based on the path of the request](https://reactrouter.com/web/guides/server-rendering), so only `/reviews` would show the review page, etc.

---

In summary, we installed Vercel to run a serverless function (we can also easily deploy it with `vercel deploy`), we returned an HTML page with a React component rendered to HTML, and we set up Apollo:

- Created a server-side instance of `ApolloClient` to provide to the component tree.
- Waited for `getDataFromTree()` to complete so that Apollo has time to fetch data from our GraphQL server.
- Included the app rendered to HTML with data in the HTML page.
- Included the Apollo Client state in a global variable.

And we saw example code for rehydrating React and Apollo in our client JS.