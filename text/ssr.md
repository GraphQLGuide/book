# Server-Side Rendering

Chapter contents:

* [Setting up the server](ssr.md#setting-up-the-server)
* [Adding React](ssr.md#adding-react)
* [Adding Apollo](ssr.md#adding-apollo)

---

Background: [SSR](bg.md#ssr), [Node](bg.md#node-npm-and-nvm), [HTTP](bg.md#http), [Server](bg.md#server), and the [React chapter](6.md)

If we render our app on the server the same way we render on the client, then all our Apollo Client queries will be in the loading state, and the HTML the server sends to the client will have loading spinners and skeletons everywhere. In most cases, we want the HTML to contain all the GraphQL data from the completed queries, so that the client sees the data immediately. We can do this in six steps:

1. Apollo Client makes all queries in our app and waits for them to complete.
2. Once complete, we render the app to HTML.
3. We get the current state of the Apollo cache.
4. We create an HTML document that contains both #2 and #3.
5. We send it to the client.
6. When the page loads on the client, we create an instance of `ApolloClient` with the #3 cache data.

There are some differences in the API for parts of this process, depending on which view library we’re using. Here are links to the documentation for [React Apollo SSR](https://www.apollographql.com/docs/react/performance/server-side-rendering/), [Vue Apollo SSR](https://v4.apollo.vuejs.org/guide-advanced/ssr.html), and [Apollo Angular SSR](https://apollo-angular.com/docs/performance/server-side-rendering).

In this chapter, we’ll use the React version as the example API. We’ll base our code off the [Chapter 6: React repository](https://github.com/GraphQLGuide/guide/tree/28), but we won’t cover all the steps, like matching what Create React App is doing for us with Babel, asset loading, etc. If you think you might want SSR when starting a project, we recommend using [Next.js or Gatsby](6.md#build-options) instead of CRA (which doesn’t support SSR). Here’s a [starter template](https://github.com/vercel/next.js/tree/canary/examples/with-apollo) for Next.js and a [theme](https://github.com/apollographql/gatsby-theme-apollo/tree/master/packages/gatsby-theme-apollo) for Gatsby.

# Setting up the server

As we discussed in [Chapter 11: Server dev > Deployment](11.md#deployment), we can have a node process running our code on the server, or we can do serverless. The simplest is [serverless with Vercel](https://vercel.com/docs/serverless-functions/introduction). Vercel hosts serverless functions and static sites, and its command-line tool does deployment and is a development server. We install it with:

```sh
npm i -g vercel
```

And we get our starter code with:

```sh
git clone https://github.com/GraphQLGuide/guide.git
cd guide/
git checkout ssr_1.0.0
npm install
```

Let’s create a `server/` directory to run `vercel` in:

```sh
mkdir server
cd server/
mkdir api
```

Within `server/`, Vercel recognizes serverless functions in the `api/` directory:

[`server/api/server.js`](https://github.com/GraphQLGuide/guide/blob/ssr2_1.0.0/server/api/server.js)

```js
export default (req, res) => res.status(200).send(`👋🌎🌍🌏`)
```

`req`, short for *request*, is an instance of Node’s [http.IncomingMessage](https://nodejs.org/api/http.html#http_class_http_incomingmessage), and `res` or *response* is a [http.ServerResponse](https://nodejs.org/api/http.html#http_class_http_serverresponse). In this function, we’re setting the HTTP status code to 200 and sending an emoji response.

We can run our function with `vercel dev` inside `server/`. The first time we run `vercel` in a directory, it will ask us about the project (and save the configuration to `.vercel/`)

```sh
$ cd server/
$ vercel dev
Vercel CLI 21.2.1 dev (beta) — https://vercel.com/feedback
? Set up and develop “~/gh/guide/server”? [Y/n] y
? Which scope should contain your project? GraphQL Guide
? Link to existing project? [y/N] n
? What’s your project’s name? guide-ssr
? In which directory is your code located? ./
No framework detected. Default Project Settings:
- Build Command: `npm run vercel-build` or `npm run build`
- Output Directory: `public` if it exists, or `.`
- Development Command: None
? Want to override the settings? [y/N] n
🔗  Linked to graphql-guide/guide-ssr (created .vercel and added it to .gitignore)
> Ready! Available at http://localhost:3000
```

We run our function by visiting its path within `server/`, in this case [localhost:3000/api/server](http://localhost:3000/api/server):

![White webpage with hello world emoji at the top left](/img/ssr-hello-world.png)

We want to server-render all the URLs our [SPA](bg.md#spa) uses, like `https://graphql.guide`, `https://graphql.guide/me`, and `https://graphql.guide/0-Background/1-JavaScript`. We can change Vercel’s default routing in `vercel.json`:

[`server/vercel.json`](https://github.com/GraphQLGuide/guide/blob/ssr2_1.0.0/server/vercel.json)

```json
{
  "rewrites": [{ "source": "/(.*)?", "destination": "/api/server" }]
}
```

This resolves any path to our single serverless function. (The `source` format uses [`path-to-regexp`](https://github.com/pillarjs/path-to-regexp/#parameters).) Now when we visit [localhost:3000](http://localhost:3000) or [localhost:3000/0-Background/1-JavaScript](http://localhost:3000/0-Background/1-JavaScript), we see the hello world emoji instead of the 404 page.

Let’s update our function to return an HTML document instead of just an emoji string:

[`server/api/server.js`](https://github.com/GraphQLGuide/guide/blob/ssr2_1.0.0/server/api/server.js)

```js
export default (req, res) => {
  res.status(200).send(`
    <!doctype html>
    <html lang="en">
    
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
      <title>The GraphQL Guide</title>
    </head>
    
    <body>
      Server-side rendered: ${req.headers['user-agent']}
    </body>
    
    </html>
  `)
}
```

Browsers send a [`User-Agent`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent) header with each HTTP request that identifies the browser family, name, and version. Here we’re including that header in the body of our HTML page.

![Webpage with the text “Server-side rendered: [user agent]”](/img/ssr-user-agent.png)

# Adding React

> If you’re jumping in here, `git checkout ssr2_1.0.0` (tag [ssr2_1.0.0](https://github.com/GraphQLGuide/guide/tree/ssr2_1.0.0)). Tag [`ssr3_1.0.0`](https://github.com/GraphQLGuide/guide/tree/ssr3_1.0.0) contains all the code written in this section.

We now have a server-rendered web application. But it’s not very dynamic—it’s just using [string interpolation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) at the moment. We want to return the HTML of our React app. If we were doing a full SSR solution, we would import `<App>` from `src/components/App.js`. But that doesn’t work in our current bare-bones SSR setup, since our app does CRA-specific things like import svg files. So let’s create a small example `<App>`:

[`server/api/server.js`](https://github.com/GraphQLGuide/guide/blob/ssr3_1.0.0/server/api/server.js)

```js
import React from 'react'

// import App from '../src/components/App'
// ^ this would result in errors, so we make a small example App:
const App = () => <b>My server-rendered React app</b>
```

We render our `<App>` component to a string with `renderToString`:

```js
import { renderToString } from 'react-dom/server'

const App = () => <b>My server-rendered React app</b>

export default (req, res) => {
  res.status(200).send(`
  <!doctype html>
  <html lang="en">
  
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <title>The GraphQL Guide</title>
  </head>
  
  <body>
    <div id="root">
      ${renderToString(<App />)}
    </div>
  </body>
  
  </html>
`)
}
```

When we refresh, we now see:

![Bold text: My server-rendered React app](/img/ssr-react.png)

`<App>` is currently static (it has no state or event handlers), but if we wanted a dynamic app, we would need to include a `<script>` tag in our HTML pointing to our bundled React JavaScript code. It would need to call [`ReactDom.hydrate()`](https://reactjs.org/docs/react-dom.html#hydrate) to hydrate the HTML:

```js
import { hydrate } from 'react-dom'

hydrate(<App />, document.getElementById('root')) 
```

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

![“An error occurred with this application”](/img/ssr-502-error.png)

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

![The HTML source for localhost:3000](/img/ssr-spinner.png)

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