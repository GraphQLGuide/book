# Chapter 6: React

Chapter contents:

* [Setting up](6.md#setting-up)
  * [Build options](6.md#build-options)
  * [App structure](6.md#app-structure)
  * [Set up Apollo](6.md#set-up-apollo)
* [Querying](6.md#querying)
  * [First query](6.md#first-query)
  * [Loading](6.md#loading)
  * [Polling](6.md#polling)
  * [Subscriptions](6.md#subscriptions)
  * [Lists](6.md#lists)
  * [Query variables](6.md#query-variables)
  * [Skipping queries](6.md#skipping-queries)
* [Authentication](6.md#authentication)
  * [Logging in](6.md#logging-in)
  * [Resetting](6.md#resetting)
* [Mutating](6.md#mutating)
  * [First mutation](6.md#first-mutation)
  * [Listing reviews](6.md#listing-reviews)
  * [Optimistic updates](6.md#optimistic-updates)
  * [Arbitrary updates](6.md#arbitrary-updates)
  * [Creating reviews](6.md#creating-reviews)
  * [Using fragments](6.md#using-fragments)
  * [Deleting](6.md#deleting)
  * [Error handling](6.md#error-handling)
  * [Editing reviews](6.md#editing-reviews)
* [Advanced querying](6.md#advanced-querying)
  * [Paginating](6.md#paginating)
    * [Offset-based](6.md#offset-based)
      * [page](6.md#page)
      * [skip & limit](6.md#skip-&-limit)
    * [Cursors](6.md#cursors)
      * [after](6.md#after)
      * [orderBy](6.md#orderby)
  * [Updating multiple queries](6.md#updating-multiple-queries)
  * [Local state](6.md#local-state)
    * [Direct writes](6.md#direct-writes)
    * [Local mutations](6.md#local-mutations)
  * [REST](6.md#rest)
  * [Review subscriptions](6.md#review-subscriptions)
    * [Subscription component](6.md#subscription-component)
    * [Add new reviews](6.md#add-new-reviews)
    * [Update on edit and delete](6.md#update-on-edit-and-delete)
  * [Prefetching](6.md#prefetching)
    * [On mouseover](6.md#on-mouseover)
    * [Cache redirects](6.md#cache-redirects)
  * [Batching](6.md#batching)
  * [Persisting](6.md#persisting)
  * [Multiple endpoints](6.md#multiple-endpoints)
* [Extended topics](6.md#extended-topics)
  * [Linting](6.md#linting)
    * [Setting up linting](6.md#setting-up-linting)
    * [Fixing linting errors](6.md#fixing-linting-errors)
    * [Using linting](6.md#using-linting)
  * [Uploading files](6.md#uploading-files)
  * [Testing](6.md#testing)

---

Background: [single-page application](bg.md#spa), [HTTP](bg.md#http), [Node](bg.md#node-&-npm-&-nvm), [git](bg.md#git), [JSON](bg.md#json), [JavaScript](bg#javascript), [React](bg.md#react)

In this chapter, we’ll learn to use the [`@apollo/client`](https://www.apollographql.com/docs/react/) library through building the Guide web app—the code behind the [https://graphql.guide](https://graphql.guide/Preface) site, where we can sign in, read the book, and write reviews. *[Beta note: the site isn’t yet complete, so you’ll see lorem ipsum in place of book content 😄.]* We’ll go through setup, simple queries, complex queries, auth, and mutations for creating, updating, and deleting. Then we’ll cover advanced topics like infinite scrolling, local state, SSR, working offline, and performance. Here’s what it will look like:

![Guide app](img/guide-app.png)

# Setting up

Section contents:

* [Build options](6.md#build-options)
* [App structure](6.md#app-structure)
* [Set up Apollo](6.md#set-up-apollo)

## Build options

Background: [server-side rendering](bg.md#ssr)

In the early days, setting up a new React app was plagued by complex Webpack and
Babel configurations. There are now a number of tools for this, four of which
we recommend: Create React App, Gatsby, Next.js, and Meteor.

> [Babel](https://babeljs.io/) converts our modern JavaScript to old JavaScript so it will run in the browser or Node. [Webpack](https://webpack.js.org/) bundles our JavaScript and other files together into a website.

### Create React App

```sh
npm i -g create-react-app
create-react-app guide
cd guide/
npm start
```

[Create React App](https://github.com/facebookincubator/create-react-app) (CRA)
is a tool that configures Webpack and Babel to good, common defaults. For
deployment, running `npm run build` gives us an `index.html`, our JavaScript
bundle (or multiple bundles if we’re code splitting), and imported static assets
like CSS, images, and fonts.

### Gatsby

```sh
npm install -g gatsby-cli
gatsby new guide
cd guide/
gatsby develop
```

[Gatsby](https://www.gatsbyjs.org/) is the best static site generator out there. But by “static site generator,” we don’t mean it generates HTML-only noninteractive sites. It generates pages that render the HTML & CSS UI immediately and run JavaScript to hydrate the page into a React app. It can’t generate logged-in content (like you can with SSR and cookies) because it’s not your production server—deploying is building HTML, JS, and CSS files and serving them as-is (*statically*). However, you can [render logged-in content on the client](https://www.gatsbyjs.org/docs/building-apps-with-gatsby/).

### Next.js

```sh
npm i -g create-next-app
create-next-app guide
cd guide/
npm run dev
```

[Next.js](https://github.com/zeit/next.js) is similar to CRA in that it takes
care of Webpack/Babel for us, but it also does [server-side rendering](bg.md#ssr)
(SSR), routing, automatic page-level code splitting, dynamic importing, and hot
code reloading. CRA and Gatsby are just your dev server and build tool, whereas Next, since it
does SSR, is also your Node production server.

> Next does have an `export` command that outputs HTML and JS that you can
> serve as static files (like Gatsby), but the HTML is rendered once at the time
> that you run the `export` command, instead of in real time whenever a client
> requests the site.

### Meteor
https://github.com/GraphQLGuide/guide.git
```sh
curl https://install.meteor.com/ | sh
git clone https://github.com/jamiter/meteor-starter-kit.git guide
cd guide/
npm install
meteor
```

[Meteor](https://www.meteor.com) is similar to Next in that it is not only the
build tool but also the production server. Unlike the other options, it does not use
Webpack—it has its own advanced build system that is blissfully
configuration-free. It does not have built-in SSR like Next does, but it does
have dynamic imports, and all dynamically imported modules are fetched quickly
over a WebSocket and [cached on the client](https://blog.meteor.com/announcing-meteor-1-5-b82be66571bb) (in
[IndexedDB](https://en.wikipedia.org/wiki/Indexed_Database_API)). It also does [differential bundling](https://blog.meteor.com/meteor-1-7-and-the-evergreen-dream-a8c1270b0901), further reducing bundle size for modern browsers.

## App structure

For our Guide app, we’ll use CRA, because it’s the most widely used and the most
basic, straightforward option. Here’s our starter app:

```sh
git clone https://github.com/GraphQLGuide/guide.git
cd guide/
git checkout 0_0.2.0
npm install
```

Now we should be able to run CRA’s development server:

```sh
npm start
```

And see our app at [localhost:3000](http://localhost:3000/):

![Create React App starting site](/img/cra.png)

Our file structure is very similar to what we get when we run
`create-react-app`:

```
.
├── .eslintrc
├── .gitignore
├── package-lock.json
├── package.json
├── public
│   ├── favicon.ico
│   ├── index.html
│   └── manifest.json
└── src
    ├── App.test.js
    ├── components
    │   └── App.js
    ├── index.css
    ├── index.js
    ├── jsconfig.json
    ├── logo.svg
    └── registerServiceWorker.js
```

`.eslintrc.js` — The CRA dev server (`npm start`) outputs linter warnings ([background on ESLint](https://eslint.org/docs/about/)), but it’s
nice to see the warnings directly in our text editor, so we have an `.eslintrc`
file that uses the same rules as the dev server. Most editors’ eslint plugins
will pick this up, including
[`eslint`](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
for our recommended editor, [VS Code](https://code.visualstudio.com/).

`package.json`

```json
{
  "name": "guide",
  "version": "0.2.0",
  "private": true,
  "dependencies": {
    "react": "^16.0.0",
    "react-dom": "^16.0.0",
    "react-scripts": "1.0.14",
    ...
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test --env=jsdom",
    "eject": "react-scripts eject",
    ...
  }
}
```

We have our normal react dependencies, `react` and `react-dom`, plus
`react-scripts`, which is what CRA lives inside, and which provides the
commands:

* `npm start` starts the dev server
* `npm run build` bundles app for deployment
* `npm test` runs all the tests found in `*.test.js` files
* `npm run eject` takes us out of CRA (replaces `react-scripts` in our `devDependencies` with a long list
  of other packages, adds a `scripts/` directory, and adds an 8-file `config/` directory
  with Webpack, Babel, and testing configuration)

In our `public/` directory, we have a
[favicon](https://en.wikipedia.org/wiki/Favicon), `manifest.json` (which is used
when our app is added to an Android homescreen), and our only HTML page, `public/index.html` — our [SPA](bg.md#spa) shell, basically just:

```html
<!doctype html>
<html lang="en">
  <head>
    <title>The GraphQL Guide</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

We can add HTML, like meta tags to the head or the Google Analytics tracking
script to the bottom of the body. Our React JavaScript code gets added to the
body, and when it runs, it puts the app inside the root tag `<div
id="root"></div>`:

[`src/index.js`](https://github.com/GraphQLGuide/guide/blob/0_0.2.0/src/index.js)

```js
import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'
import registerServiceWorker from './registerServiceWorker'

ReactDOM.render(<App />, document.getElementById('root'))

registerServiceWorker()

module.hot.accept()
```

Let’s look at some of the lines:

`import './index.css'` — CRA supports importing CSS from JavaScript. There are
many ways to do CSS with React, and we’ll be sticking with this single plain
`.css` file so that we can focus on the GraphQL parts of app-building.

`ReactDOM.render(<App />, document.getElementById('root'))` — Our only component,
`<App />`, gets rendered into the `#root` div.

`registerServiceWorker()` — CRA includes a service worker (set up by
`src/registerServiceWorker.js`) that caches our assets in the browser so that
our app loads faster
([more info](https://create-react-app.dev/docs/making-a-progressive-web-app/)).

`module.hot.accept()` — This enables HMR ([Hot Module Replacement](https://webpack.js.org/concepts/hot-module-replacement/)), a Webpack feature that updates JavaScript when code is saved in development without reloading the page.

Here’s our App component:

[`src/components/App.js`](https://github.com/GraphQLGuide/guide/blob/0_0.2.0/src/components/App.js)

```js
import React, { Component } from 'react'
import logo from './logo.svg'

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">The GraphQL Guide</h1>
        </header>
        <p className="App-intro">
          To get started, edit <code>src/App.js</code>, and save to reload.
        </p>
      </div>
    )
  }
}

export default App
```

`import logo from './logo.svg'` — CRA supports importing files, like images and
fonts. When we import a file, it gets included in the app bundle, and we get a
URL that we can use—for example, in a `src` attribute:

```html
<img src={logo} className="App-logo" alt="logo" />
```

We also have a test file:

[`src/App.test.js`](https://github.com/GraphQLGuide/guide/blob/0_0.2.0/src/App.test.js)

```js
import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'

it('renders without crashing', () => {
  const div = document.createElement('div')
  ReactDOM.render(<App />, div)
})
```

This and any other files ending in `.test.js` get run when we do `npm test`.

The last thing in `src/` is our
[jsconfig.json](https://code.visualstudio.com/docs/languages/jsconfig) file,
which tells VS Code what type of JavaScript we’re using (CRA includes, for
example, async/await from ES2017) and where it’s located.

## Set up Apollo

The best GraphQL library for React is
[`@apollo/client`](https://www.apollographql.com/docs/react/). It has all the features we
talked about in the [Client Libraries](#client-libraries) section and more. Our `package.json` already has these packages, but normally we would install `@apollo/client` and its associated packages with:

```sh
npm i -S react-apollo graphql graphql-tag apollo-client apollo-cache-inmemory apollo-link-http
```

Now we need to create an instance of `ApolloClient` and wrap our app JSX in a
component called `<ApolloProvider>`, which provides our client instance to all
descendants. So we go to `src/index.js`, where our `<App />` component is
rendered, and replace the `ReactDOM.render` line:

[`src/index.js`](https://github.com/GraphQLGuide/guide/blob/1_0.2.0/src/index.js)

```js
import { ApolloClient } from 'apollo-client'
import { ApolloProvider } from 'react-apollo'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { createHttpLink } from 'apollo-link-http'

const link = createHttpLink({
  uri: 'https://api.graphql.guide/graphql'
})

const cache = new InMemoryCache()

const client = new ApolloClient({ link, cache })

ReactDOM.render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>,
  document.getElementById('root')
)
```

> We highly recommend typing out the code instead of copy/pasting—you’ll learn
> it better! 🤔😏👊

We tell `ApolloClient` where to send queries by giving it a network link pointed
at our GraphQL server—in this case `https://api.graphql.guide/graphql`.

# Querying

Section contents:

* [First query](6.md#first-query)
* [Loading](6.md#loading)
* [Polling](6.md#polling)
* [Subscriptions](6.md#subscriptions)
* [Lists](6.md#lists)
* [Query variables](6.md#query-variables)
* [Skipping queries](6.md#skipping-queries)

## First query

One of the fields we can query for is `githubStars`, the number of stars the
Guide’s [github repo](https://github.com/GraphQLGuide/guide) has. Let’s look at
how we can make that query and display the results. We’ll start out by adding a
component to display the star count:

[`src/components/StarCount.js`](https://github.com/GraphQLGuide/guide/blob/1_0.2.0/src/components/StarCount.js)

```js
import React from 'react'

const StarCount = ({ githubStars }) => {
  return (
    <a className="StarCount" href="https://github.com/GraphQLGuide/guide">
      {githubStars}
    </a>
  )
}
```

But how do we get `githubStars` as a prop? First we write the query, which is
pretty simple, since it’s a top-level
[scalar](3.md#scalar-types) query field:

```js
import gql from 'graphql-tag'

const STARS_QUERY = gql`
  query StarsQuery {
    githubStars
  }
`
```

We name it `STARS_QUERY` because convention is to use all caps for query
constants. We use an
[operation name](http://graphql.org/learn/queries/#operation-name)
(`StarsQuery`) so that it’s easier to find and debug. `gql` is a
[template literal tag](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_template_literals)
that parses our [query document](2.md#document) string, converting it into a structured object
that we can pass to Apollo—now we can give it to Apollo’s `<Query>` component:

```js
import PropTypes from 'prop-types'
import { Query } from 'react-apollo'

const StarCount = ...

StarCount.propTypes = {
  githubStars: PropTypes.number,
  loading: PropTypes.bool.isRequired
}

export default () => (
  <Query query={STARS_QUERY}>
    {({ data: { githubStars }, loading }) => (
      <StarCount githubStars={githubStars} loading={loading} />
    )}
  </Query>
)
```

It follows the [render prop](https://reactjs.org/docs/render-props.html) pattern, in which `Query` calls `children` as a function, giving the function an object argument with information about the query. There are [many object attributes](https://www.apollographql.com/docs/react/essentials/queries.html#render-prop) we can choose from, but for now, we’ll just use `data` (the `"data"` attribute in the response from the server) and `loading`, a boolean that lets us know when we’re waiting
for the response to arrive from the server. In our `children` function (which is called the render prop), we pass those two arguments as props to `<StarCount>`.

When the page is loaded and the `<Query>` component is created, Apollo will send the query to the server and give the result to our render prop. Now we can add the component to our app:

[`src/components/App.js`](https://github.com/GraphQLGuide/guide/compare/0_0.2.0...1_0.2.0)

```js
import StarCount from './StarCount'
...
<header className="App-header">
  <StarCount />
  <img src={logo} className="App-logo" alt="logo" />
  <h1 className="App-title">The GraphQL Guide</h1>
</header>
```

And we have a working GraphQL-backed app!

![GitHub stars in header](/img/stars.png)

🙌👊

`@apollo/client` provides two APIs for making queries—the `<Query>` render prop API, and the HOC ([higher-order component](https://reactjs.org/docs/higher-order-components.html)) API. Which we use is mostly a matter of preference—the one thing the render prop API can do that the HOC API can’t is use a dynamic query. The aesthetic differences are whether we’re providing querying options and child component props in JSX (render prop) or JS objects (HOC), and whether we combine multiple queries by nesting JSX or composing HOCs. Since we’ll be writing components that use multiple queries and mutations, and we have limited horizontal width in our ebook readers, we’ll avoid highly nested JSX by mostly using HOCs. Note that it’s easy to translate between the two APIs, since they have the same props and provide us with the same information. So when we learn one API, we learn both. 

Here’s the same component using `@apollo/client`’s [`graphql()`](https://www.apollographql.com/docs/react/api/react- apollo.html#graphql) HOC API:

```js
import { graphql } from 'react-apollo'

const StarCount = ...

const withData = graphql(STARS_QUERY, {
  props: ({ data: { githubStars, loading } }) => ({
    githubStars,
    loading
  })
})

export default withData(StarCount)
```

`graphql()` creates an HOC, which we call `withData` and use to wrap `StarCount`. The first parameter to `graphql()` is the query (which is why with the HOC API, we can’t change the query), and the second is an optional config object. Here we’re using the `props` config function, which tells Apollo which props we want our component to be given. The function gets the query response, in the form:

```json
{
  data: {
    githubStars: 1,
    loading: false,
    other things...
  }
}
```

and returns which props we want—in this case `githubStars` and `loading`—instead of the default `data` prop with a [long list of things](https://www.apollographql.com/docs/react/api/react-apollo.html#graphql-query-options).

## Loading

> If you’re jumping in here, `git checkout 1_0.2.0` (tag [1_0.2.0](https://github.com/GraphQLGuide/guide/tree/1_0.2.0), or compare [1...2](https://github.com/GraphQLGuide/guide/compare/1_0.2.0...2_0.2.0))

When we reload the app, we see a flash of “⭐️ stars” before the number appears,
pushing `stars` to the right. When `<StarCount>` is rendered the first time, it
doesn’t have the number of stars yet, but it tells Apollo to send the query.
Once the query response comes back from the server, <StarCount> is re-rendered—
this time, with the number. Let’s log to see it happening:

[`src/components/StarCount.js`](https://github.com/GraphQLGuide/guide/blob/1_0.2.0/src/components/StarCount.js)

```js
const StarCount = ({ githubStars, loading }) => {
  console.log(
    'rendering StarCount',
    `githubStars: ${githubStars}, loading: ${loading}`
  )
```

```
rendering StarCount
githubStars: undefined, loading: true
rendering StarCount
githubStars: 8, loading: false
```

We see that it’s rendered twice—first `loading` is `true` and `githubStars` is
`undefined`, and then later, once the query has finished, `loading` is `false`
and `githubStars` has a value.

`⭐️ stars` without a number doesn’t make sense, and `stars` jumping to the
right when the number appears doesn’t look nice, so let’s hide
everything until the number has arrived by adding the modifier CSS class
`'loading'` when the `loading` prop is `true`:

```js
import classNames from 'classnames'

const StarCount = ({ githubStars, loading }) => {
  return (
    <a className={classNames('StarCount', { loading })}
```

> `classNames` takes strings or objects as arguments and combines them into a
> React `className` string. For objects, it includes the key if the value is
> true. For example, `classNames('a', { b: false, c: true }, 'd')` returns `'a c
> d'`.

When `loading` becomes `false`, the CSS class `'loading'` is removed, and the
component fades in.

## Polling

Right now our star count is static—once it’s fetched, the number remains on the
page until the page is refreshed. If the actual number of stars on the
repository changes, we won’t know until we refresh. If we want to keep the
number (and any other GraphQL data) up to date, we can do so in two different
ways: polling and [subscriptions](2.md#subscriptions). Polling is much easier to
implement, so let’s do that first. We can add a [`pollInterval`](https://www.apollographql.com/docs/react/essentials/queries.html#refetching) prop to our query in `StarCount.js`:

[`src/components/StarCount.js`](https://github.com/GraphQLGuide/guide/compare/1_0.2.0...2_0.2.0)

```js
<Query query={STARS_QUERY} pollInterval={5 * 1000}>
  {({ data: { githubStars }, loading }) => (
    <StarCount githubStars={githubStars} loading={loading} />
  )}
</Query>
```

Now every five seconds, Apollo
will resend our `STARS_QUERY`. If the response has a different value for
`githubStars`, Apollo will pass us the new prop, which will trigger a
component re-render, and the new count will be displayed on the page.

The equivalent [`pollInterval` option](https://www.apollographql.com/docs/react/basics/queries.html#graphql-config-options-pollInterval) with `graphql()` is:

```js
const withData = graphql(STARS_QUERY, {
  options: { pollInterval: 5 * 1000 },
  props: ...
})
```

Depending on what type of data we’re keeping up to date, we may want to use some
kind of visual cue or animation when it changes. There are a few possible
motivations for this:

1. Calling attention to the change to make the user aware that it
   happened—a common example in this category is the brief yellow background glow.
   Another example is in Google Docs—the colored cursor labeled with a name that
   follows someone’s live edits. However, sometimes a user doesn’t need to know
   that a piece of data has changed, and calling attention to it would
   needlessly distract them from what they were paying attention to.
2. Making the change visually smoother. If a change in the data triggers some
   node on the page to change in size, and there are other nodes on the page
   around it, the other nodes might jump to a new location when the browser
   reflows—for example, if the data is a paragraph of text, and the updated
   paragraph is twice as long, everything below that paragraph will be pushed
   down. We can make this change look nicer by animating the data container to
   its new size and animating the displaced components to their new locations.
   This also gives time for the user to notice which part of the page changed,
   which is helpful for situations in which the user doesn’t realize why things on
   the page jumped around.
3. For fun 😄. Animations can be fun, and sometimes we add them just because we like how it feels.

The data change that happens in our app is a number that is usually just going
up by 1. This type of change is well-suited to an odometer animation, where each
digit is on a number wheel that rotates up or down to reveal the next number.
The benefit of this animation is #3, and the downside is #1—the odometer
changing draws more attention to the change than a non-animated change does, but
the user doesn’t need to know when the star count changes (they’re just trying
to read the book!). So we might not add this animation to a serious app, but
let’s add it to our app for fun 😊. It’s easy with the
[`react-odometerjs`](https://www.npmjs.com/package/react-odometerjs) component:

[`src/components/StarCount.js`](https://github.com/GraphQLGuide/guide/compare/1_0.2.0...2_0.2.0)

```js
import Odometer from 'react-odometerjs'

...

    <a
      className={classNames('StarCount', { loading })}
      href="https://github.com/GraphQLGuide/guide"
      target="_blank"
      rel="noopener noreferrer"
    >
      {githubStars && <Odometer value={githubStars} />}
    </a>
```

Now when the polling `STARS_QUERY` results in a new `githubStars` value, we pass
the new number to the `<Odometer>` component, which does the animation.

> We need the truth guard (`githubStars &&`) because `<Odometer>` throws an
> error when it’s given an `undefined` value (and as we found out
> [before](#loading) when logging, `githubStars` starts out `undefined`).

We can test it out by starring and un-starring
the [repository on GitHub](https://github.com/GraphQLGuide/guide) and watching the number
in our app update.

## Subscriptions

Background: [webhooks](bg.md#webhooks)

> If you’re jumping in here, `git checkout 2_0.2.0` (tag [2_0.2.0](https://github.com/GraphQLGuide/guide/tree/2_0.2.0), or compare [2...3](https://github.com/GraphQLGuide/guide/compare/2_0.2.0...3_0.2.0))

When we poll for new data every 5 seconds, it takes 2.5 seconds on average (as
little as 0, and as much as 5) for a change to show up, plus a little time for
the server to talk to GitHub and get the response back to us. For certain types
of apps, like a chat app or multiplayer games, it’s important to receive updates
in less than 2.5 seconds. One thing we can do is reduce the poll interval—for
instance, a 500 ms interval would mean an average update speed of 250 ms (plus
server response time). This would be fast enough for a chat app but not fast
enough for some games. And it comes at a certain cost in server workload (it now
has to respond to 10 times as many requests) and browser workload (sending
requests takes up main-thread JavaScript time, perhaps during one of the
[10ms windows](https://developers.google.com/web/fundamentals/performance/rail)
in which the thread needs to quickly calculate a 60 fps animation). So
while polling is often the best choice given its simplicity to implement (we
just added that single [`pollInterval` option](#polling)), sometimes we want
something more efficient and real-time.

In these cases we can use GraphQL
[subscriptions](https://dev-blog.apollodata.com/graphql-subscriptions-in-apollo-client-9a2457f015fb),
in which our server will send us updates to our data as they occur. The main
drawback to subscriptions is that it takes extra work to implement on the
server. (In the next chapter we’ll learn how to
[add subscription support](#server-subscriptions).) Another possible drawback is
that if the subscription data changes frequently, it can hurt client performance
by taking up time receiving, updating the store, and re-rendering the page.

While GraphQL servers can support different methods of transporting subscription
updates to clients (the GraphQL spec is transport-agnostic), the usual method is
over WebSockets. 

> *WebSocket* is a format for sending messages over the internet (like [HTTP](bg.md#http)). It allows for very fast two-way communication by keeping a connection open and allowing the server to initiate messages to the client.

We could replace our HTTP link with a WebSocket
link in `index.js` using the
[`apollo-link-ws` package](https://www.npmjs.com/package/apollo-link-ws):

```js
import { WebSocketLink } from 'apollo-link-ws'

const link = new WebSocketLink({
  uri: `ws://localhost:5000/`,
  options: {
    reconnect: true
  }
})
```

This would establish a WebSocket connection that remains open for the duration of the client session, and all GraphQL communication
(queries, mutations, and subscriptions) would be sent over the connection. However, authentication over the WebSocket is a little involved, so we’ll go with a hybrid transport solution: we’ll send queries and mutations over an HTTP link (which we’ll add auth to later), and we’ll send subscriptions over the unauthenticated WebSocket link. We can do this because all of the data used in the Guide’s real-time features (for example `StarCount`, and later on, reviews) is public. 

[`src/index.js`](https://github.com/GraphQLGuide/guide/compare/2_0.2.0...3_0.2.0)

```js
import { split } from 'apollo-link'
import { WebSocketLink } from 'apollo-link-ws'
import { getMainDefinition } from 'apollo-utilities'

const httpLink = createHttpLink({
  uri: 'https://api.graphql.guide/graphql'
})

const wsLink = new WebSocketLink({
  uri: `wss://api.graphql.guide/subscriptions`,
  options: {
    reconnect: true
  }
})

const link = split(
  ({ query }) => {
    const { kind, operation } = getMainDefinition(query)
    return kind === 'OperationDefinition' && operation === 'subscription'
  },
  wsLink,
  httpLink
)
```

The `ApolloClient` constructor options object takes a single link, so we need to compose our two links together. We can use the [`split()` function](http://apollo-link-docs.netlify.com/docs/link/composition.html#directional), which takes a function and two links. The function is given the current query, and if it returns true, the first link is used for the query; otherwise, the second is used. In our `split()` function we look up the query operation and return true if it’s a subscription query, which directs the query to the WebSocket link `wsLink`.

Now we can subscribe to updates to the star count with this simple subscription:

[`src/components/StarCounts.js`](https://github.com/GraphQLGuide/guide/compare/2_0.2.0...3_0.2.0)

```js
const STARS_SUBSCRIPTION = gql`
  subscription StarsSubscription {
    githubStars
  }
`
```

To start the subscription, we use a function
[`subscribeToMore`](https://www.apollographql.com/docs/react/features/subscriptions.html#subscribe-to-more)
that `@apollo/client` provides us:

[`src/components/StarCounts.js`](https://github.com/GraphQLGuide/guide/compare/2_0.2.0...3_0.2.0)

```js
StarCount.propTypes = {
  githubStars: PropTypes.number,
  loading: PropTypes.bool.isRequired,
  subscribeToMore: PropTypes.func.isRequired
}

...

<Query query={STARS_QUERY} pollInterval={5 * 1000}>
  {({ data: { githubStars }, loading, subscribeToMore }) => (
    <StarCount
      githubStars={githubStars}
      loading={loading}
      subscribeToMore={subscribeToMore}
    />
  )}
</Query>
```

And then we can use it in our component. We want to start the subscription 
when the component is initialized (in `componentDidMount`), so we need to
convert `StarCounts` from a functional component to a class that can have
[lifecycle methods](https://reactjs.org/docs/react-component.html#the-component-lifecycle):

[`src/components/StarCounts.js`](https://github.com/GraphQLGuide/guide/compare/2_0.2.0...3_0.2.0)

```js
class StarCount extends React.Component {
  componentDidMount() {
    this.props.subscribeToMore({
      document: STARS_SUBSCRIPTION,
      updateQuery: (
        previousResult,
        { subscriptionData: { data: { githubStars } } }
      ) => ({ githubStars })
    })
  }

  render() {
    const { githubStars, loading } = this.props
    ...
  }
}
```

`subscribeToMore` takes the GraphQL document specifying our subscription and an
`updateQuery` function. `updateQuery` is called each time the client receives
new subscription data from the server. It’s given the result of the previous
query (`STARS_QUERY` in our case) and the subscription data, and it returns an
updated query result, which is used to provide new props to the component. In
our case, we’re just replacing the old result with the GitHub star count received
in the `subscriptionData`. But if GitHub never lets us un-star repos, and the
star count only ever increased, then we might use a `justGotStarred`
subscription that published `{ newStar: true }` to the client. Then our
`updateQuery` would look like:

```js
this.props.subscribeToMore({
  document: JUST_GOT_STARRED_SUBSCRIPTION,
  updateQuery: (previousResult, update) {
    return {
      githubStars: previousResult.githubStars + 1
    }
  }
})
```

The last thing we need to do is test whether our `STARS_SUBSCRIPTION` is working:
we stop polling by removing the `pollInterval` prop from our `<Query>` in
`StarCount.js`:

```js
<Query query={STARS_QUERY} pollInterval={5 * 1000}>
```

Now we can star and unstar the
[Guide repo](https://github.com/GraphQLGuide/guide) and see the count quickly
change in our app. We might notice a slight delay sometimes, and that’s because
the server is polling the GitHub API once a second for updates, so the
subscription data reaching the client could be as old as 1 second plus network
time. We could improve this by reducing the polling interval on the server or by
setting up a [webhook](bg.md#webhook)—the most efficient and lowest-latency solution,
in which the only delay would be network time: GitHub would immediately notify
our server of the change, and the server would immediately send the subscription
update over the WebSocket to the client.

The equivalent query using `graphql()` is:

```js
const withData = graphql(STARS_QUERY, {
  props: ({ data: { githubStars, loading, subscribeToMore } }) => ({
    githubStars,
    loading,
    subscribeToMore
  })
})
```

## Lists

> If you’re jumping in here, `git checkout 3_0.2.0` (tag [3_0.2.0](https://github.com/GraphQLGuide/guide/tree/3_0.2.0), or compare [3...4](https://github.com/GraphQLGuide/guide/compare/3_0.2.0...4_0.2.0))

> See the [Listing reviews](#listing-reviews) section for another example of querying a list of data.

Next let’s get to the heart of our app—the stuff below the header! We’ll want to
reserve most of the space for the book content, since there’s a lot of it, and
reading it is the purpose of the app 😜. But let’s put a thin sidebar on the left
for the table of contents so that readers can easily navigate between sections.

To begin, we replace the `<p>` in `<App>` with the two new sections of the page:

[`src/components/App.js`](https://github.com/GraphQLGuide/guide/compare/3_0.2.0...4_0.2.0)

```js
import TableOfContents from './TableOfContents'
import Section from './Section'

...

<div className="App">
  <header className="App-header">
    <StarCount />
    <img src={logo} className="App-logo" alt="logo" />
    <h1 className="App-title">The GraphQL Guide</h1>
  </header>
  <TableOfContents />
  <Section />
</div>
```

We call the second component `Section` because it will display a single section
of a chapter at a time. Let’s think about the loading state first—we’ll be
fetching the table of contents and the section content from the API. We could do
a loading spinner, but a nicer alternative when we’re waiting for text to load
is a loading skeleton—an animated gray bar placed where the text will appear.
Let’s put a few bars in both components:

[`src/components/Section.js`](https://github.com/GraphQLGuide/guide/blob/4_0.2.0/src/components/Section.js)

```js
import React from 'react'
import Skeleton from 'react-loading-skeleton'

const Section = ({ loading = true }) => (
  <section className="Section">
    <div className="Section-header-wrapper">
      <header className="Section-header">
        <h1>Title</h1>
        <h2>Subtitle</h2>
      </header>
    </div>
    <div className="Section-content">
      {loading ? <Skeleton count={7} /> : null}
    </div>
  </section>
)

export default Section
```

`<Section>` isn’t being passed a `loading` prop yet, since we haven’t used the
`graphql()` function to attach a query to the component yet, but we can give
`loading` a default value of `true` for now so that we can work with it.
`count={7}` will give us 7 gray bars, representing 7 lines of text. Now for the
sidebar:

[`src/components/TableOfContents.js`](https://github.com/GraphQLGuide/guide/blob/4_0.2.0/src/components/TableOfContents.js)

```js
import React from 'react'
import Skeleton from 'react-loading-skeleton'

const TableOfContents = ({ loading = true }) => {
  return (
    <nav className="TableOfContents">
      {loading ? (
        <div>
          <h1>
            <Skeleton />
          </h1>
          <Skeleton count={4} />
        </div>
      ) : null}
    </nav>
  )
}

export default TableOfContents
```

`<Skeleton>` picks up the surrounding font size, so we’ll see a larger gray line
(in place of a chapter title) and then 4 smaller lines (in place of section
titles):

![Loading skeleton](/img/loading-skeleton.png)

Now let’s construct the query for the data we need to display in
`TableOfContents`. We can explore the Guide API’s schema in GraphQL Playground, an IDE for writing GraphQL queries. For instance, here we’re querying for `{ githubStars }`:

[Playground: `query { githubStars }`](https://graphqlbin.com/VO1qTg)

On the left side we have the GraphQL document, and when we click the play button (or `command-return`), we see the response on the right:

![Playground with githubStars query](/img/play-githubStars.png)

Now let’s delete `githubStars`, and with our cursor in between the `query` braces, we hit `control-space` to bring up query suggestions:

![Playground with query suggestions](/img/play-suggestions.png)

The one we want is `chapters`. Now we can add an inner set of braces (the
[selection set](https://dev-blog.apollodata.com/the-anatomy-of-a-graphql-query-6dffa9e9e747)
on `chapters`), move our cursor inside, and hit `control-space` again to see the
available fields of a `Chapter` (which is the type that `chapters` returns):

```gql
query {
  chapters {

  }
}
```

We’ll want to display the `title` and the `sections`, and we do the same to see
which fields of a `Section` we want.

```gql
query {
  chapters {
    title
    sections {

    }
  }
}
```

And we see `title`, which we will want for each section. 

![Playground Section field suggestions](/img/play-section-suggestions.png)

We will also want to display the chapter and section numbers, so let’s add those as well. Our whole query is:

```gql
query {
  chapters {
    number
    title
    sections {
      number
      title
    }
  }
}
```

We can see what the data looks like by hitting the play button or
`command-return`. 

![Playground chapters query response](/img/play-chapters.png)

To attach the query to our component, we give it a name,
`ChapterQuery`, put it inside a `gql` template string, and use `graphql()` to
specify what props our HOC will give to `TableOfContents`:

[`src/components/TableOfContents.js`](https://github.com/GraphQLGuide/guide/blob/4_0.2.0/src/components/TableOfContents.js)

```js
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'

const CHAPTER_QUERY = gql`
  query ChapterQuery {
    chapters {
      id
      number
      title
      sections {
        id
        number
        title
      }
    }
  }
`

const withData = graphql(CHAPTER_QUERY, {
  props: ({ data: { chapters, loading } }) => ({
    chapters,
    loading
  })
})

export default withData(TableOfContents)
```

And now that our component will be getting props, we add prop types:

[`src/components/TableOfContents.js`](https://github.com/GraphQLGuide/guide/blob/4_0.2.0/src/components/TableOfContents.js)

```js
import PropTypes from 'prop-types'

TableOfContents.propTypes = {
  chapters: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      number: PropTypes.number,
      title: PropTypes.string.isRequired,
      sections: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.number.isRequired,
          number: PropTypes.number.isRequired,
          title: PropTypes.string
        }).isRequired
      ).isRequired
    }).isRequired
  ),
  loading: PropTypes.bool.isRequired
}
```

We know that we can add `.isRequired` to the fields of `chapters` and `sections`
because we can see in the Guide schema that they’re non-null—in Playground, we
click "SCHEMA" on the right to open up the schema tab, click on `chapters`, and
notice that, for example `title: String!` has an exclamation mark, so it will
always have a value. 

![Schema: chapters](/img/schema-chapters.png)

This means that when our component is provided `chapters`,
the `title` field will always be present.

[Playground: `query { chapters { number title sections { number
title } } }`](https://graphqlbin.com/lOR8i2)

> Note that `chapters: PropTypes.arrayOf(...)` doesn’t have an `.isRequired`,
> because initially, while `loading` is `true`, `chapters` is `undefined`.

Next let’s use the new props our component gets. We can remove the default
`true` value for `loading` and add `chapters`. For each chapter we display a
list of links to each section:

[`src/components/TableOfContents.js`](https://github.com/GraphQLGuide/guide/blob/4_0.2.0/src/components/TableOfContents.js)

```js
import { NavLink } from 'react-router-dom'
import classNames from 'classnames'

import { slugify, withHyphens } from '../lib/helpers'

const LoadingSkeleton = () => (
  <div>
    <h1>
      <Skeleton />
    </h1>
    <Skeleton count={4} />
  </div>
)

const TableOfContents = ({ chapters, loading }) => (
  <nav className="TableOfContents">
    {loading ? (
      <LoadingSkeleton />
    ) : (
      <ul className="TableOfContents-chapters">
        {chapters.map(chapter => {
          const chapterIsNumbered = chapter.number !== null
          return (
            <li
              className={classNames({ numbered: chapterIsNumbered })}
              key={chapter.id}
            >
              <NavLink
                to={{
                  pathname: slugify(chapter),
                  state: { chapter, section: chapter.sections[0] }
                }}
                className="TableOfContents-chapter-link"
                activeClassName="active"
                isActive={(match, location) => {
                  const rootPath = location.pathname.split('/')[1]
                  return rootPath.includes(withHyphens(chapter.title))
                }}
              >
                {chapterIsNumbered && (
                  <span className="TableOfContents-chapter-number">
                    {chapter.number}
                  </span>
                )}
                {chapter.title}
              </NavLink>
              {chapterIsNumbered && (
                <ul className="TableOfContents-sections">
                  {chapter.sections.map(section => (
                    <li key={section.number}>
                      <NavLink
                        to={{
                          pathname: slugify(chapter, section),
                          state: { chapter, section }
                        }}
                        className="TableOfContents-section-link"
                        activeClassName="active"
                      >
                        {section.title}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    )}
  </nav>
)
```

Okay, so that was a lot of code 😁. We’ve got an outer list of chapters, and for each chapter we have an inner list of sections. We’ve got React Router `<NavLink>`s that add an `"active"` class when the URL matches the link path. And we use the `slugify()` helper to generate paths.

[`src/lib/helpers.js`](https://github.com/GraphQLGuide/guide/blob/4_0.2.0/src/lib/helpers.js)

```js
export const withHyphens = string => string.replace(/ /g, '-')

// generate paths of the form:
// `/Forward`
// `/Preface`
// `/1-Understanding-GraphQL-through-REST/1-Introduction`
export const slugify = (chapter, section) => {
  if (!section) {
    if (chapter.sections.length) {
      // default to the first section
      section = chapter.sections[0]
    } else {
      return '/' + withHyphens(chapter.title)
    }
  }

  const chapterSlug = chapter.number + '-' + withHyphens(chapter.title)
  const sectionSlug = section.number + '-' + withHyphens(section.title)
  return `/${chapterSlug}/${sectionSlug}`
}
```

Also, to get React Router working, we need to wrap our app in `<BrowserRouter>`:

[`src/index.js`](https://github.com/GraphQLGuide/guide/compare/3_0.2.0...4_0.2.0)

```js
import { BrowserRouter } from 'react-router-dom'

ReactDOM.render(
  <BrowserRouter>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </BrowserRouter>,
  document.getElementById('root')
)
```

With all this JSX code, we’re starting to feel the best thing about GraphQL on the client side—that most of the coding is in the view instead of in data fetching. We don’t have a bunch of REST endpoint fetching and parsing and caching and passing code; instead, we attach simple query strings to the components that need them, and we get the data in the props.

Now we should see the table of contents on the left side of the page, and we can click between sections and see the active links and path changing:

![Table of contents](/img/table-of-contents.png)

## Query variables

> If you’re jumping in here, `git checkout 4_0.2.0` (tag [4_0.2.0](https://github.com/GraphQLGuide/guide/tree/4_0.2.0), or compare [4...5](https://github.com/GraphQLGuide/guide/compare/4_0.2.0...5_0.2.0))

Let’s fill in the book content next! Say we have a section ID, like `'intro'`—how do we get the content? Let’s look in Playground to find the right query to make:

[Playground: `query { }`](https://www.graphqlbin.com/qj7PuX)

There’s a `section(id: String!)` query that returns a `Section` object, which has a `content` field. So let’s try it out:

[Playground: `query { section(id: "intro") { content }}`](https://graphqlbin.com/pg8rsQ)

Next we add the query to our component:

[`src/components/Section.js`](https://github.com/GraphQLGuide/guide/compare/4_0.2.0...5_0.2.0)

```js
import PropTypes from 'prop-types'
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'

Section.propTypes = {
  section: PropTypes.shape({
    content: PropTypes.string.isRequired
  }),
  loading: PropTypes.bool.isRequired
}

const SECTION_QUERY = gql`
  query SectionContent {
    section(id: "intro") {
      content
    }
  }
`

const withData = graphql(SECTION_QUERY, {
  props: ({ data: { section, loading } }) => ({ section, loading })
})

export default withData(Section)
```

Now our component should get a `section` prop that will have the same `content` string that we saw returned in Playground, and we can use it.

[src/components/Section.js`](https://github.com/GraphQLGuide/guide/compare/4_0.2.0...5_0.2.0)

```js
const Section = ({ loading, section }) => (
  <section className="Section">
    <div className="Section-header-wrapper">
      <header className="Section-header">
        <h1>Title</h1>
        <h2>Subtitle</h2>
      </header>
    </div>
    <div className="Section-content">
      {loading ? <Skeleton count={7} /> : section.content}
    </div>
  </section>
)
```

We can read the book! 📖 But we’ve got a hard-coded section ID—let’s turn our `section(id)` argument into a variable:

[`src/components/Section.js`](https://github.com/GraphQLGuide/guide/compare/4_0.2.0...5_0.2.0)

```js
const SECTION_QUERY = gql`
  query SectionContent($id: String!) {
    section(id: $id) {
      content
    }
  }
`

const withData = graphql(SECTION_QUERY, {
  options: { variables: { id: '1-1' } },
  props: ({ data: { section } }) => ({ section })
})
```

- `query SectionContent($id: String!) {`: We declare at the top that the `SectionContent` query takes a variable `$id`, a required `String`.
- `section(id: $id) {`: We replace our string literal `"1-1"` with the variable `$id`.
- `options: { variables: { id: '1-1' } }`: We tell `graphql()` to pass an `id` variable to the query.

Now passing the variable to the query is working, but we still have `'1-1'` hard-coded. Where do we get the section ID from? Back in `TableOfContents`, we gave a `to` prop to our `NavLinks`:

```js
<NavLink
  to={{
    pathname: slugify(chapter, section),
    state: { chapter, section }
  }}
```

The `pathname` is the equivalent of an anchor tag’s `href` attribute, but `state` is part of the HTML5 [session history management](https://developer.mozilla.org/en-US/docs/Web/API/History_API#The_pushState()_method). We can access it at `window.location.state`, but we also want our components to react to changes, so we want it as a prop. The best way to use browser history state with `react-router` is with the `withRouter` HOC, which provides our component with a `location` prop, which has a `.state` property. `graphql()`’s `options` can have a function value instead of our current `variables` object literal—the function takes the props and returns the variables:

[`src/components/Section.js`](https://github.com/GraphQLGuide/guide/compare/4_0.2.0...5_0.2.0)

```js
import { withRouter } from 'react-router'

const withData = graphql(SECTION_QUERY, {
  options: ({ location: { state: { section: { id } } } }) => ({
    variables: { id }
  }),
  props: ({ data: { section, loading } }) => ({
    sectionContent: section && section.content,
    loading
  })
})

export default withRouter(withData(Section))
```

> If you get `TypeError: Cannot read property 'section' of undefined`, skip ahead to the next section to see the solution.

Our options function gets the section ID from the `location` prop and returns it as the query variable. In our `props` function, we change from passing `section` to just passing a `sectionContent` string (so that the name doesn’t conflict with also getting the `section` from `location.state`). Also, our HOC order matters—we have to put `withRouter()` outside of `withData()` so that `graphql()` gets the `location` prop to give to the options function.  

Let’s fill in our component with our newly available data:

[`src/components/Section.js`](https://github.com/GraphQLGuide/guide/compare/4_0.2.0...5_0.2.0)

```js
const Section = ({
  loading,
  sectionContent,
  location: { state: { chapter, section } }
}) => (
  <section className="Section">
    <div className="Section-header-wrapper">
      <header className="Section-header">
        {chapter.number !== null ? (
          <div>
            <h1>{section.title}</h1>
            <h2>
              {'Chapter ' + chapter.number}
              <span className="Section-number-divider" />
              {'Section ' + section.number}
            </h2>
          </div>
        ) : (
          <h1>{chapter.title}</h1>
        )}
      </header>
    </div>
    <div className="Section-content">
      {loading ? <Skeleton count={7} /> : sectionContent}
    </div>
  </section>
)

Section.PropTypes = {
  sectionContent: PropTypes.string,
  location: PropTypes.object.isRequired,
  loading: PropTypes.bool.isRequired
}
```

We can see this working by clicking a different section in the table of contents. The path will change and a new `state` will be set, which `withRouter` will provide to `Section`, triggering a re-render, and the book content on the right will update. 

![Section content](/img/section-content.png)

## Skipping queries

> If you’re jumping in here, `git checkout 5_0.2.0` (tag [5_0.2.0](https://github.com/GraphQLGuide/guide/tree/5_0.2.0), or compare [5...6](https://github.com/GraphQLGuide/guide/compare/5_0.2.0...6_0.2.0))

If you’ve kept your development browser tab open during this section, then everything has worked smoothly for you. But when we open a [new tab](http://localhost:3000/introduction), we find a bug:

`TypeError: Cannot read property 'section' of undefined`
```js
const withData = graphql(SECTION_QUERY, {
  options: ({ location: { state: { section: { id } } } }) => ({
```

It looks like `location.state` is undefined! 🐞 Which makes sense, because in a new tab, we haven’t yet clicked a `<NavLink>`, so the state hasn’t been set. If we don’t have the state, how do we get the section ID so that we can query for the right content? The only information we have on first page load is the path, so we have to parse it. [`location.pathname`](https://reacttraining.com/react-router/web/api/location) will always be defined, so we can `deslugify()` it:

[`src/lib/helpers.js`](https://github.com/GraphQLGuide/guide/compare/5_0.2.0...6_0.2.0)

```js
// parse a path:
// /Introduction
// -> { chapterTitle: 'Introduction' }
//
// /1-Understanding-GraphQL-through-REST/1-Introduction
// -> { chapterNumber: 1, sectionNumber: 1 }
export const deslugify = path => {
  const [, chapterSlug, sectionSlug] = path.split('/')
  const chapterIsNumbered = !!sectionSlug

  return chapterIsNumbered
    ? {
        chapterNumber: parseInt(chapterSlug.split('-')[0], 10),
        sectionNumber: parseInt(sectionSlug.split('-')[0], 10)
      }
    : { chapterTitle: chapterSlug }
}
```

Now let’s look at Playground to figure out which two queries we can use, given either the chapter title or the chapter and section numbers:

[Playground: `query { }`](https://www.graphqlbin.com/qj7PuX)

We can use the `chapterByTitle` and `chapterByNumber` root query fields along with a `Chapter`’s `section` field with a `number: Int!` argument. (Any field, not just root fields, can have arguments.)

[`src/components/Section.js`](https://github.com/GraphQLGuide/guide/compare/5_0.2.0...6_0.2.0)

```js
const SECTION_BY_ID_QUERY = gql`
  query SectionContent($id: String!) {
    section(id: $id) {
      content
    }
  }
`

const SECTION_BY_CHAPTER_TITLE_QUERY = gql`
  query SectionByChapterTitle($title: String!) {
    chapterByTitle(title: $title) {
      title
      section(number: 1) {
        content
      }
    }
  }
`

const SECTION_BY_NUMBER_QUERY = gql`
  query SectionByChapterTitle($chapterNumber: Int!, $sectionNumber: Int!) {
    chapterByNumber(number: $chapterNumber) {
      number
      section(number: $sectionNumber) {
        number
        title
        content
      }
    }
  }
`
```

For `chapterByTitle`, all the non-numbered chapters only have a single section and are numbered `0` and title-less. For the `chapterByNumber`, we need the section title in addition to the contents, because we display it at the top of the component, and we no longer get it from `location.state`. 

### Section HOCs

Now we need to figure out which query to use! We could make our own HOC that took in `location` from `withRouter` and chose which query to use, like this:

```js
export default withRouter(withCorrectQuery(Section))
```

But let’s instead try out the [`skip`](https://www.apollographql.com/docs/react/basics/queries.html#graphql-skip) feature of `graphql()`. It allows you to provide a function that calculates from the props whether to perform the query. For instance, we don’t want to use the `SECTION_BY_ID_QUERY` when there’s no state:

```js
const withSectionById = graphql(SECTION_BY_ID_QUERY, {
  skip: ({ location }) => !location.state,
```

Let’s also standardize the props so that `Section` always gets a `section` and a `chapter`, with `section.content`:

`src/components/Section.js`

```js
const SECTION_BY_ID_QUERY = gql`
  query SectionContent($id: String!) {
    section(id: $id) {
      content
    }
  }
`

const withSectionById = graphql(SECTION_BY_ID_QUERY, {
  skip: ({ location }) => !location.state,
  options: ({ location: { state } }) => ({
    variables: { id: state && state.section.id }
  }),
  props: ({
    ownProps: { location: { state } },
    data: { section, loading }
  }) => ({
    section: {
      ...state.section,
      content: section && section.content
    },
    chapter: state.chapter,
    loading
  })
})
```

In our `props` function, we have access to `withRouter()`’s props under the `ownProps` argument. We add the section content we get from the query result to `ownProps.locations.state.section`. We need to guard against `data.section` being `undefined` (`section && section.content`) because it will be when `loading` is true.

Let’s make an HOC for the next query:

`src/components/Section.js`

```js
import { deslugify } from '../lib/helpers'

const SECTION_BY_CHAPTER_TITLE_QUERY = gql`
  query SectionByChapterTitle($title: String!) {
    chapterByTitle(title: $title) {
      title
      section(number: 1) {
        content
      }
    }
  }
`

const withSectionByChapterTitle = graphql(SECTION_BY_CHAPTER_TITLE_QUERY, {
  skip: ({ location }) =>
    location.state || !deslugify(location.pathname).chapterTitle,
  options: ({ location: { pathname } }) => ({
    variables: { title: deslugify(pathname).chapterTitle }
  }),
  props: ({ data: { chapterByTitle, loading } }) => ({
    section: chapterByTitle && chapterByTitle.section,
    chapter: {
      ...chapterByTitle,
      number: null
    },
    loading
  })
})
```

We want to skip over this query if we either have state (in which case we used `SECTION_BY_ID_QUERY`) or if the path doesn’t have a `chapterTitle` (in which case we’ll pass on to the next HOC/query). We get the `title` query variable from the path, and for props, `section` comes from the query results. We didn’t need the `number` field in our query because we know that these chapters aren’t numbered.

On to the next query 🏃‍♀️:

`src/components/Section.js`

```js
const SECTION_BY_NUMBER_QUERY = gql`
  query SectionByNumber($chapterNumber: Int!, $sectionNumber: Int!) {
    chapterByNumber(number: $chapterNumber) {
      number
      section(number: $sectionNumber) {
        number
        title
        content
      }
    }
  }
`

const withSectionByNumber = graphql(SECTION_BY_NUMBER_QUERY, {
  skip: ({ location }) =>
    location.state || !deslugify(location.pathname).chapterNumber,
  options: ({ location: { pathname } }) => ({ variables: deslugify(pathname) }),
  props: ({ data: { chapterByNumber, loading } }) => ({
    section: chapterByNumber && chapterByNumber.section,
    chapter: chapterByNumber,
    loading
  })
})
```

- `options`: What we get from deslugify in this case matches our query variable format (`{ chapterNumber: 1, sectionNumber: 1}`).
- `props`: We get all the props we need from the query results.

We can combine all of our HOCs with:

```js
export default withRouter(
  withSectionById(withSectionByChapterTitle(withSectionByNumber(Section)))
)
```

😵 but that’s hard to read! We can do the same with `@apollo/client`’s `compose()` (equivalent to `compose()` from recompose or redux):

```js
import { graphql, compose } from 'react-apollo'

export default compose(
  withRouter,
  withSectionById,
  withSectionByChapterTitle,
  withSectionByNumber
)(Section)
```

All four HOCs get composed together to a single HOC, which is applied to `Section`. Here’s the more verbose version of the same thing:

```js
const withRouterAndData = compose(
  withRouter,
  withSectionById,
  withSectionByChapterTitle,
  withSectionByNumber
)

export default withRouterAndData(Section)
```

And we set our `PropTypes`:

```js
Section.propTypes = {
  section: PropTypes.shape({
    title: PropTypes.string,
    number: PropTypes.number,
    content: PropTypes.string
  }),
  chapter: PropTypes.shape({
    title: PropTypes.string,
    number: PropTypes.number
  }).isRequired,
  loading: PropTypes.bool.isRequired
}
```

Now when we open [/introduction](http://localhost:3000/introduction) or [/1-Understanding-GraphQL-through-REST/1-Introduction](http://localhost:3000/1-Understanding-GraphQL-through-REST/1-Introduction) in new tabs, we get the right section content instead of an error! 🐞👊 

In [Apollo devtools](5.md#devtools), we can look at the active queries on the page, which will let us see which of our three `graphql()` HOCs is being used:

![SectionContent](/img/SectionContent.png)

![SectionByNumber](/img/SectionByNumber.png)

The first image is from a tab in which we’ve been navigating with the table of contents, and it uses the `SectionContent` query. The second image is from a newly opened tab, and it uses `SectionByNumber`.

### Section Query

As we learned in `StarCount.js`, a benefit to the `<Query>` component is being able to dynamically decide on a query to use. That’s a perfect fit for `Section.js`, where we’re deciding on one of three queries to use. Here are our three HOCs replaced with a `<Query>`:

[`src/components/Section.js`](https://github.com/GraphQLGuide/guide/compare/5_0.2.0...6_0.2.0)

```js
import { Query } from 'react-apollo'


const SectionWithData = ({ location: { state, pathname } }) => {
  const page = deslugify(pathname)

  let query, variables

  if (state) {
    query = SECTION_BY_ID_QUERY
    variables = { id: state.section.id }
  } else if (page.chapterTitle) {
    query = SECTION_BY_CHAPTER_TITLE_QUERY
    variables = { title: page.chapterTitle }
  } else if (page.chapterNumber) {
    query = SECTION_BY_NUMBER_QUERY
    variables = page
  }

  return (
    <Query query={query} variables={variables}>
      {({ data, loading }) => {
        let props

        if (data.section) {
          props = {
            section: {
              ...state.section,
              content: data.section.content
            },
            chapter: state.chapter,
            loading
          }
        } else if (data.chapterByTitle) {
          props = {
            section: data.chapterByTitle.section,
            chapter: {
              ...data.chapterByTitle,
              number: null
            },
            loading
          }
        } else if (data.chapterByNumber) {
          props = {
            section: data.chapterByNumber.section,
            chapter: data.chapterByNumber,
            loading
          }
        } else {
          props = { loading }
        }

        return <Section {...props} />
      }}
    </Query>
  )
}

export default withRouter(SectionWithData)
```

First we decide, based on the `location` prop, which `query` and `variables` to use. Then inside the render prop, `data` will have either a `section`, `chapterByTitle`, or `chapterByNumber` attribute, depending on which query was used. Based on which data is returned, we can construct the right props for `<Section>`. Let’s compare to the HOC solution:

```js
const withSectionById = graphql(SECTION_BY_ID_QUERY, {
  skip: ({ location }) => !location.state,
  options: ({ location: { state } }) => ({
    variables: { id: state && state.section.id }
  }),
  props: ({
    ownProps: { location: { state } },
    data: { section, loading }
  }) => ({
    section: {
      ...state.section,
      content: section && section.content
    },
    chapter: state.chapter,
    loading
  })
})

const withSectionByChapterTitle = graphql(SECTION_BY_CHAPTER_TITLE_QUERY, {
  skip: ({ location }) =>
    location.state || !deslugify(location.pathname).chapterTitle,
  options: ({ location: { pathname } }) => ({
    variables: { title: deslugify(pathname).chapterTitle }
  }),
  props: ({ data: { chapterByTitle, loading } }) => ({
    section: chapterByTitle && chapterByTitle.section,
    chapter: {
      ...chapterByTitle,
      number: null
    },
    loading
  })
})

const withSectionByNumber = graphql(SECTION_BY_NUMBER_QUERY, {
  skip: ({ location }) =>
    location.state || !deslugify(location.pathname).chapterNumber,
  options: ({ location: { pathname } }) => ({ variables: deslugify(pathname) }),
  props: ({ data: { chapterByNumber, loading } }) => ({
    section: chapterByNumber && chapterByNumber.section,
    chapter: chapterByNumber,
    loading
  })
})

export default compose(
  withRouter,
  withSectionById,
  withSectionByChapterTitle,
  withSectionByNumber
)(Section)
```

Instead of an if-else statement, the HOC solution uses `skip`. It also has to call `deslugify` and deconstruct arguments more often. A downside of our `<Query>` implementation is that the query and variables are separated from the prop creation, but we can fix that by using a function:

```js
import get from 'lodash/get'

const SectionWithData = ({ location: { state, pathname } }) => {
  const page = deslugify(pathname)

  let query, variables, createProps

  if (state) {
    query = SECTION_BY_ID_QUERY
    variables = { id: state.section.id }
    createProps = ({ data, loading }) => ({
      section: {
        ...state.section,
        content: get(data, 'section.content')
      },
      chapter: state.chapter,
      loading
    })
  } else if (page.chapterTitle) {
    query = SECTION_BY_CHAPTER_TITLE_QUERY
    variables = { title: page.chapterTitle }
    createProps = ({ data, loading }) => ({
      section: get(data, 'chapterByTitle.section'),
      chapter: {
        ...data.chapterByTitle,
        number: null
      },
      loading
    })
  } else if (page.chapterNumber) {
    query = SECTION_BY_NUMBER_QUERY
    variables = page
    createProps = ({ data, loading }) => ({
      section: get(data, 'chapterByNumber.section'),
      chapter: data.chapterByNumber,
      loading
    })
  }

  return (
    <Query query={query} variables={variables}>
      {queryInfo => <Section {...createProps(queryInfo)} />}
    </Query>
  )
}

export default withRouter(SectionWithData)
```

Since, for example, `data.section` might be undefined, we have to either go back to guarding (`data.section && data.section.content`) or use `lodash/get`.

Let’s go with the `<Query>` version, since the logic of which query should be used is more clear, and being able to easily understand what’s happening (from the point of view of a teammate reading for the first time, or—let’s be honest—ourselves looking back at it a month later 😆) is one of the most important factors of code quality.

### More routing

Before we move on to the authentication section, we’ve got another bug! You may very well have already noticed this one—we can’t visit the root URL [localhost:3000/](http://localhost:3000/) 😜. `TypeError: Cannot read property 'number' of undefined` is coming from our `chapter.number !== null` check in `Section`, and `chapter` is undefined because *none* of our HOCs was able to fetch the chapter. That’s because on the root, there’s neither history state nor a path to `deslugify()`. While it would be nice to 
redirect from the root to whichever section the user was last reading, for now let’s just redirect to the first chapter. 

So far, we haven’t defined any routes—`Section` just changes what data it shows based on the path. We can create a root route that redirects to `/Preface`.

[`src/components/App.js`](https://github.com/GraphQLGuide/guide/compare/5_0.2.0...6_0.2.0)

```js
import { Switch, Route, Redirect } from 'react-router'

const Book = () => (
  <div>
    <TableOfContents />
    <Section />
  </div>
)

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <StarCount />
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">The GraphQL Guide</h1>
        </header>
        <Switch>
          <Route exact path="/" render={() => <Redirect to="/Preface" />} />
          <Route component={Book} />
        </Switch>
      </div>
    )
  }
}
```

Assuming we always want to keep our header on the page regardless of which route we’re on, we put the `<Route>`s below the header in lieu of `<TableOfContents />` and `<Section />`, which we move to a new `Book` component. `<Switch>` renders the first `<Route>` that matches. The first route matches only `/` and redirects, and the second route matches everything else and displays `Book`. 

This begs the question, "What happens when the second route matches `/aMistypedChapterTitle`"? We get another error! This time it’s `TypeError: Cannot read property 'content' of null` from `Section` trying to display `section.content`, because we failed at fetching `section`. Let’s have `Section` display a 404 message, and let’s refactor, since the double ternary operator is already hard to read.

[`src/components/Section.js`](https://github.com/GraphQLGuide/guide/compare/5_0.2.0...6_0.2.0)

```js
const Section = ({ loading, section, chapter }) => {
  let headerContent = null,
    sectionContent = null

  if (loading) {
    headerContent = (
      <h1>
        <Skeleton />
      </h1>
    )
    sectionContent = <Skeleton count={7} />
  } else if (!section) {
    headerContent = <h1>🔍 404 page not found</h1>
  } else {
    if (chapter.number !== null) {
      headerContent = (
        <div>
          <h1>{section.title}</h1>
          <h2>
            {'Chapter ' + chapter.number}
            <span className="Section-number-divider" />
            {'Section ' + section.number}
          </h2>
        </div>
      )
    } else {
      headerContent = <h1>{chapter.title}</h1>
    }

    sectionContent = section.content
  }

  return (
    <section className="Section">
      <div className="Section-header-wrapper">
        <header className="Section-header">{headerContent}</header>
      </div>
      <div className="Section-content">{sectionContent}</div>
    </section>
  )
}
```

First we check if we’re loading (in which case we don’t know whether we’ve failed to find `section` yet), then we check if we didn’t find section. If neither of those cases applied, then we would render the title and content.

Now we should be able to both:
- go to the root [localhost:3000/](http://localhost:3000/) and get redirected
- go to [/notachapter](http://localhost:3000/notachapter) and see the 404 message:

![404 page not found](/img/404.png)

# Authentication

Section contents:

* [Logging in](6.md#logging-in)
* [Resetting](6.md#resetting)

## Logging in

Background: [Authentication](bg.md#authentication)

> If you’re jumping in here, `git checkout 6_0.2.0` (tag [6_0.2.0](https://github.com/GraphQLGuide/guide/tree/6_0.2.0), or compare [6...7](https://github.com/GraphQLGuide/guide/compare/6_0.2.0...7_0.2.0))

We’ll have noticed by now that we’re not getting the entire section content from the Guide API, and that’s because we’re not logged in. When we bought the book, we created a user account that was associated with our purchase. In order to see the full content, we need to log in with that account.

Authentication is important and complex enough that we rarely want to code it ourselves—we probably should use a library or service. For node backends, the most common library is [passport](http://www.passportjs.org/). We’ll instead use a service—[Auth0](https://auth0.com/)—for ease of integration. There are pros and cons to [signed tokens vs. sessions](bg.md#tokens-vs-sessions) and [localStorage vs. cookies](bg.md#localstorage-vs-cookies), but we’ll go with the most straightforward option for Auth0 integration: tokens stored in localStorage. They have a number of authentication methods (called "Connections" in Auth0 or "strategies" in Passport), including email/password, [passwordless](https://auth0.com/passwordless) (SMS one-time codes, email magic login links, and/or TouchID), and Social OAuth providers. While Auth0 makes it easy to provide multiple options, for simplicity’s sake, we’ll just provide GitHub OAuth—all of our users are developers, and they’re likely already logged into their GitHub account on most of their browsers, so the login process should be really easy. If we were building for a different market, we might prefer passwordless instead.

A common login sequence is this: the user clicks a login button, which redirects them to the GitHub OAuth page, and after they do GitHub login (if needed), they authorize our app and are redirected back to our site. One UX drawback of this sequence is that at the end, the user has to wait for our site to load, and without some work, they won’t be taken to the exact page and scroll position they were at before. A good alternative is to open a popup (or a new tab on mobile) where the user can do the GitHub steps. When they’re done authorizing, the popup closes and returns the signed token to the app. Then we’ll include that token in our requests to the server so the server will know who the user is.

Let’s think about what UI elements we want related to the login and the user. We can put a login link on the right side of the header, which will open the GitHub popup. Once the user is logged in, we can show their GitHub profile photo and name in place of the login link, and if they click their name, we can take them to a new `/me` route that shows them their profile. For all of this, we’ll need some data and functions—the user data, whether the user data is loading, and login and logout functions. We need it in a couple of different places in the app—in the header and in a route. There are a few different ways to get information to any place in the app—one is to render an `<AppContainer>` instead of `<App>` in `index.js`:

```js
ReactDOM.render(
  <BrowserRouter>
    <ApolloProvider client={client}>
      <AppContainer />
    </ApolloProvider>
  </BrowserRouter>,
  document.getElementById('root')
)
```

And then the `<AppContainer>` fetches the current user object from the server and passes it to `<App>` along with login/logout functions and `loggingIn`—whether the app is in the process of logging the user in:

```js
class AppContainer extends Component {
  render() {
    ...
    return (
      <App
        user={user}
        login={this.login}
        logout={this.logout}
        loggingIn={loading}
      />
    )
  }
}
```

Then `<App>` in turn passes the props down the component tree to children and grandchildren who need them. The main benefit to this method is that it’s easy to test, because it’s simple to mock out props. However, in all but the smallest apps, it results in a lot of *prop drilling* (passing props down to a component’s children’s children’s ... children). That can get tiresome and clutter our JSX and PropTypes. Instead, let’s make `login()` and `logout()` global functions and let’s use `graphql()` to create a `withUser()` HOC that provides `user` and `loggingIn`. Then inside components that deal the with user, we can import and use `login()`, `logout()`, and `withUser()`.

Let’s add the current user’s name and photo to our header, and let’s add a route for a profile page:

[`src/components/App.js`](https://github.com/GraphQLGuide/guide/compare/6_0.2.0...7_0.2.0)

```js
import { Link } from 'react-router-dom'

import CurrentUser from './CurrentUser'
import Profile from './Profile'

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <StarCount />
          <Link className="App-home-link" to="/">
            <img src={logo} className="App-logo" alt="logo" />
            <h1 className="App-title">The GraphQL Guide</h1>
          </Link>
          <CurrentUser />
        </header>
        <Switch>
          <Route exact path="/" render={() => <Redirect to="/Preface" />} />
          <Route exact path="/me" component={Profile} />
          <Route component={Book} />
        </Switch>
      </div>
    )
  }
}
```

We call the header component `<CurrentUser>` because that’s what it will usually be displaying (it will sometimes instead have a "Sign in" button or a spinner). We need a way for the user to navigate from `/me` to the rest of the app, so we wrap the header image and title in a `<Link>` to the root `/`. Later we’ll get to the HOC (`lib/withUser.js`) and the login/logout functions (`lib/auth.js`), but for now let’s assume they work and write `<CurrentUser>`:

[`src/components/CurrentUser.js`](https://github.com/GraphQLGuide/guide/blob/7_0.2.0/src/components/CurrentUser.js)

```js
import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

import { withUser } from '../lib/withUser'
import { login } from '../lib/auth'

const CurrentUser = ({ user, loggingIn }) => {
  let content

  if (user) {
    content = (
      <Link to="/me" className="User">
        <img src={user.photo} alt={user.firstName} />
        {user.firstName}
      </Link>
    )
  } else if (loggingIn) {
    content = <div className="Spinner" />
  } else {
    content = <button onClick={login}>Sign in</button>
  }

  return <div className="CurrentUser">{content}</div>
}

CurrentUser.propTypes = {
  user: PropTypes.shape({
    firstName: PropTypes.string.isRequired,
    photo: PropTypes.string.isRequired
  }),
  loggingIn: PropTypes.bool.isRequired
}

export default withUser(CurrentUser)
```

This one is straightforward to read. If there’s no user and the user isn’t being loaded, then we have a “Sign in” button that calls `login()`.

Similarly, in `<Profile>`, we might show a loading spinner or a login button. Otherwise, we show the user’s details and a “Sign out” button:

[`src/components/Profile.js`](https://github.com/GraphQLGuide/guide/blob/7_0.2.0/src/components/Profile.js)

```js
import React from 'react'
import PropTypes from 'prop-types'

import { withUser } from '../lib/withUser'
import { login, logout } from '../lib/auth'

const Profile = ({ user, loggingIn }) => {
  if (loggingIn) {
    return (
      <main className="Profile">
        <div className="Spinner" />
      </main>
    )
  } else if (!user) {
    return (
      <main className="Profile">
        <button onClick={login} className="Profile-login">
          Sign in
        </button>
      </main>
    )
  } else {
    return (
      <main className="Profile">
        <div className="Profile-header-wrapper">
          <header className="Profile-header">
            <h1>{user.name}</h1>
          </header>
        </div>
        <div className="Profile-content">
          <dl>
            <dt>Email</dt>
            <dd>
              <code>{user.email}</code>
            </dd>

            <dt>Membership level</dt>
            <dd>
              <code>{user.hasPurchased || 'GUEST'}</code>
            </dd>

            <dt>OAuth Github account</dt>
            <dd>
              <a
                href="https://github.com/settings/applications"
                target="_blank"
                rel="noopener noreferrer"
              >
                <code>{user.username}</code>
              </a>
            </dd>
          </dl>

          <button className="Profile-logout" onClick={logout}>
            Sign out
          </button>
        </div>
      </main>
    )
  }
}

Profile.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    hasPurchased: PropTypes.string
  }),
  loggingIn: PropTypes.bool.isRequired
}

export default withUser(Profile)
```

And now to write our authentication logic! First, we need to set up the Auth0 client:

[`src/lib/auth.js`](https://github.com/GraphQLGuide/guide/blob/7_0.2.0/src/lib/auth.js)

```js
import auth0 from 'auth0-js'
import {
  initAuthHelpers,
  login as auth0Login,
  logout as auth0Logout
} from 'auth0-helpers'

const client = new auth0.WebAuth({
  domain: 'graphql.auth0.com',
  clientID: '8fErnZoF3hbzQ2AbMYu5xcS0aVNzQ0PC',
  responseType: 'token',
  audience: 'https://api.graphql.guide',
  scope: 'openid profile guide'
})

initAuthHelpers({
  client,
  usePopup: true,
  authOptions: {
    connection: 'github',
    owp: true,
    popupOptions: { height: 623 } // make tall enough for content
  },
  checkSessionOptions: {
    redirect_uri: window.location.origin
  },
  onError: e => console.error(e)
})
```

Here we’re just following the docs for [`auth0-js`](https://www.npmjs.com/package/auth0-js) and [`auth0-helpers`](https://www.npmjs.com/package/auth0-helpers). Now `auth0Login()` and `auth0Logout()` should be configured to work with the Guide’s Auth0 account system, and we can use them:

[`src/lib/auth.js`](https://github.com/GraphQLGuide/guide/blob/7_0.2.0/src/lib/auth.js)

```js
export const login = () => {
  auth0Login({
    onCompleted: e => {
      if (e) {
        console.error(e)
        return
      }
    }
  })
}

export const logout = () => {
  auth0Logout()
}
```

You might be wondering, "But what do the login and logout functions actually do?" `auth0Login()` opens the GitHub auth popup, and saves the resulting token in localStorage. `auth0Logout()` removes the token from localStorage and ends our session with the Auth0 server. The next step is actually using the token—whenever we communicate with the server, we need to provide it. There’s an Apollo Link called [`setContext`](https://www.npmjs.com/package/apollo-link-context) that lets us set headers on HTTP requests, and we’ll use it to add an `authorization` header with the token. While we're at it, let's move our Apollo client creation out to another file:

[`src/index.js`](https://github.com/GraphQLGuide/guide/compare/6_0.2.0...7_0.2.0)

```js
import { apollo } from './lib/apollo'

ReactDOM.render(
  <BrowserRouter>
    <ApolloProvider client={apollo}>
      <App />
    </ApolloProvider>
  </BrowserRouter>,
  document.getElementById('root')
)
```

[`src/lib/apollo.js`](https://github.com/GraphQLGuide/guide/compare/6_0.2.0...7_0.2.0)

```js
import { ApolloClient } from 'apollo-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { split } from 'apollo-link'
import { WebSocketLink } from 'apollo-link-ws'
import { createHttpLink } from 'apollo-link-http'
import { getMainDefinition } from 'apollo-utilities'
import { setContext } from 'apollo-link-context'
import { getAuthToken } from 'auth0-helpers'

const httpLink = createHttpLink({
  uri: 'https://api.graphql.guide/graphql'
})

const authLink = setContext(async (_, { headers }) => {
  const token = await getAuthToken({
    doLoginIfTokenExpired: true
  })

  if (token) {
    return {
      headers: {
        ...headers,
        authorization: `Bearer ${token}`
      }
    }
  } else {
    return { headers }
  }
})

const authedHttpLink = authLink.concat(httpLink)

const wsLink = new WebSocketLink({
  uri: `wss://api.graphql.guide/subscriptions`,
  options: {
    reconnect: true
  }
})

const link = split(
  ({ query }) => {
    const { kind, operation } = getMainDefinition(query)
    return kind === 'OperationDefinition' && operation === 'subscription'
  },
  wsLink,
  authedHttpLink
)

const cache = new InMemoryCache()

export const apollo = new ApolloClient({ link, cache })
```

We get the token from `auth0-helpers` using `getAuthToken()`, which either looks it up in localStorage, or if it has expired, opens the GitHub auth popup again. We use [`concat()`](https://www.apollographql.com/docs/link/composition.html#additive) to combine our new `authLink` with the `httpLink`—now when our Apollo client sends out a new query or mutation, it will first go through `authLink`, which will set the header, and then through `httpLink`, which will put it in an HTTP request and send it to the server.

The last piece is to make an HOC that provides the current user’s data:

[`src/lib/withUser.js`](https://github.com/GraphQLGuide/guide/blob/7_0.2.0/src/lib/withUser.js)

```js
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'

export const USER_QUERY = gql`
  query UserQuery {
    currentUser {
      id
      firstName
      name
      username
      email
      photo
      hasPurchased
    }
  }
`

export const withUser = graphql(USER_QUERY, {
  props: ({ data: { currentUser, loading } }) => ({
    user: currentUser,
    loggingIn: loading
  })
})
```

We can now try logging in with our Github account. Clicking sign in opens the popup, and after we go through the OAuth dialog, the popup closes. But then nothing else happens. The “Sign in” link is still there, which means `withUser()` is still providing `user: null` to `<CurrentUser>`. If we reload, it’ll show us logged in, but we don’t want to have to reload, of course. This issue will be solved in the next section.

## Resetting

> If you’re jumping in here, `git checkout 7_0.2.0` (tag [7_0.2.0](https://github.com/GraphQLGuide/guide/tree/7_0.2.0), or compare [7...8](https://github.com/GraphQLGuide/guide/compare/7_0.2.0...8_0.2.0))

Because the auth token is included in every request, the server will know who we are for any other queries and mutations we send, like the ones for the section content. So our server should recognize that we have purchased a Guide package and return the full content to the sections that are included in our package. But after we log in, the section content is still cut off like it was before. Why is that? Because the section content queries haven’t been refetched! We’re still showing the old data fetched when we were logged out. Now what do we do?

Apollo does have a [refetch()](https://www.apollographql.com/docs/react/api/react-apollo.html#graphql-query-data-refetch) function that we get along with a query’s results. It would be a pain to use on our section queries because: A) there are 3 of them, and B) we’d have to figure out how to call the `refetch()` functions (which would be inside `Section.js`) from `auth.js`. So let’s take a different path—telling Apollo to refetch all the queries in the app. Apollo has  a `reFetchObservableQueries()` function, which takes all the *observable queries* (queries used in a `<Query>` or `graphql()` to provide data to our components) and re-sends them to the server. Let’s call that:

[`src/lib/auth.js`](https://github.com/GraphQLGuide/guide/compare/7_0.2.0...8_0.2.0)

```js
import { apollo } from './apollo'

export const login = () => {
  auth0Login({
    onCompleted: e => {
      if (e) {
        console.error(e)
        return
      }

      apollo.reFetchObservableQueries()
    }
  })
}
```

Now we’ve got login working. But let’s take a minute to think about query efficiency. We’re using `withUser()` twice right now, and when we load `/me`, it’s used two places on the page. But if we look in our network tab, we only see `UserQuery` sent to the server once! This is an example of Apollo’s automatic [query deduplication](https://www.apollographql.com/docs/react/advanced/network-layer.html#query-deduplication)—when we ask it to make the same query twice, it’s smart enough to only send it once and give the result to both components. However, whenever we render new components that use `withUser()` (for instance, when we navigate from `/Preface` to `/me`), it’s treated as a separate query and not deduplicated. But we don’t need to re-send it to the server—the user’s name, photo, etc. isn’t likely to change. Luckily, it isn’t! The default [fetchPolicy](https://www.apollographql.com/docs/react/api/react-apollo.html#graphql-config-options-fetchPolicy) for queries is `cache-first`, which means if the query result is already in the cache, Apollo loads the data from the cache. If we were dealing with a type of data that was more likely to change, we could set the `fetchPolicy` to `cache-and-network`, which first loads data from the cache, but at the same time sends the query to the server, and will update the component if the server result is different from the cache result. We would set `fetchPolicy` like this:

```js
export const withUser = graphql(USER_QUERY, {
  options: { fetchPolicy: 'cache-and-network' },
```

So our queries update on login, but what about logout? There may be private data in the store, so the method we want is [`resetStore()`](https://www.apollographql.com/docs/react/api/apollo-client.html#ApolloClient.resetStore), which first clears the store and then refetches observable queries:

[`src/lib/auth.js`](https://github.com/GraphQLGuide/guide/compare/7_0.2.0...8_0.2.0)

```js
export const logout = () => {
  auth0Logout()
  apollo.resetStore()
}
```

Now when we log in and out, the full section content should appear and disappear. 

# Mutating

Section contents:

* [First mutation](6.md#first-mutation)
* [Listing reviews](6.md#listing-reviews)
* [Optimistic updates](6.md#optimistic-updates)
* [Arbitrary updates](6.md#arbitrary-updates)
* [Creating reviews](6.md#creating-reviews)
* [Using fragments](6.md#using-fragments)
* [Deleting](6.md#deleting)
* [Error handling](6.md#error-handling)
* [Editing reviews](6.md#editing-reviews)

## First mutation

> If you’re jumping in here, `git checkout 8_0.2.0` (tag [8_0.2.0](https://github.com/GraphQLGuide/guide/tree/8_0.2.0), or compare [8...9](https://github.com/GraphQLGuide/guide/compare/8_0.2.0...9_0.2.0))

We haven’t yet changed any of the data in the Guide’s database (just the star count in GitHub’s database). When we want to change data (or more broadly, trigger side effects), we need to send a mutation to the server. Let’s start with something simple—at the bottom of a `<Section>`, let’s add the count of how many times the current section has been viewed. Then we can increment the count whenever it’s viewed.

First we add the `views` field to each of our three section queries. Here’s the first one:

[`src/components/Section.js`](https://github.com/GraphQLGuide/guide/compare/8_0.2.0...9_0.2.0)

```js
const SECTION_BY_ID_QUERY = gql`
  query SectionContent($id: String!) {
    section(id: $id) {
      id
      content
      views
    }
  }
`

const SectionWithData = ({ location: { state, pathname } }) => {
  const page = deslugify(pathname)

  let query, variables, createProps

  if (state) {
    query = SECTION_BY_ID_QUERY
    variables = { id: state.section.id }
    createProps = ({ data, loading }) => ({
      section: {
        ...state.section,
        content: get(data, 'section.content'),
        views: get(data, 'section.views')
      },
      chapter: state.chapter,
      loading
    })
  } ...
```

In addition to `views`, we have to add `id` to the query’s selection set so that the `Section` gets [normalized](5.md#caching) correctly. Also, for this query, we need to add `get(data, 'section.views')` to `createProps()`. We don’t have to modify the other `createProps()` functions, as they include the whole section instead of putting it together from different places.

Next we display the new data:

[`src/components/Section.js`](https://github.com/GraphQLGuide/guide/compare/8_0.2.0...9_0.2.0)

```js
  let headerContent = null,
    sectionContent = null,
    footerContent = null

  if (loading) {
    ...
  } else if (!section) {
    ...
  } else {
    ...

    sectionContent = section.content
    footerContent = `Viewed ${section.views.toLocaleString()} times`
  }

  return (
    <section className="Section">
      ...
      <footer>{footerContent}</footer>
    </section>
  )
```

![Section views](/img/section-views.png)

Now look for the mutation we need in Playground—we need the name, arguments, and return type.

[Playground: `mutation { }`](https://graphqlbin.com/JZ8QCy)

And we write out the mutation string just like we write queries:

`src/components/Section.js`

```js
const VIEWED_SECTION_MUTATION = gql`
  mutation ViewedSection($id: String!) {
    viewedSection(id: $id) {
      id
      views
    }
  }
`
```

Like in the queries, we need the `id` field so that Apollo knows which `Section` is being returned in the mutation response. Now the response’s `views` field will update the normalized `Section` object in the Apollo store, which will update any component queries that select that field. Those queries will pass the updated info to the render prop—in this case, `withSectionById()` will pass a new `data.section` argument to the render prop. We’ll be able to see this in action in a bit.

The mutation HOC is simpler than our query HOCs, since we don’t have props to pass down:

`src/components/Section.js`

```js
import { graphql } from 'react-apollo'

const SectionWithMutation = graphql(VIEWED_SECTION_MUTATION, {
  name: 'viewedSection'
})(Section)

...

    <Query query={query} variables={variables}>
      {queryInfo => <SectionWithMutation {...createProps(queryInfo)} />}
    </Query>
```

For mutations, `graphql()` creates an HOC that provides a single prop function, which we’re naming `viewedSection`. We want to call it whenever a section is viewed, so inside [`componentDidMount()`](https://reactjs.org/docs/react-component.html#componentdidmount) and [`componentDidUpdate()`](https://reactjs.org/docs/react-component.html#componentdidupdate). In order to get lifecycle methods, we need to convert our functional component into a class:

[`src/components/Section.js`](https://github.com/GraphQLGuide/guide/compare/8_0.2.0...9_0.2.0)

```js
class Section extends Component {
  viewedSection = id => {
    if (!id) {
      return
    }

    this.timeoutID = setTimeout(() => {
      this.props.viewedSection({
        variables: { id }
      })
    }, 2000)
  }

  componentDidMount() {
    this.viewedSection(get(this, 'props.section.id'))
  }

  componentWillUnmount() {
    clearTimeout(this.timeoutID)
  }

  componentDidUpdate(prevProps) {
    const { id } = this.props.section
    const sectionChanged = get(prevProps, 'section.id') !== id

    if (sectionChanged) {
      this.viewedSection(id)
    }
  }

  render() { ... }
}

Section.propTypes = {
  ...
  viewedSection: PropTypes.func.isRequired
}
```

We give `this.props.viewedSection()` the section ID mutation variable. We put it in a timeout so that we have time to scroll down to the bottom of the section to see the count change (End key or Cmd-⬇️ on Mac). And we clear the timeout on unmount (because if we navigate away, for example to our profile, and our timeout still fires, it would call a mutation provided by a `<Mutation>` component that no longer existed, and React would throw an error).

We also need to only trigger the mutation when the section changed. When the mutation result arrives and updates the Apollo store, `<Section>` is going to be given the updated `section` prop, so `componentDidUpdate()` will be called again. And if it always called `viewedSection()`, we’d be in an infinite loop. (Read: author Loren was stuck in an infinite loop 😆.)

![Infinite prop-updating loop](/img/infinite-loop.gif)
[*gif: Infinite prop-updating loop*](http://res.cloudinary.com/graphql/guide/infinite-loop.gif)

We should now be able to see the count change at the bottom of the page when we switch between sections.

There is also a render prop API for mutations. Let’s see what that looks like:

[`src/components/Section.js`](https://github.com/GraphQLGuide/guide/compare/8_0.2.0...9_0.2.0)

```js
import { Mutation } from 'react-apollo'

...

    <Query query={query} variables={variables}>
      {queryInfo => (
        <Mutation mutation={VIEWED_SECTION_MUTATION}>
          {viewedSection => (
            <Section
              {...createProps(queryInfo)}
              viewedSection={viewedSection}
            />
          )}
        </Mutation>
      )}
    </Query>
```

The render prop is given the mutation function, and we pass it to `<Section>`. We begin to see here how the indentation level can balloon when a component needs multiple queries and mutations—we add 2+ levels per operation (only 2 if we use implicit-return arrow functions, 3+ for functions with [blocks](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/block)).

## Listing reviews

> If you’re jumping in here, `git checkout 9_0.2.0` (tag [9_0.2.0](https://github.com/GraphQLGuide/guide/tree/9_0.2.0), or compare [9...10](https://github.com/GraphQLGuide/guide/compare/9_0.2.0...10_0.2.0))

Before we get to more advanced mutations, we need more stuff to work with! Let’s make a new page that lists book reviews, and then in the [next section](#optimistic-updates), we can implement features that require mutations: favoriting reviews, creating new reviews, and editing and deleting our own reviews.

Let’s start out by adding a link to the bottom of the table of contents:

[`src/components/TableOfContents.js`](https://github.com/GraphQLGuide/guide/compare/9_0.2.0...10_0.2.0)

```js
const TableOfContents = ({ chapters, loading }) => (
  <nav className="TableOfContents">         
    ...
        <li>
          <NavLink className="TableOfContents-reviews-link" to="/reviews">
            Reviews
          </NavLink>
        </li>
      </ul>
    )}
  </nav>
)
```

And we can add the new route with another `<Switch>`:

[`src/components/App.js`](https://github.com/GraphQLGuide/guide/compare/9_0.2.0...10_0.2.0)

```js
const Book = () => (
  <div>
    <TableOfContents />
    <Switch>
      <Route exact path="/reviews" component={Reviews} />
      <Route component={Section} />
    </Switch>
  </div>
)
```

Our `<Reviews>` component is going to need some data! We know how to do that now. Let’s search through the schema for the right query:

[Playground: `query { }`](https://www.graphqlbin.com/qj7PuX)

We find the `reviews` root query field, and since fetching them all might be a lot of data, let’s use the `limit` argument. 

![Schema: reviews](/img/schema-reviews.png)

And for each review, we want to display the author’s name, photo, and a link to their GitHub, so we need:

[`src/components/Reviews.js`](https://github.com/GraphQLGuide/guide/blob/10_0.2.0/src/components/Reviews.js)

```js
const REVIEWS_QUERY = gql`
  query ReviewsQuery {
    reviews(limit: 20) {
      id
      text
      stars
      createdAt
      favorited
      author {
        id
        name
        photo
        username
      }
    }
  }
`
```

As before, we will use `graphql()` to get `reviews` and `loading` passed as props, and it should have a similar structure to `<Section>`:

[`src/components/Reviews.js`](https://github.com/GraphQLGuide/guide/blob/10_0.2.0/src/components/Reviews.js)

```js
import React from 'react'
import PropTypes from 'prop-types'
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'

import Review from './Review'

const Reviews = ({ reviews, loading }) => (
  <main className="Reviews mui-fixed">
    <div className="Reviews-header-wrapper">
      <header className="Reviews-header">
        <h1>Reviews</h1>
      </header>
    </div>
    <div className="Reviews-content">
      {loading ? (
        <div className="Spinner" />
      ) : (
        reviews.map(review => <Review key={review.id} review={review} />)
      )}
    </div>
  </main>
)

Reviews.propTypes = {
  reviews: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool.isRequired
}

const withReviews = graphql(REVIEWS_QUERY, {
  props: ({ data: { reviews, loading } }) => ({ reviews, loading })
})

export default withReviews(Reviews)
```

> We can be vague here with `reviews: PropTypes.arrayOf(PropTypes.object)` since we’re not using individual `review` objects in this component. In `<Review>`, we’ll list out the `review` fields used with a `PropTypes.shape`. 

Next up is the `<Review>` component. So far we’ve mostly been using plain HTML tags and CSS classes for styling. For many components of an app, it’s easier to use a library instead of building and styling them ourselves. The most popular React component library right now is [Material-UI](http://www.material-ui.com/), based on Google’s [design system](https://material.io/guidelines/material-design/introduction.html). 

> Here are some of the other [major React component libraries](https://blog.bitsrc.io/11-react-component-libraries-you-should-know-178eb1dd6aa4).

We can explore their component demos to find components we want to use to make up a `<Review>`, and we can browse the [material icons listing](https://material.io/icons/). Let’s put each review on a [Card](https://material-ui.com/demos/cards/), with an [Avatar](https://material-ui.com/demos/avatars/) for the author’s photo, a [MoreVert](https://material.io/tools/icons/?icon=more_vert&style=baseline) and [Menu](https://material-ui.com/demos/menus/) for editing and deleting, and a more prominent [FavoriteBorder](https://material.io/tools/icons/?icon=favorite_border&style=baseline) as a bottom action:

[`src/components/Reviews.js`](https://github.com/GraphQLGuide/guide/blob/10_0.2.0/src/components/Reviews.js)

```js
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  IconButton,
  Typography,
  Avatar,
  Menu,
  MenuItem
} from '@material-ui/core'
import {
  MoreVert,
  Favorite,
  FavoriteBorder,
  Star,
  StarBorder
} from '@material-ui/icons'
import distanceInWordsToNow from 'date-fns/distance_in_words_to_now'
import times from 'lodash/times'

const StarRating = ({ rating }) => (
  <div>
    {times(rating, i => (
      <Star key={i} />
    ))}
    {times(5 - rating, i => (
      <StarBorder key={i} />
    ))}
  </div>
)

class Review extends Component {
  state = {
    anchorEl: null
  }

  openMenu = event => {
    this.setState({ anchorEl: event.currentTarget })
  }

  closeMenu = () => {
    this.setState({ anchorEl: null })
  }

  edit = () => {
    this.closeMenu()
  }

  delete = () => {
    this.closeMenu()
  }

  toggleFavorite = () => {}

  render() {
    const {
      review: { text, stars, createdAt, favorited, author }
    } = this.props

    const linkToProfile = child => (
      <a
        href={`https://github.com/${author.username}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {child}
      </a>
    )

    return (
      <div>
        <Card className="Review">
          <CardHeader
            avatar={linkToProfile(
              <Avatar alt={author.name} src={author.photo} />
            )}
            action={
              <IconButton onClick={this.openMenu}>
                <MoreVert />
              </IconButton>
            }
            title={linkToProfile(author.name)}
            subheader={stars && <StarRating rating={stars} />}
          />
          <CardContent>
            <Typography component="p">{text}</Typography>
          </CardContent>
          <CardActions>
            <Typography className="Review-created">
              {distanceInWordsToNow(createdAt)} ago
            </Typography>
            <div className="Review-spacer" />
            <IconButton onClick={this.toggleFavorite}>
              {favorited ? <Favorite /> : <FavoriteBorder />}
            </IconButton>
          </CardActions>
        </Card>
        <Menu
          anchorEl={this.state.anchorEl}
          open={Boolean(this.state.anchorEl)}
          onClose={this.closeMenu}
        >
          <MenuItem onClick={this.edit}>Edit</MenuItem>
          <MenuItem onClick={this.delete}>Delete</MenuItem>
        </Menu>
      </div>
    )
  }
}

Review.propTypes = {
  review: PropTypes.shape({
    id: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    stars: PropTypes.number,
    createdAt: PropTypes.number.isRequired,
    favorited: PropTypes.bool,
    author: PropTypes.shape({
      name: PropTypes.string.isRequired,
      photo: PropTypes.string.isRequired,
      username: PropTypes.string.isRequired
    })
  }).isRequired
}

export default Review
```

The `MoreVert` button controls whether the `Menu` is open and where it is placed (or "anchored"). Also, in the `propTypes`, we list out all the fields of `review` that we use in `<Review>`.

We should now see a list of the 20 most recent reviews! 💃

## Optimistic updates

> If you’re jumping in here, `git checkout 10_0.2.0` (tag [10_0.2.0](https://github.com/GraphQLGuide/guide/tree/10_0.2.0), or compare [10...11](https://github.com/GraphQLGuide/guide/compare/10_0.2.0...11_0.2.0))

Optimistic UI is when the client acts as if a user action has immediate effect instead of waiting for a response from the server. For example, normally if the user adds a comment to a blog post, the client sends the mutation to the server, and when the server responds with the new comment, the client adds it to the store, which updates the comment query results, which re-renders the page. Optimistic UI is when the client sends the mutation to the server and updates the store at the same time, not waiting for a response—*optimistically* assuming that the comment will be successfully saved to the database.

Let’s write a simple example of an optimistic update for favoriting or unfavoriting a review. We can find in the [Playground](https://api.graphql.guide/play) a mutation called `favoriteReview` which takes the review ID and whether the user is favoriting or unfavoriting. First we write the mutation and wrap `<Review>` with it:

[`src/components/Review.js`](https://github.com/GraphQLGuide/guide/compare/10_0.2.0...11_0.2.0)

```js
import gql from 'graphql-tag'
import { graphql } from 'react-apollo'

Review.propTypes = {
  review: ...
  favorite: PropTypes.func.isRequired
}

const FAVORITE_REVIEW_MUTATION = gql`
  mutation FavoriteReview($id: ObjID!, $favorite: Boolean!) {
    favoriteReview(id: $id, favorite: $favorite) {
      favorited
    }
  }
`

export default graphql(FAVORITE_REVIEW_MUTATION, { name: 'favorite' })(Review)
```

Then we have access to a `favorite` prop, which we use in the button click handler:

```js
  toggleFavorite = () => {
    const { review: { id, favorited } } = this.props
    this.props.favorite({
      variables: {
        id,
        favorite: !favorited
      }
    })
  }
```

Now when we click a review’s heart outline icon, it should change to the filled-in icon... right? 😁 But nothing’s happening. Let’s investigate with [Apollo devtools](5.md#devtools). We can open it on our page to the Mutations section. Then when we click a favorite button, `FavoriteReview` shows up in the Mutation log. So we know the mutation is getting called. And when we click on the log entry, we can see that the argument variables are given correctly:

![Favorite mutation in the log](/img/favorite-mutation.png)

So maybe the issue is with the server’s response? Let’s look at that in the Network tab. In the Name section on the left, scroll down to the bottom, and when we click the favorite button again, a new entry should appear. When we click on that, we should see the Headers tab, which at the top says it was an HTTP POST to `https://api.graphql.guide/graphql` (which is the case for all of our GraphQL queries and mutations). It also says the response status code was "200 OK", so we know the server responded without an error. If we scroll to the bottom, we’ll see the Request Payload, which has `operationName: FavoriteReview` and the correct mutation string and variables. Now if we switch to the Response tab, we see:

`{"data":{"favoriteReview":{"favorited":true,"__typename":"Review"}}}`

The server is giving us the correct response, so it looks like the mutation did succeed. Let’s try reloading the page. Now we see that the review did get favorited. Why was the UI not updating? We forgot to include `id` in the response selection set, so Apollo didn’t know which part of the store to update with `favorited: true`. When we add `id`, it works:

```js
const FAVORITE_REVIEW_MUTATION = gql`
  mutation FavoriteReview($id: ObjID!, $favorite: Boolean!) {
    favoriteReview(id: $id, favorite: $favorite) {
      id
      favorited
    }
  }
`
```

[*gif: Delayed favoriting*](http://res.cloudinary.com/graphql/guide/delayed-favoriting.gif)

While it works now, we can probably notice a delay between when we click the heart and when it changes. If we don’t, we can switch from "Online" to "Fast 3G" in the dropdown on the far right top of the Network tab in Chrome devtools (which simulates the higher latency of mobile networks), and we’ll notice a two-second delay before the icon changes. Users of our app who are on mobile or on computers far away from our servers notice the delay. Let’s improve their experience by updating the icon immediately. (In reality, it will take some milliseconds to run the Apollo and React code and paint a new screen, but the delay should be imperceptible.)

We can provide an [`optimisticResponse`](https://www.apollographql.com/docs/react/basics/mutations.html#graphql-mutation-options-optimisticResponse) to our `favorite()` mutation:

[`src/components/Review.js`](https://github.com/GraphQLGuide/guide/compare/10_0.2.0...11_0.2.0)

```js
  toggleFavorite = () => {
    const { review: { id, favorited } } = this.props
    this.props.favorite({
      variables: {
        id,
        favorite: !favorited
      },
      optimisticResponse: {
        favoriteReview: {
          __typename: 'Review',
          id,
          favorited: !favorited
        }
      }
    })
  }
```

`__typename` is an automatically provided field for the type being returned. We’re mimicking the response from the server, which we saw had `"__typename":"Review"`:

``{"data":{"favoriteReview":{"favorited":true,"__typename":"Review"}}}``

The type name, along with the `id`, will allow Apollo to figure out which review object in the store to update with the new `favorited` value. Now we see that the icon updates right away, even when we set the network speed to fast or slow 3G.

[*gif: Optimistic favoriting*](http://res.cloudinary.com/graphql/guide/optimistic-favoriting.gif)

We may find it helpful to decouple our presentational components from our data-fetching logic. Right now `<Review>` needs to know how to construct an `optimisticResponse` in order to call a mutation. We can make the separation cleaner by taking care of it outside the component:

[`src/components/Review.js`](https://github.com/GraphQLGuide/guide/compare/10_0.2.0...11_0.2.0)

```js
const withFavoriteMutation = graphql(FAVORITE_REVIEW_MUTATION, {
  props: ({ mutate }) => ({
    favorite: (id, favorite) =>
      mutate({
        variables: { id, favorite },
        optimisticResponse: {
          favoriteReview: {
            __typename: 'Review',
            id,
            favorited: favorite
          }
        }
      })
  })
})

export default withFavoriteMutation(Review)
```

As we did with our queries, we can use `props` to control what props are given to `<Review>`. Here we’re giving a `favorite` function that just takes the two pieces of data we need from the component, and then calls the mutation with the `variables` and `optimisticResponse` objects. Now we can simplify `toggleFavorite`:

```js
class Review extends Component {

  toggleFavorite = () => {
    const { review: { id, favorited } } = this.props
    this.props.favorite(id, !favorited)
  }

  ...
}
```

`Review` no longer needs to know a special argument format for a mutation—it just gets a simple `favorite()` function to call.

In the next section, we’ll implement a more flexible and complex form of optimistic updating.

## Arbitrary updates

> If you’re jumping in here, `git checkout 11_0.2.0` (tag [11_0.2.0](https://github.com/GraphQLGuide/guide/tree/11_0.2.0), or compare [11...12](https://github.com/GraphQLGuide/guide/compare/11_0.2.0...12_0.2.0))

In the previous section ([Optimistic updating](#optimistic-updating)), we changed the Apollo data store using `mutate()`’s `optimisticResponse` option. But that method only let us set the mutation response—an object of type `Review`. Sometimes we need to update different parts of the store. For our next piece of UI, we’ll need to update the `User` object, and we’ll do so with some new functions—[store.readQuery()](https://www.apollographql.com/docs/react/basics/caching.html#readquery) and [store.writeQuery()](https://www.apollographql.com/docs/react/basics/caching.html#writequery-and-writefragment).

In the header of the Reviews page, let’s add the total count of favorited reviews:

![Review count](/img/review-count.png)

First we need to think about how to get the count. We can’t just count how many reviews in the store have `favorited: true`, because we only have the most recent 20. And fetching all the reviews from the server would be a lot of data on the wire, a lot of memory taken up on the client, and a long list to count through. Instead let’s fetch the current user’s `favoriteReviews` field. When we want to know more about the current user, we need to go back to our `withUser()` HOC and add the field to our `USER_QUERY`:

[`src/lib/withUser.js`](https://github.com/GraphQLGuide/guide/compare/11_0.2.0...12_0.2.0)

```js
const USER_QUERY = gql`
  query UserQuery {
    currentUser {
      ...
      favoriteReviews {
        id
      }
    }
  }
```

Since we’re just counting the length, we don’t need many `Review` fields—just the `id`. We get the data to `<Reviews`> using `withUser()`, and then we get the length of the `user.favoriteReviews` array to display on the page:

[`src/components/Reviews.js`](https://github.com/GraphQLGuide/guide/compare/11_0.2.0...12_0.2.0)

```js
import { graphql, compose } from 'react-apollo'
import get from 'lodash/get'
import { Favorite } from '@material-ui/icons'

import { withUser } from '../lib/withUser'

const Reviews = ({ reviews, loading, user }) => {
  const favoriteCount = get(user, 'favoriteReviews.length')

  return (
    <main className="Reviews mui-fixed">
      <div className="Reviews-header-wrapper">
        <header className="Reviews-header">
          {favoriteCount ? (
            <div className="Reviews-favorite-count">
              <Favorite />
              {favoriteCount}
            </div>
          ) : null}
          <h1>Reviews</h1>
        </header>
    ...
  )
}

Reviews.propTypes = {
  ...
  user: PropTypes.shape({
    favoriteReviews: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired
      })
    )
  })
}

export default compose(
  withReviews,
  withUser
)(Reviews)
```

Now if we have a non-zero favorite count, we should see it in the Reviews header. When we favorite reviews, the count doesn’t go up as it should. We have to reload the page in order to get the count displayed accurately again—the user’s `favoriteReviews` list is getting updated on the server, but not on the client. In order to update it on the client, we add another option to our mutation: [`update`](https://www.apollographql.com/docs/react/basics/mutations.html#graphql-mutation-options-update).

```js
import remove from 'lodash/remove'

const READ_USER_FAVORITES = gql`
  query ReadUserFavorites {
    currentUser {
      id
      favoriteReviews {
        id
      }
    }
  }
`

const withFavoriteMutation = graphql(FAVORITE_REVIEW_MUTATION, {
  props: ({ mutate }) => ({
    favorite: (id, favorite) =>
      mutate({
        variables: { id, favorite },
        optimisticResponse: {
          favoriteReview: {
            __typename: 'Review',
            id,
            favorited: favorite
          }
        },
        update: store => {
          const data = store.readQuery({ query: READ_USER_FAVORITES })

          if (favorite) {
            data.currentUser.favoriteReviews.push({ id, __typename: 'Review' })
          } else {
            remove(data.currentUser.favoriteReviews, { id })
          }

          store.writeQuery({ query: READ_USER_FAVORITES, data })
        }
      })
  })
})
```

`update` is given a [`DataProxy`](https://www.apollographql.com/docs/react/basics/caching.html#direct) object, which allows us to read and write data from and to the store. To read data, we write a query for the data we want to change (in this case `currentUser.favoriteReviews`). To differentiate between queries we send to the server and queries we write just for reading from the store, we start the name with "Read": `ReadUserFavorites`. We give the query to [`store.readQuery()`](https://www.apollographql.com/docs/react/basics/caching.html#readquery), and we get back the data. Then we modify the data (either adding or removing a bare-bones `Review` object with an `id` and `__typename`). Finally, we write the modified data back to the store with [`store.writeQuery()`](https://www.apollographql.com/docs/react/basics/caching.html#writequery-and-writefragment). 

For example, if we started out with:

```js
data = {
  currentUser: {
    __typename: 'User',
    favoriteReviews: [{
      __typename: 'Review',
      id: 'foo'
    }]
  }
}
```

and we favorited a review with ID `'bar'`, then we would write this data object back to the store:

```js
{
  currentUser: {
    __typename: 'User',
    favoriteReviews: [{
      __typename: 'Review',
      id: 'foo'
    }, {
      __typename: 'Review',
      id: 'bar'
    }]
  }
}
```

Then Apollo would update `USER_QUERY`’s user prop, which would be passed down to `<Reviews>`, which would find a new `user.favoriteReviews.length` value and re-render the component. We can see that this process works in our app:

[*gif: Updating favorite count*](http://res.cloudinary.com/graphql/guide/updating-favorite-count.gif) 

In the [next section](#creating-reviews), we’ll write an `update()` function that adds an item to a list. We can also use `readQuery()` and `writeQuery()` outside of a mutation—we can wrap any component in `withApollo()`, and then inside the component call, for instance: `this.props.client.writeQuery()`.

There are two more functions we can use—[`readFragment()`](https://www.apollographql.com/docs/react/basics/caching.html#readfragment) and [`writeFragment()`](https://www.apollographql.com/docs/react/basics/caching.html#writequery-and-writefragment). `readQuery` can only read data from a root query type like `currentUser{ ... }` or `reviews(limit: 20){ ... }`. `readFragment` can read from any normalized object in our store by its store ID. 

A *store ID* is the identifier Apollo uses to [normalize](5.md#caching) objects. [By default](https://www.apollographql.com/docs/react/basics/caching.html#normalization), it is `[__typename]:[id]`, for instance: `Review:5a6676ec094bf236e215f488`. We can see these IDs on the left of the Store section in Apollo devtools:

![View of the store in devtools](/img/devtools-cache.png)

On the left is the store IDs of all objects in the store. There are reviews with their random IDs, as well as sections with store IDs like `Section:1-1`. We can read a section by its store ID like this:

```js
this.props.client.readFragment({
  id: 'Section:introduction',
  fragment: gql`
    fragment exampleSection on Section {
      id
      views
      content
    }
  `
})
```

The `readFragment()` arguments are the store ID and a [fragment](2.md#fragments). It returns just that section:

```js
{
  content: "..."
  id: "introduction"
  views: 67
  __typename: "Section"
  Symbol(id): "Section:intro"
}
```

Similarly, `writeFragment()` allows us to write to an object with a specific store ID:

```js
this.props.client.writeFragment({
  id: 'Section:intro,
  fragment: gql`
    fragment sectionContent on Section {
      content
      __typename
    }
  `,
  data: {
    content: 'overwritten', 
    __typename: 'Section'
  }
})
```

If we ran this and then navigated to `/Introduction`, the section text would have changed to just the word "overwritten" 😅. Not to worry—it’s just changing the local client-side store; when we reload, the actual Introduction text gets refetched from the server. We can try it out in the console, but first we have to (temporarily) add this line in any of our js files that imports `gql`:

```js
window.gql = gql
```

And then we replace `this.props.client` with `__APOLLO_CLIENT__`, which is a global variable available in development.

[*gif: Writing a fragment to the store*](http://res.cloudinary.com/graphql/guide/write-fragment.gif)

## Creating reviews

> If you’re jumping in here, `git checkout 12_0.2.0` (tag [12_0.2.0](https://github.com/GraphQLGuide/guide/tree/12_0.2.0), or compare [12...13](https://github.com/GraphQLGuide/guide/compare/12_0.2.0...13_0.2.0))

Adding the ability to create reviews will give us the opportunity to look at a more complex mutation and a different kind of `update()` function—we’ll be updating our list of reviews with a new review so that it shows up at the top of the Reviews page.

Let’s start out by adding a FAB ([floating action button](https://material-ui.com/demos/buttons/#floating-action-buttons)) that appears on the Reviews page when the user is logged in. The FAB will open a modal that has the form for a new review. Whether the modal is open is a state variable, so we need to convert `<Reviews>` from a function to to a stateful component:

[`src/components/Reviews.js`](https://github.com/GraphQLGuide/guide/compare/12_0.2.0...13_0.2.0)

```js
import React, { Component } from 'react'
import { Fab, Modal } from '@material-ui/core'
import { Add } from '@material-ui/icons'

import AddReview from './AddReview'

class Reviews extends Component {
  state = {
    addingReview: false
  }

  addReview = () => {
    this.setState({ addingReview: true })
  }

  doneAddingReview = () => {
    this.setState({ addingReview: false })
  }

  render() {
    const { reviews, loading, user } = this.props

    ...

          {user && (
            <div>
              <Fab
                onClick={this.addReview}
                color="primary"
                className="Reviews-add"
              >
                <Add />
              </Fab>
              
              <Modal
                open={this.state.addingReview}
                onClose={this.doneAddingReview}
              >
                <AddReview done={this.doneAddingReview} user={user} />
              </Modal>
            </div>
          )}
        </div>
      </main>
    )
  }
}
```

`<AddReview>` will need a way to let us know it’s done (so we can close the modal) and will need to know who the user is (the creator of the review). To set a primary color for the FAB that matches the rest of the site, we need a Material UI [theme](https://material-ui.com/customization/themes/). We can see from the [default theme](https://material-ui.com/customization/default-theme/) that `palette.primary.main` is the name of the value to change:

[`src/index.js`](https://github.com/GraphQLGuide/guide/compare/12_0.2.0...13_0.2.0)

```js
import { MuiThemeProvider, createMuiTheme } from 'material-ui/styles'

const GRAPHQL_PINK = '#e10098'

const theme = createMuiTheme({
  palette: { primary: { main: GRAPHQL_PINK } }  
})

ReactDOM.render(
  <BrowserRouter>
    <ApolloProvider client={client}>
      <MuiThemeProvider theme={theme}>
        <App />
      </MuiThemeProvider>
    </ApolloProvider>
  </BrowserRouter>,
  document.getElementById('root')
)
```

Next up is the `<AddReview>` form:

[`src/components/AddReview.js`](https://github.com/GraphQLGuide/guide/blob/13_0.2.0/src/components/AddReview.js)

```js
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import StarInput from 'react-star-rating-component'
import { Button, TextField } from '@material-ui/core'
import { Star, StarBorder } from '@material-ui/icons'

import { validateReview } from '../lib/validators'

const GREY = "#0000008a"

class AddReview extends Component {
  state = {
    text: '',
    stars: null,
    errorText: null
  }

  updateText = event => {
    this.setState({ text: event.target.value })
  }

  updateStars = stars => {
    this.setState({ stars })
  }

  handleSubmit = event => {
    event.preventDefault()
    const { text, stars } = this.state

    const errors = validateReview({ text, stars })
    if (errors.text) {
      this.setState({ errorText: errors.text })
      return
    }

    // mutate

    this.props.done()
  }

  render() {
    return (
      <form
        className="AddReview"
        autoComplete="off"
        onSubmit={this.handleSubmit}
      >
        <TextField
          className="AddReview-text"
          label="Review text"
          value={this.state.text}
          onChange={this.updateText}
          helperText={this.state.errorText}
          error={!!this.state.errorText}
          multiline
          rowsMax="10"
          margin="normal"
          autoFocus={true}
        />

        <StarInput
          className="AddReview-stars"
          starCount={5}
          editing={true}
          value={this.state.stars}
          onStarClick={this.updateStars}
          renderStarIcon={(currentStar, rating) =>
            currentStar > rating ? <StarBorder /> : <Star />
          }
          starColor={GREY}
          emptyStarColor={GREY}
          name="stars"
        />

        <div className="AddReview-actions">
          <Button className="AddReview-cancel" onClick={this.props.done}>
            Cancel
          </Button>

          <Button type="submit" color="primary" className="AddReview-submit">
            Add review
          </Button>
        </div>
      </form>
    )
  }
}

AddReview.propTypes = {
  done: PropTypes.func.isRequired,
  user: PropTypes.shape({
    name: PropTypes.string.isRequired,
    photo: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired
  }).isRequired
}

export default AddReview
```

Before we mutate, we need to validate the form input and show the error message, if any. We’ll use the [revalidate](http://revalidate.jeremyfairbank.com/) library:

[`src/lib/validators.js`](https://github.com/GraphQLGuide/guide/blob/13_0.2.0/src/lib/validators.js)

```js
import {
  createValidator,
  composeValidators,
  combineValidators,
  isRequired,
  hasLengthLessThan
} from 'revalidate'

const isString = createValidator(
  message => value => {
    if (!(typeof value === 'string')) {
      return message
    }
  },
  field => `${field} must be a String`
)

export const validateReview = combineValidators({
  text: composeValidators(isRequired, isString, hasLengthLessThan(500))(
    'Review text'
  ),
  stars: createValidator(
    message => value => {
      if (![null, 1, 2, 3, 4, 5].includes(value)) {
        return message
      }
    },
    field => `${field} must be a number 1–5`
  )('Stars')
})
```

We use [`createValidator`](http://revalidate.jeremyfairbank.com/usage/createValidator.html) to create custom validator functions, [`composeValidator`](http://revalidate.jeremyfairbank.com/usage/composeValidators.html) to compose multiple validator functions together, and [`combineValidators`](http://revalidate.jeremyfairbank.com/usage/combineValidators.html) to combine our validators in an object matching our data format, with `text` and `stars` fields. Here are some example outputs:

```js
validateReview({
  text: 1,
  stars: 5
})

// => {text: "Review text must be a String"}

validateReview({
  text: 'my review',
  stars: 'a string'
})

// => {stars: Stars must be a number 1–5`}
```

We don’t need to check for a `stars` error because our `<StarInput>` doesn’t produce an invalid value. But we include it in the validator because we’ll also use it on the server.

Next we add the mutation! In the [Playground](https://api.graphql.guide/play) we find the `createReview` mutation. (The convention is that if the data type is `Foo`, the basic [CUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) mutations are called `createFoo`, `updateFoo`, and `deleteFoo`.) We’re used to `gql` and the `graphql` and `props` functions, but this time we’ll have a larger `optimisticResponse` and a different kind of `update()`:

[`src/components/AddReview.js`](https://github.com/GraphQLGuide/guide/blob/13_0.2.0/src/components/AddReview.js)

```js
import gql from 'graphql-tag'
import { graphql } from 'react-apollo'

class AddReview extends Component {
  ...

  handleSubmit = event => {
    event.preventDefault()
    const { text, stars } = this.state

    const errors = validateReview({ text, stars })
    if (errors.text) {
      this.setState({ errorText: errors.text })
      return
    }

    this.props.addReview(text, stars)

    this.props.done()
  }

  ...
}

AddReview.propTypes = {
  ...
  addReview: PropTypes.func.isRequired
}

const ADD_REVIEW_MUTATION = gql`
  mutation AddReview($input: CreateReviewInput!) {
    createReview(input: $input) {
      id
      text
      stars
      createdAt
      favorited
      author {
        name
        photo
        username
      }
    }
  }
`

const withMutation = graphql(ADD_REVIEW_MUTATION, {
  props: ({ ownProps: { user }, mutate }) => ({
    addReview: (text, stars) => {
      mutate({
        variables: {
          input: { text, stars }
        },
        optimisticResponse: {
          createReview: {
            __typename: 'Review',
            id: null,
            text,
            stars,
            createdAt: new Date(),
            favorited: false,
            author: {
              __typename: 'User',
              id: null,
              name: user.name,
              photo: user.photo,
              username: user.username
            }
          }
        },
        update: (store, { data: { createReview: newReview } }) => {
          const data = store.readQuery({
            query: TODO
          })
          data.reviews.unshift(newReview)
          store.writeQuery({ query: TODO, data })
        }
      })
    }
  })
})

export default withMutation(AddReview)
```

We don’t know what the server-side `id` will be, so we set it to `null`, and it will be updated by Apollo when the server response arrives. Similarly, `createdAt` will be a little different on the server, but not enough to make a difference for optimistic display. We know that `favorited` is `false` because the user hasn’t had a chance to favorite the new review, and the `author` is the current user. 

So far our mutations have updated an existing object in the store (the one with the same `id`), and that object, since it was part of a query result, triggers a component re-render. But this time there is no existing object: we’re adding a new object to the store. And the new object isn’t part of a query result. Apollo will add an object of type `Review` with `id: null` to the store, but it won’t update the `<Reviews>` component’s `reviews` prop because Apollo doesn’t know the new review object should be part of the `REVIEWS_QUERY` results. So we have to change the `REVIEWS_QUERY` results ourselves in the `update` function. 

But first we need access to `REVIEWS_QUERY`, a variable inside `Reviews.js`. We’d run into trouble setting it as a static property on `Reviews` and doing `import Reviews from './Reviews` because we’d have an import cycle—`Reviews.js` imports `AddReview` (`Reviews` would wind up being `null`). So let’s create a new folder for GraphQL documents, `src/graphql/`, and make a new file:

[`src/graphql/Review.js`](https://github.com/GraphQLGuide/guide/blob/13_0.2.0/src/graphql/Review.js)

```js
import gql from 'graphql-tag'

export const REVIEWS_QUERY = gql`
  query ReviewsQuery {
    reviews(limit: 20) {
      id
      text
      stars
      createdAt
      favorited
      author {
        id
        name
        photo
        username
      }
    }
  }
`
```

And in `Reviews.js` and `AddReview.js`, we import it:

[`src/components/AddReview.js`](https://github.com/GraphQLGuide/guide/blob/13_0.2.0/src/components/AddReview.js)

```js
import { REVIEWS_QUERY } from '../graphql/Review'

...

        update: (store, { data: { createReview: newReview } }) => {
          const data = store.readQuery({
            query: REVIEWS_QUERY
          })
          data.reviews.unshift(newReview)
          store.writeQuery({ query: REVIEWS_QUERY, data })
        }
```

The second parameter to [`update`](https://www.apollographql.com/docs/react/basics/mutations.html#graphql-mutation-options-update) has the mutation response—it’s called first with the optimistic response, and then with the server response. So initially, `data.createReview` is the `optimisticResponse.createReview` object we just created. First we call `readQuery`, reading the current results from the store. Then we modify the data, `unshift`ing the `newReview` onto the beginning of the array, so that it shows up first, at the top of the page. 

[*gif: Optimistically adding review*](http://res.cloudinary.com/graphql/guide/adding-review.gif)

## Using fragments

[Fragments](2.md#fragments) are good for more than just [reading from and writing to the store](#arbitrary-updates): they also can [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) up our queries and mutations. The selection set on `reviews` in the query we just relocated was the same as the selection set on `createReview` we used in our mutation. Let’s put that selection set in a fragment:

[`src/graphql/Review.js`](https://github.com/GraphQLGuide/guide/compare/12_0.2.0...13_0.2.0)

```js
import gql from 'graphql-tag'

export const REVIEW_ENTRY = gql`
  fragment ReviewEntry on Review {
    id
    text
    stars
    createdAt
    favorited
    author {
      id
      name
      photo
      username
    }
  }
`

export const REVIEWS_QUERY = gql`
  query ReviewsQuery {
    reviews(limit: 20) {
      ...ReviewEntry
    }
  }
  ${REVIEW_ENTRY}
`
```

We can’t name the fragment `Review` because that’s a type name, so the convention is `ReviewEntry`. We can greatly simplify our `Review.propTypes` with the `propType()` function from [`graphql-anywhere`](https://github.com/apollographql/apollo-client/tree/master/packages/graphql-anywhere):

[`src/components/Review.js`](https://github.com/GraphQLGuide/guide/compare/12_0.2.0...13_0.2.0)

```js
import { propType } from 'graphql-anywhere'
import { REVIEWS_QUERY, REVIEW_ENTRY } from '../graphql/Review'

Review.propTypes = {
  review: propType(REVIEW_ENTRY).isRequired,
  favorite: PropTypes.func.isRequired
}
```

`propType()` generates a React `propTypes`-compatible type-checking function for the `review` object from our `ReviewEntry` fragment. 

Let’s also use the fragment in `<Reviews>` and `<AddReview>`:

[`src/components/Reviews.js`](https://github.com/GraphQLGuide/guide/compare/12_0.2.0...13_0.2.0)

```js
import { propType } from 'graphql-anywhere'
import { REVIEWS_QUERY, REVIEW_ENTRY } from '../graphql/Review'

Reviews.propTypes = {
  reviews: PropTypes.arrayOf(propType(REVIEW_ENTRY)),
```

[`src/components/AddReview.js`](https://github.com/GraphQLGuide/guide/compare/12_0.2.0...13_0.2.0)

```js
import { propType } from 'graphql-anywhere'
import { REVIEWS_QUERY, REVIEW_ENTRY } from '../graphql/Review'

const ADD_REVIEW_MUTATION = gql`
  mutation AddReview($input: CreateReviewInput!) {
    createReview(input: $input) {
      ...ReviewEntry
    }
  }
  ${REVIEW_ENTRY}
`
```

## Deleting

> If you’re jumping in here, `git checkout 13_0.2.0` (tag [13_0.2.0](https://github.com/GraphQLGuide/guide/tree/13_0.2.0), or compare [13...14](https://github.com/GraphQLGuide/guide/compare/13_0.2.0...14_0.2.0))

Next let’s see how deleting an item works. We can add a dialog box confirming deletion, and when it’s confirmed, we’ll send the `removeReview(id)` mutation:

[`src/components/Review.js`](https://github.com/GraphQLGuide/guide/compare/13_0.2.0...14_0.2.0)

```js
import { graphql, compose } from 'react-apollo'
import Dialog, {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from 'material-ui/Dialog'
import Button from 'material-ui/Button'

class Review extends Component {
  state = {
    anchorEl: null,
    deleteConfirmationOpen: false
  }

  openDeleteConfirmation = () => {
    this.closeMenu()
    this.setState({ deleteConfirmationOpen: true })
  }

  closeDeleteConfirmation = () => {
    this.setState({ deleteConfirmationOpen: false })
  }

  delete = () => {
    this.closeDeleteConfirmation()
    this.props.delete(this.props.review.id)
  }

  ...

        <Dialog
          open={this.state.deleteConfirmationOpen}
          onClose={this.closeDeleteConfirmation}
        >
          <DialogTitle>{'Delete review?'}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              A better UX is probably just letting you single-click delete with
              an undo toast, but that’s harder to code right{' '}
              <span role="img" aria-label="grinning face">
                😄
              </span>
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.closeDeleteConfirmation}>Cancel</Button>
            <Button onClick={this.delete} color="primary" autoFocus>
              Sudo delete
            </Button>
          </DialogActions>
        </Dialog>

  ...


const DELETE_REVIEW_MUTATION = gql`
  mutation DeleteReview($id: ObjID!) {
    removeReview(id: $id)
  }
`

const withDeleteMutation = graphql(DELETE_REVIEW_MUTATION, {
  props: ({ mutate }) => ({ delete: id => mutate({ variables: { id } }) })
})

export default compose(withFavoriteMutation, withDeleteMutation)(Review)
```

We see in the [Playground schema](https://api.graphql.guide/play) that `removeReview` resolves to a scalar type (`Boolean`), so unlike our previous mutations, it doesn’t have a selection set:

![Schema: removeReview](/img/schema-removeReview.png)

When we try out the new delete dialog, we notice that the review remains on the page. Did it work? We can check on the devtools Network tab, selecting the last `graphql` request, and switching to the Response tab: 

```json
{"data":{"removeReview":true}}
```

[*gif: Server response to removeReview*](http://res.cloudinary.com/graphql/guide/remove-review-response.gif)

So the deletion was successful (when we refresh the page, the review is gone), but Apollo client didn’t know it should remove the review object from the store. We can tell it to do so with `update()`:

```js
const withDeleteMutation = graphql(DELETE_REVIEW_MUTATION, {
  props: ({ mutate }) => ({
    delete: id =>
      mutate({
        variables: { id },
        update: store => {
          let data = store.readQuery({ query: Review.queries.REVIEWS })
          remove(data.reviews, { id })
          store.writeQuery({ query: Review.queries.REVIEWS, data })

          data = store.readQuery({ query: READ_USER_FAVORITES })
          remove(data.currentUser.favoriteReviews, { id })
          store.writeQuery({ query: READ_USER_FAVORITES, data })
        }
      })
  })
})
```

We need to remove the review not only from the `REVIEWS` query, but also from `currentUser.favoriteReviews`—otherwise, when we delete a favorited review, the count in the header of the reviews page will be inaccurate. 

We’re using `update()` without an `optimisticResponse`, which means it will only be called once, when the server response arrives. We’ll notice a delay between clicking `SUDO DELETE` and the review being removed from the page. If we want it to be removed immediately, we need an `optimisticResponse`, even if we’re not using the optimistic data:

```js
      mutate({
        variables: { id },
        optimisticResponse: {
          removeReview: true
        },
        update: ...
```

[*gif: Removing a review*](http://res.cloudinary.com/graphql/guide/remove-review.gif)

## Error handling

Background: [GraphQL errors](1.md#security-&-error-handling)

> If you’re jumping in here, `git checkout 14_0.2.0` (tag [14_0.2.0](https://github.com/GraphQLGuide/guide/tree/14_0.2.0), or compare [14...15](https://github.com/GraphQLGuide/guide/compare/14_0.2.0...15_0.2.0))

When we try to delete a review that isn’t ours, nothing happens. In the console, we see:

```
ApolloError.js:34 Uncaught (in promise) Error: GraphQL error: unauthorized
    at new ApolloError (ApolloError.js:34)
    at Object.next (QueryManager.js:98)
    at SubscriptionObserver.next (zen-observable.js:154)
    at SubscriptionObserver.next (zen-observable.js:154)
    at httpLink.js:140
    at <anonymous>
```

Let’s break that down:

- `ApolloError.js:34 Uncaught (in promise) Error:`—Apollo is saying that there was a Promise that threw an error, and our code didn’t catch it.
- `GraphQL error:`—It was a GraphQL error: an error returned to us from the GraphQL server, not an error in the Apollo library.
- `unauthorized`—This is the error message from the GraphQL server

So the Guide server is saying that we’re not authorized to execute that `removeReview` mutation. This makes sense, because it’s not our review. We should have the app tell the user that, though. A call to `mutate()`—or, in our case, `this.props.delete`—returns a Promise. This Promise will throw GraphQL errors, which we can catch like this:

```js
this.props
  .delete(this.props.review.id)
  .catch(e => console.log(e.graphQLErrors))
```

`e.graphQLErrors` is an array of all the errors returned from the server. In this case, we just have one:

```js
[
  {
    message: "unauthorized",
    locations: [{"line":2,"column":3}],
    path: ["removeReview"]
  }
]
```

We can now alert the user of the error, depending on whether we find an "unauthorized" message:

[`src/components/Review.js`](https://github.com/GraphQLGuide/guide/compare/14_0.2.0...15_0.2.0)

```js
  delete = () => {
    this.closeDeleteConfirmation()
    this.props.delete(this.props.review.id).catch(e => {
      if (find(e.graphQLErrors, { message: 'unauthorized' })) {
        alert('👮‍♀️✋ You can only delete your own reviews!')
      }
    })
  }
```

But what about other errors? We could get errors about anything bad happening on the server, from dividing by zero to a database query failing. We could add an `else` statement:

```js
} else {
  alert('Unexpected error occurred')
}
```      

But that wouldn’t cover unexpected errors occurring in all of our other queries and mutations. We can avoid peppering these unexpected-error alerts all over our code by checking errors globally as they arrive from the network. Whenever we want to do some logic that all requests or responses go through, we use a link. At the end of the [Logging in](#logging-in) section, we used an `apollo-link-context` to set an authentication header on all outgoing HTTP requests. Here we can use an [`apollo-link-error`](https://github.com/apollographql/apollo-link/tree/master/packages/apollo-link-error). In `index.js`, we rename our `link` to be `networkLink`, then:

[`src/index.js`](https://github.com/GraphQLGuide/guide/compare/14_0.2.0...15_0.2.0)

```js
import { errorLink } from './lib/errorLink'

const link = errorLink.concat(networkLink)
```

In a chain of links from left to right (where `leftLink.concat(rightLink)`), off the left side of the chain is our code, and off the right side is the network. We put `errorLink` to the left of `networkLink` because we need the GraphQL response coming from the network (off right side) to first go through the `networkLink` (the right end), and then to the `errorLink` (left end), before reaching our code (off left side). We create a new file for `errorLink`:

[`src/lib/errorLink.js`](https://github.com/GraphQLGuide/guide/blob/15_0.2.0/src/lib/errorLink.js)

```js
import { onError } from 'apollo-link-error'

const KNOWN_ERRORS = ['unauthorized']

export const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (networkError) {
    console.log(`[Network error]: ${networkError}`)
    return
  }

  if (graphQLErrors) {
    const unknownErrors = graphQLErrors.filter(
      error => !KNOWN_ERRORS.includes(error.message)
    )

    if (unknownErrors.length) {
      alert('😳 An unexpected error occurred on the server')
      unknownErrors.map(({ message, locations, path }) =>
        console.log(`[GraphQL error]: Message: ${message}, Path: ${path}`)
      )
    }
  }
})
```

If there’s a known error, like `'unauthorized'`, let’s leave it to the originating component to alert the user, since that component knows the context of the error. For example, in `<Review>`, we can be specific, saying “You can only delete your own reviews!” Whereas if we made the alert in `errorLink`, it would be less helpful: “You are not authorized to view this data or perform this action.”

By default, when a GraphQL error is returned from the server, Apollo treats it as a fatal error in the query or mutation. In the case of an unauthorized deletion, the error is thrown from the mutation function, and `update()` isn’t called. This is why the review remains on the page. If we were sending a mutation for which we didn’t care about server errors, and we wanted the `update()` function to always run regardless, we could change the mutation’s default [error policy](https://www.apollographql.com/docs/react/features/error-handling.html#policies):

[`src/components/Review.js`](https://github.com/GraphQLGuide/guide/compare/14_0.2.0...15_0.2.0)

```js
const withDeleteMutation = graphql(DELETE_REVIEW_MUTATION, {
  options: { errorPolicy: 'ignore' },
  props: ({ mutate }) => ...
})
```

Then the call to `this.props.delete()` would resolve without error, and the review would be removed from the store and page.

Changing the error policy is more often useful when querying. Let’s see how the default error policy works when querying. We can change the `limit` argument on our `reviews` query to a special value of `-1` that will return demo reviews, some of which have a private `text` field.

[`src/graphql/Review.js`](https://github.com/GraphQLGuide/guide/compare/14_0.2.0...15_0.2.0)

```js
export const REVIEWS_QUERY = gql`
  query ReviewsQuery {
    reviews(limit: -1) {
```

When we do this query in [Playground](https://api.graphql.guide/play):

```js
{
  reviews(limit: -1) {
    stars
    text
  }
}
```

here’s the response we get back:

```
{
  "data": {
    "reviews": [
      {
        "stars": 5,
        "text": null
      },
      {
        "stars": 4,
        "text": "GraphQL is awesome, but React is soooo 2016. Write me a Vue chapter!"
      },
      {
        "stars": 3,
        "text": null
      }
    ]
  },
  "errors": [
    {
      "message": "unauthorized",
      "locations": [
        {
          "line": 4,
          "column": 5
        }
      ],
      "path": [
        "reviews",
        0,
        "text"
      ]
    },
    {
      "message": "unauthorized",
      "locations": [
        {
          "line": 4,
          "column": 5
        }
      ],
      "path": [
        "reviews",
        2,
        "text"
      ]
    }
  ]
}
```

[Playground: `query { reviews(limit: -1) { stars text } }`](https://graphqlbin.com/r02EC1)

The first and third reviews have private `text` fields, so we see `text: null` in `data.reviews` and the `errors` array has entries for each one with `"unauthorized"` messages. The first error `path` is `reviews.0.text`, corresponding to the 0th review in the `data.reviews` array, and the second error is at `review.2.text`. So the errors match up with the reviews that have `text: null`.

> The Review schema says that `text` is nullable. If `text` had been non-nullable (`text: String!`), then an error in the `text` resolver would have made the entire object `null`—`data` would have been `{ "reviews": null }`.

Let’s see how our app is handling this partially-null data response with an `errors` attribute. We’re getting an error:

```
Uncaught TypeError: Cannot read property 'map' of undefined
    at Reviews.render (Reviews.js:46)
    ...
```

Which corresponds to this line:

```js
reviews.map(review => <Review key={review.id} review={review} />)
```

So it looks like `reviews` is undefined. Let’s also look at `data.error`:

[`src/components/Reviews.js`](https://github.com/GraphQLGuide/guide/compare/14_0.2.0...15_0.2.0)

```js
class Reviews extends Component
  render() {
    console.log(this.props.error)
    ...
  }
}

const withReviews = graphql(Review.queries.REVIEWS, {
  props: ({ data: { reviews, loading, error } }) => ({
    reviews,
    loading,
    error
  })
})
```

It has these fields:

```json
["stack", "graphQLErrors", "networkError", "message", "extraInfo"]
```

and `this.props.error.graphQLErrors` looks like this:

```js
[
  {
    message: "unauthorized",
    locations: [{ line: 10, column: 3 }],
    path: [ "reviews", 0, "text" ]
  },
  {
    message: "unauthorized",
    locations: [{ line: 10, column: 3 }],
    path: [ "reviews", 2, "text" ]
  }
]
```

If we want `reviews` to be defined, we can set `errorPolicy` to [`'all'`](https://www.apollographql.com/docs/react/features/error-handling.html#policies):

[`src/components/Review.js`](https://github.com/GraphQLGuide/guide/compare/14_0.2.0...15_0.2.0)

```js
const withReviews = graphql(Review.queries.REVIEWS, {
  options: { errorPolicy: 'all' },
```

We can handle `text` sometimes being `null` in `<Review>`:

[`src/components/Review.js`](https://github.com/GraphQLGuide/guide/compare/14_0.2.0...15_0.2.0)

```js
<CardContent>
  {text ? (
    <Typography component="p">{text}</Typography>
  ) : (
    <Typography component="i">Text private</Typography>
  )}
</CardContent>
```

If there were other errors that we thought might result in a null `text` field, we could take different actions based on `this.props.error` in `<Reviews>`. If we wanted to ignore all errors (reviews would be defined, and `this.props.error` would be undefined), we could set `errorPolicy: 'ignore'`.

![Private reviews](/img/private-reviews.png)

Let’s see what happens when we trigger a different error: first let’s sign out, and then let’s interact with a review. We notice that when we favorite, edit, or delete, the "unexpected error" alert appears:

![Unexpected error alert](/img/unexpected-error.png)

To figure out what it is, we could look at the GraphQL response in the Network panel, or we can just look in the console, since the `errorLink` we made logs unknown errors. There, we find that the error message is `must sign in`, for instance:

```
[GraphQL error]: Message: must sign in, Path: favoriteReview
```

Having a user see this alert isn’t good UX. One way to avoid it is by adding `must sign in` to `KNOWN_ERRORS` in `src/lib/errorLink.js`, and then handling the error in `<Review>` with a message like, “Sign in to favorite a review.” Another way to avoid the error is to just remove the UI controls when the user isn’t signed in 😄. Let’s go with the latter solution, but before we do, note what happens to the review on the page right after we take the action, before we dismiss the alert: when we favorite, the heart stays filled in; when we delete, the review disappears, and when we edit, the review changes. In each case, when we dismiss the alert, the review changes back to its previous state. This is a great demonstration of optimistic updates—Apollo applies the optimistic change, then it receives an error back from the server, which goes through our `errorLink`, which puts up an alert, which halts JS execution until it is dismissed. Once it’s dismissed, Apollo is able to finish handling the response—it realizes that the mutation was unsuccessful, so it rolls back the optimistic update, restoring our store to its previous state, which triggers new props being provided to our components, which triggers React to re-render them. 

To remove the UI elements, we need to first get the user info down to `<Review>`:

[`src/components/Reviews.js`](https://github.com/GraphQLGuide/guide/compare/14_0.2.0...15_0.2.0)

```js
reviews.map(review => (
  <Review key={review.id} review={review} user={user} />
))
```

And then check if `user` is defined:

[`src/components/Review.js`](https://github.com/GraphQLGuide/guide/compare/14_0.2.0...15_0.2.0)

```js
  render() {
    const {
      review: { text, stars, createdAt, favorited, author },
      user
    } = this.props
    
    ...

          <CardHeader
            action={
              user && (
                <IconButton onClick={this.openMenu}>
                  <MoreVert />
                </IconButton>
              )
            }

            ...

            {user && (
              <IconButton onClick={this.toggleFavorite}>
                {favorited ? <Favorite /> : <FavoriteBorder />}
              </IconButton>
            )}
            
            ...

Review.propTypes = {
  ...
  user: PropTypes.object
}
```

![Hidden review icons](/img/hidden-review-icons.png)

## Editing reviews

> If you’re jumping in here, `git checkout 15_0.2.0` (tag [15_0.2.0](https://github.com/GraphQLGuide/guide/tree/15_0.2.0), or compare [15...16](https://github.com/GraphQLGuide/guide/compare/15_0.2.0...16_0.2.0))

The last piece of reviews we haven’t implemented yet is editing! Let’s see how much of our `<AddReview>` component we can reuse by renaming it to `<ReviewForm>` and deciding which mutation to call based on the props. We’ll need to add a `<Modal>` with the form to `<Review>` and pass in the review object as a prop:

[`src/components/Review.js`](https://github.com/GraphQLGuide/guide/compare/15_0.2.0...16_0.2.0)

```js
import Modal from 'material-ui/Modal'

import ReviewForm from './ReviewForm'

class Review extends Component {
  state = {
    anchorEl: null,
    deleteConfirmationOpen: false,
    editing: false
  }

  edit = () => {
    this.closeMenu()
    this.setState({ editing: true })
  }

  doneEditing = () => {
    this.setState({ editing: false })
  }

  render() {
    ...
        <Modal open={this.state.editing} onClose={this.doneEditing}>
          <ReviewForm done={this.doneEditing} review={this.props.review} />
        </Modal>
      </div>
    )
  }
}
```

The mutation takes the review’s `id` and the new `text` and `stars` fields:

```gql
input UpdateReviewInput {
  text: String!
  stars: Int
}

type Mutation {
  updateReview(id: ObjID!, input: UpdateReviewInput!): Review
}
```

We know whether we’re editing based on the presence of the `review` prop, and we also use it to set initial values for the `text` and `stars` inputs:

[`src/components/ReviewForm.js`](https://github.com/GraphQLGuide/guide/compare/15_0.2.0...16_0.2.0)

```js
import { graphql, compose } from 'react-apollo'
import classNames from 'classnames'

class ReviewForm extends Component {
  constructor(props) {
    super(props)

    const { review } = props

    this.isEditing = !!review

    this.state = {
      text: review ? review.text : '',
      stars: review ? review.stars : null,
      errorText: null
    }
  }

  ...

  handleSubmit = event => {
    event.preventDefault()
    const { text, stars } = this.state

    const errors = validateReview({ text, stars })
    if (errors.text) {
      this.setState({ errorText: errors.text })
      return
    }

    const { review } = this.props

    if (this.isEditing) {
      this.props.editReview(review.id, text, stars)
    } else {
      this.props.addReview(text, stars)
    }

    this.props.done()
  }

  render() {
    return (
      <form
        className={classNames('ReviewForm', { editing: this.isEditing })}

        ...

          <Button type="submit" color="primary" className="AddReview-submit">
            {this.isEditing ? 'Save' : 'Add review'}
          </Button>
        </div>
      </form>
    )
  }
}

ReviewForm.propTypes = {
  ...
  editReview: PropTypes.func.isRequired,
  review: PropTypes.shape({
    id: PropTypes.string.isRequired,
    text: PropTypes.string,
    stars: PropTypes.number
  })
}

...

const EDIT_REVIEW_MUTATION = gql`
  mutation EditReview($id: ObjID!, $input: UpdateReviewInput!) {
    updateReview(id: $id, input: $input) {
      id
      text
      stars
    }
  }
`

const withEditReview = graphql(EDIT_REVIEW_MUTATION, {
  props: ({ mutate }) => ({
    editReview: (id, text, stars) => {
      mutate({
        variables: {
          id,
          input: { text, stars }
        },
        optimisticResponse: {
          updateReview: {
            __typename: 'Review',
            id,
            text,
            stars
          }
        }
      })
    }
  })
})

export default compose(withAddReview, withEditReview)(ReviewForm)
```

When editing an object, we only need to select the `id` and fields that are changing. When the response arrives (and when the `optimisticResponse` is handled), just those fields are updated in the store (the other fields like `author` and `favorited` will remain). 

[*gif: Editing a review*](http://res.cloudinary.com/graphql/guide/edit-review.gif)

# Advanced querying

Section contents:

* [Paginating](6.md#paginating)
  * [Offset-based](6.md#offset-based)
    * [page](6.md#page)
    * [skip & limit](6.md#skip-&-limit)
  * [Cursors](6.md#cursors)
    * [after](6.md#after)
    * [orderBy](6.md#orderby)
* [Updating multiple queries](6.md#updating-multiple-queries)
* [Local state](6.md#local-state)
  * [Direct writes](6.md#direct-writes)
  * [Local mutations](6.md#local-mutations)
* [REST](6.md#rest)
* [Review subscriptions](6.md#review-subscriptions)
  * [Subscription component](6.md#subscription-component)
  * [Add new reviews](6.md#add-new-reviews)
  * [Update on edit and delete](6.md#update-on-edit-and-delete)
* [Prefetching](6.md#prefetching)
  * [On mouseover](6.md#on-mouseover)
  * [Cache redirects](6.md#cache-redirects)
* [Batching](6.md#batching)
* [Persisting](6.md#persisting)
* [Multiple endpoints](6.md#multiple-endpoints)

## Paginating

* [Offset-based](6.md#offset-based)
  * [page](6.md#page)
  * [skip & limit](6.md#skip-&-limit)
* [Cursors](6.md#cursors)
  * [after](6.md#after)
  * [orderBy](6.md#orderby)

Our `ReviewsQuery` currently has `limit: 20` because loading all the reviews would be unwise 😄. We don’t know how many reviews there will be in the database, and receiving thousands of them over the network would take a long time on mobile. They’d take a lot of memory in the Apollo store, they’d take a long time to render onto the page, and we’d have the problems that come along with a high DOM (and VDOM) node count: interacting with the DOM takes longer, and the amount of memory the browser uses grows—in the worst case, it exceeds the available memory on the device. On mobile, the OS kills the browser process, and on a computer, the OS starts using the hard drive for memory, which is very slow.

😅 So! In any app where the user might want to see a potentially long list of data, we paginate: we request and display a set amount of data, and when the user wants more (either by scrolling down—in the case of infinite scroll—or by clicking a “next page” link or “page 3” link), we request and display more. There are two main methods of pagination: offset-based, which we’ll talk about first, and [cursors](#cursors). 

We can display the data however we want. The two most common methods are pages (with next/previous links and/or numbered page links like Google search results) and infinite scroll. We can use either data-fetching method with either display method.

### Offset-based

Offset-based pagination is the easier of the two methods to implement—both on the client and on the server. In its simplest form, we request a `page` number, and each page has a set number of items. The Guide server sends 10 items per page, so page 1 has the first 10, page 2 has items 11-20, etc. A more flexible form is using two parameters: `offset` (or `skip`) and `limit`. The client decides how large each page is by setting the `limit` of how many items the server should return. For instance, we can have 20-item pages by first requesting `skip: 0, limit: 20`, then requesting `skip: 20, limit: 20` (“give me 20 items starting with #20”, so items 20-39), then `skip: 40, limit: 20`, etc.

The downside of offset-based pagination is that if the list is modified between requests, we might miss items or see them twice. Take, for example, this scenario:

1. We fetch page 1 with the first 10 items. 
2. Some other user deletes the 4th and 5th items.
3. If we were to fetch page 1 again, we would get the new first 10 items, which would now be items 1–3 and 6–12. But we don’t refetch page 1—we fetch page 2. 
4. Page 2 returns items 13–22. Which means now we’re showing the user items 1-10 and 13-22, and we’re missing items 11 and 12, which are now part of page 1.

On the other hand, if things are added to the list, we’ll see things twice:

1. We fetch page 1 with the first 10 items.
2. Some other user submits two new items.
3. If we were to fetch page 1 again, we would get the 2 new items and then items 1–8. But instead we fetch page 2.
4. Page 2 returns items 9-18, which means our list has items 9 and 10 twice—once from page 1 and once from page 2. 

Depending on our application, these issues might never happen, or if they do, it might not be a big deal. If it is a big deal, switching to [cursor-based](#cursors) pagination will fix it. Another possible solution, depending on how often items are added/deleted, is requesting extra pages (to make sure not to miss items) and de-duplicating (to make sure not to display the same item twice). For example, first we could request just page 1, and then when we want page 2, we request both pages 1 and 2. Now if we were in the first scenario above, and the 4th and 5th items were deleted, re-requesting page 1 would get items 11 and 12, which we previously missed. We’ll get items 1–3 and 6–10 a second time, but we can match their IDs to objects already in the store and discard them.

Let’s see this in action. Normally an API will support a single pagination method, but as we can see from this schema comment, the `reviews` query supports three different methods:

![reviews Query in the schema](/img/reviews-schema.png)

#### page

> If you’re jumping in here, `git checkout 16_0.2.0` (tag [16_0.2.0](https://github.com/GraphQLGuide/guide/tree/16_0.2.0), or compare [16...17](https://github.com/GraphQLGuide/guide/compare/16_0.2.0...17_0.2.0))

Let’s try `page` first. We switch our `ReviewQuery` from using the `limit` parameter to using the `page` parameter, and we use a variable so that `<Reviews>` can say which page it wants.

`src/graphql/Review.js`

```js
export const REVIEWS_QUERY = gql`
  query ReviewsQuery($page: Int) {
    reviews(page: $page) {
      ...ReviewEntry
    }
  }
  ${REVIEW_ENTRY}
`
```

`src/components/Reviews.js`

```js
const withReviews = graphql(REVIEWS_QUERY, {
  options: { errorPolicy: 'all', variables: { page: 1 } },
```

Now the page displays the first 10 reviews. If we change it to `{ page: 2 }`, we see the second 10 reviews. We could make the page number dynamic, but let’s wait to do that with the next method, skip and limit.

#### skip & limit

To use the `skip` and `limit` parameters, we replace `page` with them in the query:

[`src/graphql/Review.js`](https://github.com/GraphQLGuide/guide/compare/16_0.2.0...17_0.2.0)

```js
export const REVIEWS_QUERY = gql`
  query ReviewsQuery($skip: Int, $limit: Int) {
    reviews(skip: $skip, limit: $limit) {
      ...ReviewEntry
    }
  }
  ${REVIEW_ENTRY}
`
```

and update our component:

[`src/components/Reviews.js`](https://github.com/GraphQLGuide/guide/compare/16_0.2.0...17_0.2.0)

```js
const withReviews = graphql(REVIEWS_QUERY, {
  options: { errorPolicy: 'all', variables: { skip: 0, limit: 10 } },
```

And we see the first 10 reviews. To see the next 10, we can skip the first 10 with `{ skip: 10, limit: 10 }`. 

Let’s implement infinite scroll, during which the component will provide new values for `skip` when the user scrolls to the bottom of the page. First let’s simplify what we’re working with by extracting out the list of reviews to `<ReviewList>`. `<Reviews>` will be left with the header and the add button. Here’s our new `<ReviewList>`:

```js
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { graphql } from 'react-apollo'
import { propType } from 'graphql-anywhere'

import Review from './Review'

import { REVIEWS_QUERY, REVIEW_ENTRY } from '../graphql/Review'

class ReviewList extends Component {
  render() {
    const { reviews, loading, user } = this.props

    return (
      <div className="Reviews-content">
        {loading
          ? <div className="Spinner" />
          : reviews.map(review => (
            <Review key={review.id} review={review} user={user} />
          ))
        }
      </div>
    )
  }
}

ReviewList.propTypes = {
  reviews: PropTypes.arrayOf(propType(REVIEW_ENTRY)),
  loading: PropTypes.bool.isRequired,
  user: PropTypes.object
}

const withReviews = graphql(REVIEWS_QUERY, {
  options: { errorPolicy: 'all', variables: { skip: 0, limit: 10 } },
  props: ({ data: { reviews, loading } }) => ({
    reviews,
    loading
  })
})

export default withReviews(ReviewList)
```

We’re going to want a spinner at the bottom of the list of reviews to indicate that we’re loading more. When the list is really long—as it is in the case of reviews—we don’t need to code hiding the spinner, since it’s unlikely users will reach the end 😄. Since we’ll always have a spinner, we no longer need `loading`:

[`src/components/ReviewList.js`](https://github.com/GraphQLGuide/guide/compare/16_0.2.0...17_0.2.0)

```js
class ReviewList extends Component {
  render() {
    const { reviews, user } = this.props

    return (
      <div className="Reviews-list">
        <div className="Reviews-content">
          {reviews && reviews.map(review => (
            <Review key={review.id} review={review} user={user} />
          ))}
        </div>
        <div className="Spinner" />
      </div>
    )
  }
}

ReviewList.propTypes = {
  reviews: PropTypes.arrayOf(propType(REVIEW_ENTRY)),
  user: PropTypes.object
}

const withReviews = graphql(REVIEWS_QUERY, {
  options: { errorPolicy: 'all', variables: { skip: 0, limit: 10 } },
  props: ({ data: { reviews } }) => ({
    reviews
  })
})
```

Note that now we need to guard with `reviews && reviews.map`, since `reviews` is `undefined` during loading.

`graphql()` gives a prop named [`data.fetchMore`](https://www.apollographql.com/docs/react/basics/queries.html#graphql-query-data-fetchMore) that we can use to fetch more data using the same query but different variables. Let’s use it to create a `loadMoreReviews()` for `ReviewList` to call:

[`src/components/ReviewList.js`](https://github.com/GraphQLGuide/guide/compare/16_0.2.0...17_0.2.0)

```js
const withReviews = graphql(REVIEWS_QUERY, {
  options: { errorPolicy: 'all', variables: { skip: 0, limit: 10 } },
  props: ({ data: { reviews, fetchMore } }) => ({
    reviews,
    loadMoreReviews: () => {
      return fetchMore({
        variables: { skip: reviews.length },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult.reviews) {
            return previousResult
          }

          return {
            ...previousResult,
            reviews: [
              ...previousResult.reviews,
              ...fetchMoreResult.reviews
            ]
          }
        }
      })
    }
  })
})
```

`variables: { skip: reviews.length }`: we can keep the same `limit` by not including it here. And we know how many to skip for the next query—the amount we currently have, `data.reviews.length`. [`updateQuery`](https://www.apollographql.com/docs/react/basics/queries.html#graphql-query-data-fetchMore) is how we tell Apollo to combine the current data with the newly arrived data, which for us is simply putting the new reviews on the end of the `reviews` array. Now we call `loadMoreReviews()` when the user approaches the bottom of the page:

[`src/components/ReviewList.js`](https://github.com/GraphQLGuide/guide/compare/16_0.2.0...17_0.2.0)

```js
class ReviewList extends Component {
  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll)
  }

  componentWillUnmount() {
    clearTimeout(this.timeoutID)
    window.removeEventListener('scroll', this.handleScroll)
  }

  handleScroll = (event) => {
    const currentScrollHeight = window.scrollY + window.innerHeight
    const pixelsFromBottom = document.documentElement.scrollHeight - currentScrollHeight
    if (pixelsFromBottom < 250) {
      this.props.loadMoreReviews()
    }
  }
```

This works! One issue is that scroll events fire often, so once the user passes the threshold, we’re calling `loadMoreReviews()` a **lot** 😜. We only need to once, so we want to stop ourselves from calling it again if we just called it. We can tell whether we just called it by looking at `graphql()`’s [`data.networkStatus`](https://www.apollographql.com/docs/react/basics/queries.html#graphql-query-data-networkStatus), which has a numerical value corresponding with different statuses—loading, ready, polling, refetching, etc. It’s `3` while Apollo is fetching more data, and then goes back to `7` (ready) when the data has arrived. So we can add in a guard:

```js
const FETCH_MORE = 3

class ReviewList extends Component {
  ...

  handleScroll = (event) => {
    if (this.props.networkStatus === FETCH_MORE) {
      return
    }

    const currentScrollHeight = window.scrollY + window.innerHeight
    const pixelsFromBottom = document.documentElement.scrollHeight - currentScrollHeight
    if (pixelsFromBottom < 250) {
      this.props.loadMoreReviews()
    }
  }

...

const withReviews = graphql(REVIEWS_QUERY, {
  options: {
    errorPolicy: 'all',
    variables: { skip: 0, limit: 10 },
    notifyOnNetworkStatusChange: true
  },
  props: ({ data: { reviews, fetchMore, networkStatus } }) => ({
    reviews,
    networkStatus,
    loadMoreReviews: () => {
      ...
```

We need to add `networkStatus` to our `props` function to provide it to our component. We also need to set [`options.notifyOnNetworkStatusChange`](https://www.apollographql.com/docs/react/basics/queries.html#graphql-config-options-notifyOnNetworkStatusChange) to `true`, which allows `networkStatus` to change to `3`.

Another issue we’ve got is what happens when someone else adds a review during the time between when the user loads the page and when they scroll to the bottom: `loadMoreReviews()` will query for `reviews(skip: 10, limit: 10)`, which will return items 11-20. However, the 11th item now is the same as the 10th item before, and we already have the 10th item in `previousResult`. When we combine `previousResult` with `fetchMoreResult`, we get a `reviews` array with a duplicated item:

```js
updateQuery: (previousResult, { fetchMoreResult }) => {
  if (!fetchMoreResult.reviews) {
    return previousResult
  }

  return {
    ...previousResult,
    reviews: [
      ...previousResult.reviews,
      ...fetchMoreResult.reviews
    ]
  }
}
```          

Since we use the review’s `id` for the `key`, React gives us this error in the console:

```
Warning: Encountered two children with the same key
```

We can prevent duplicated objects from being saved in the store by changing `updateQuery`:

```js
import find from 'lodash/find'

...

loadMoreReviews: () => {
  return fetchMore({
    variables: { skip: reviews.length },
    updateQuery: (previousResult, { fetchMoreResult }) => {
      if (!fetchMoreResult.reviews) {
        return previousResult
      }

      const newReviews = fetchMoreResult.reviews.filter(
        ({ id }) => !find(previousResult.reviews, { id })
      )

      return {
        ...previousResult,
        reviews: [...previousResult.reviews, ...newReviews]
      }
    }
  })
}
```

We filter out all of the reviews that are already present in `previousResult.reviews`. We can test it out by setting a `skip` that’s too low, for instance:

```js
variables: { skip: reviews.length - 5 },
```

Now when we scroll down, we should have 15 total reviews on the page instead of 20 and a React duplicate `key` error. 

It seems strange at first, but subtracting some number from the length is a good idea to leave in the code! It makes sure—in the case in which some of the first 10 items are deleted—that we don’t miss any items. If we still want 10 new items to (usually) show up when we scroll down, then we can also change `limit` to 15:

```js
variables: { skip: reviews.length - 5, limit: 15 },
```

The *final* issue is that we get an error when we try to add or delete a review:

```
Error: Can't find field reviews({}) on object (ROOT_QUERY) {
"chapters": [
    {
      "type": "id",
      "id": "Chapter:-3",
      "generated": false
    },
    ...
  ],
  "currentUser": {
    "type": "id",
    "id": "$ROOT_QUERY.currentUser",
    "generated": true
  },
  "reviews({\"skip\":0,\"limit\":10})": [
    {
      "type": "id",
      "id": "Review:5aa04e9ec3e315449011604c",
      "generated": false
    },
    ...
```

In our `withAddReview` and `withDeleteMutation` HOCs’ `update` functions, we’re trying to read `REVIEWS_QUERY` from the store. Since we’re not specifying variables there, it looks in the store for the root query field `reviews({})`, with no arguments. And we don’t have that in our store, because we’ve never done a `REVIEWS_QUERY` without arguments—we’ve only done it with a `skip` and `limit`. The error message prints out the current Apollo store’s state, and we can see that our `reviews` query has both arguments:

```
"reviews({\"skip\":0,\"limit\":10})": [
```

We need to provide the same arguments to `store.readQuery` so that Apollo knows which field on `ROOT_QUERY` to read from:

[`src/components/ReviewForm.js`](https://github.com/GraphQLGuide/guide/compare/16_0.2.0...17_0.2.0)

```js
const withAddReview = graphql(ADD_REVIEW_MUTATION, {
  props: ({ ownProps: { user }, mutate }) => ({
    addReview: (text, stars) => {
      mutate({
        ...
        update: (store, { data: { createReview: newReview } }) => {
          const query = {
            query: REVIEWS_QUERY,
            variables: { skip: 0, limit: 10 }
          }

          const data = store.readQuery(query)
          data.reviews.unshift(newReview)
          store.writeQuery({ ...query, data })
        }
      })
    }
  })
})
```

[`src/components/Review.js`](https://github.com/GraphQLGuide/guide/compare/16_0.2.0...17_0.2.0)

```js
const withDeleteMutation = graphql(DELETE_REVIEW_MUTATION, {
  props: ({ mutate }) => ({
    delete: id =>
      mutate({
        ...
        update: store => {
          const query = {
            query: REVIEWS_QUERY,
            variables: { skip: 0, limit: 10 }
          }

          let data = store.readQuery(query)
          remove(data.reviews, { id })
          store.writeQuery({ ...query, data })

          ...
        }
      })
  })
})
```

Now Apollo can successfully read and write to the store, and our optimistic updates will work again. 

What happens when `skip` changes to 10 or 20? Do we need to also update our calls to `readQuery`? It turns out that we don’t need to—when we call `fetchMore`, the additional results get added to the store under the original root query field. We can see this is the case by scrolling down, opening Apollo devtools -> Cache, and looking at `ROOT_QUERY`:

![fetchMore reviews in Cache](img/fetchMore-reviews-cache.png)

### Cursors

> If you’re jumping in here, `git checkout 17_0.2.0` (tag [17_0.2.0](https://github.com/GraphQLGuide/guide/tree/17_0.2.0), or compare [17...18](https://github.com/GraphQLGuide/guide/compare/17_0.2.0...18_0.2.0))

Subsections:

* [after](6.md#after)
* [orderBy](6.md#orderby)

Cursor-based pagination uses a **cursor**—a pointer to where we are in a list. With cursors, the schema looks different from the Guide schema we’ve been working with. Our queries could look something like:

```gql
{
  listReviews (cursor: $cursor, limit: $limit) {
    cursor
    reviews {
      ...ReviewEntry
    }
  }
}
```

Each query comes back with a cursor, which we then include as an argument in our next query. A cursor usually encodes both the ID of the last item and the list’s sort order, so that the server knows what to return next. For instance, if the first 10 reviews ended with a review that had an ID of `100`, and the list was ordered by most recently created, the cursor could be `100:createdAt_DESC`, and the query could be:

```gql
{
  listReviews (cursor: "100:createdAt_DESC", limit: 10) {
    cursor
    reviews {
      ...ReviewEntry
    }
  }
}
```

It would return:

```json
{
  "data": {
    "listReviews": {
      "cursor": "90:createdAt_DESC",
      "reviews": [{
        "id": "99"
        ...
      },
      ...
      {
        "id": "90"
        ...
      }]
    }
  }
}
```

And then our next query would be `listReviews (cursor: "90:createdAt_DESC", limit: 10)`. 

This is a simple version of cursors. If we’re working with a server that follows the [Relay Cursor Connections spec](https://facebook.github.io/relay/graphql/connections.htm) (with `edges` and `node`s and `pageInfo`s), we can follow [this example](https://www.apollographql.com/docs/react/recipes/pagination.html#cursor-pages) for querying it.

#### after

Let’s implement a version of pagination that has the same information—last ID and sort order—but works within the Guide schema. We can see in [Playground](https://api.graphql.guide/play) that there are a couple of arguments we haven’t used yet—`after` and `orderBy`:

```gql
enum ReviewOrderBy {
  createdAt_ASC 
  createdAt_DESC
}

# To paginate, use page, skip & limit, or after & limit
reviews(limit: Int, page: Int, skip: Int, after: ObjID, orderBy: ReviewOrderBy): [Review!]
```

First, let’s use the last review’s ID for `after`, and remove `skip`:

[`src/components/ReviewList.js`](https://github.com/GraphQLGuide/guide/compare/17_0.2.0...18_0.2.0)

```js
const withReviews = graphql(REVIEWS_QUERY, {
  options: {
    errorPolicy: 'all',
    variables: { limit: 10 },
    notifyOnNetworkStatusChange: true
  },
  props: ({ data: { reviews, fetchMore, networkStatus } }) => ({
    reviews,
    networkStatus,
    loadMoreReviews: () => {
      if (!reviews) {
        return
      }

      const lastId = reviews[reviews.length - 1].id
      return fetchMore({
        variables: { after: lastId },
```

It’s possible that our scroll handler (which calls `loadMoreReviews`) will fire before the results from the initial reviews query has completed, in which case `reviews` will be `undefined`, and we do nothing.

We also have to remove `skip` from `withAddReview` and `withDeleteMutation`, and update the query:

[`src/graphql/Review.js`](https://github.com/GraphQLGuide/guide/compare/17_0.2.0...18_0.2.0)

```js
query ReviewsQuery($after: ObjID, $limit: Int) {
  reviews(after: $after, limit: $limit) {
```

It works! And it’s so precise that we don’t have to worry about things getting added or deleted between `fetchMore`s. We can even take out that filtering code in `updateQuery`! [What was the runtime of that thing anyway? It was so big that author Loren was tempted to prematurely optimize with a hash 😆.] One might be concerned about the possibility of the review we’re using as a cursor being deleted, but some server implementations cover this case—the Guide API is backed by MongoDB, which has IDs that are comparable based on order of creation, so the server can still find IDs that were created before or after the deleted ID.

#### orderBy

Next let’s figure out how to get sort order working as well. The two possible values are `createdAt_DESC` (newest reviews first, the default) and `createdAt_ASC`. If we put a “Newest/Oldest” select box in `<Reviews>`, then we can pass the value down to `<ReviewList>` to use in the query’s `variables`:

[`src/components/Reviews.js`](https://github.com/GraphQLGuide/guide/compare/17_0.2.0...18_0.2.0)

```js
import { MenuItem } from 'material-ui/Menu'
import { FormControl } from 'material-ui/Form'
import Select from 'material-ui/Select'

class Reviews extends Component {
  state = {
    addingReview: false,
    orderBy: 'createdAt_DESC'
  }

  handleOrderByChange = event => {
    this.setState({ orderBy: event.target.value })
  }

  render() {
    ...
          <header className="Reviews-header">
            ...

            <FormControl>
              <Select
                value={this.state.orderBy}
                onChange={this.handleOrderByChange}
                displayEmpty
              >
                <MenuItem value="createdAt_DESC">Newest</MenuItem>
                <MenuItem value="createdAt_ASC">Oldest</MenuItem>
              </Select>
            </FormControl>
          </header>
        </div>

        <ReviewList user={user} orderBy={this.state.orderBy} />
```          

In `<ReviewList>`, we need our `withReviews` HOC to have access to the props. We can use the function form of `options` that we used back in `<Section>`. The function gets the props, from which we take `orderBy`:

[`src/components/ReviewList.js`](https://github.com/GraphQLGuide/guide/compare/17_0.2.0...18_0.2.0)

```js
ReviewList.propTypes = {
  reviews: PropTypes.arrayOf(propType(REVIEW_ENTRY)),
  user: PropTypes.object,
  orderBy: PropTypes.string.isRequired
}

const withReviews = graphql(REVIEWS_QUERY, {
  options: ({ orderBy }) => ({
    errorPolicy: 'all',
    variables: { limit: 10, orderBy },
    notifyOnNetworkStatusChange: true
  }),
```

The select input now works—when we change it to “Oldest”, the query variable updates, and a different list of reviews loads. When we go back to “Newest”, the original list immediately appears, because Apollo has that list cached under the original set of variables. We can see in devtools that both lists are indeed cached:

![Cache with orderBy](img/cache-with-orderBy.png)

But we’ve got the below issue again!

```
Error: Can’t find field reviews({"limit":10}) on object (ROOT_QUERY)
```

Whenever we change the variables we’re using with `REVIEWS_QUERY`, we have to change our calls to `readQuery` in our mutation HOCs. First `withAddReview`: what value of `orderBy` do we use? We don’t want a new review to appear at the top of an “Oldest” list—we always want it to appear at the top of the “Newest” list. So we use `createdAt_DESC`:

[`src/components/ReviewForm.js`](https://github.com/GraphQLGuide/guide/compare/17_0.2.0...18_0.2.0)

```js
const withAddReview = graphql(ADD_REVIEW_MUTATION, {
  props: ({ ownProps: { user }, mutate }) => ({
    addReview: (text, stars) => {
      mutate({
        ...
        update: (store, { data: { createReview: newReview } }) => {
          const query = {
            query: REVIEWS_QUERY,
            variables: { limit: 10, orderBy: 'createdAt_DESC' }
          }

          const data = store.readQuery(query)
```

Now if we switch to “Oldest”, add a review, and switch back to “Newest”, it will show up at the top. Next is `withDeleteMutation`—we want to remove the review from the current list. We can get the current list order by passing it down from `ReviewList` and then to `delete()`:

[`src/components/ReviewList.js`](https://github.com/GraphQLGuide/guide/compare/17_0.2.0...18_0.2.0)

```js
render() {
  const { reviews, user, orderBy } = this.props
  ...
    <Review
      key={review.id}
      review={review}
      user={user}
      orderBy={orderBy}
    />
```

[`src/components/Review.js`](https://github.com/GraphQLGuide/guide/compare/17_0.2.0...18_0.2.0)

```js
class Review extends Component {
  ...
  delete = () => {
    this.closeDeleteConfirmation()
    this.props.delete(this.props.review.id, this.props.orderBy).catch(e => {
      if (find(e.graphQLErrors, { message: 'unauthorized' })) {
        alert('👮‍♀️✋ You can only delete your own reviews!')
      }
    })

...

const withDeleteMutation = graphql(DELETE_REVIEW_MUTATION, {
  props: ({ mutate }) => ({
    delete: (id, orderBy) =>
      mutate({
        variables: { id },
        optimisticResponse: {
          removeReview: true
        },
        update: store => {
          const query = {
            query: REVIEWS_QUERY,
            variables: { limit: 10, orderBy }
          }

          let data = store.readQuery(query)
          remove(data.reviews, { id })
          store.writeQuery({ ...query, data })
```

## Updating multiple queries

> If you’re jumping in here, `git checkout 18_0.2.0` (tag [18_0.2.0](https://github.com/GraphQLGuide/guide/tree/18_0.2.0)). Code from this section isn’t included in future tags.

We’ve been assuming the list of reviews is so long that we can’t scroll down enough to reach the end. When we deleted a review, we removed it from the current list, but not the other. Because if it’s on Newest and the list is huge, then it won’t also be on Oldest. But when we’re dealing with smaller lists, it might be on both lists. Let’s remove it from both. 

We know there will always be a list of reviews in the store ordered by `createdAt_DESC` because that’s the default. We don’t know whether there will be a list ordered by `createdAt_ASC`. If there isn’t, `store.readQuery` will throw an error. So we’ll first read and write `DESC`, and then we’ll *try* reading and writing `ASC`:

[`src/components/Review.js`](https://github.com/GraphQLGuide/guide/compare/18_0.2.0...19_0.2.0)

```js
const withDeleteMutation = graphql(DELETE_REVIEW_MUTATION, {
  props: ({ mutate }) => ({
    delete: id =>
      mutate({
        variables: { id },
        optimisticResponse: {
          removeReview: true
        },
        update: store => {
          const query = {
            query: REVIEWS_QUERY,
            variables: { limit: 10, orderBy: 'createdAt_DESC' }
          }

          let data = store.readQuery(query)
          remove(data.reviews, { id })
          store.writeQuery({ ...query, data })

          query.variables.orderBy = 'createdAt_ASC'

          try {
            data = store.readQuery(query)
            remove(data.reviews, { id })
            store.writeQuery({ ...query, data })
          } catch (e) {}
```

We can also stop passing in `orderBy`.

If we can scroll through our entire list, then any newly added item should go on the end of the Oldest list—not just the beginning of the Newest list as we’re doing currently. So let’s write the new review to the `orderBy: 'createdAt_ASC'` list:

[`src/components/ReviewForm.js`](https://github.com/GraphQLGuide/guide/compare/18_0.2.0...19_0.2.0)

```js
const withAddReview = graphql(ADD_REVIEW_MUTATION, {
  props: ({ ownProps: { user }, mutate }) => ({
    addReview: (text, stars) => {
      mutate({
        ...
        update: (store, { data: { createReview: newReview } }) => {
          const query = {
            query: REVIEWS_QUERY,
            variables: { limit: 10, orderBy: 'createdAt_DESC' }
          }

          let data = store.readQuery(query)
          data.reviews.unshift(newReview)
          store.writeQuery({ ...query, data })

          query.variables.orderBy = 'createdAt_ASC'

          try {
            data = store.readQuery(query)
            data.reviews.push(newReview)
            store.writeQuery({ ...query, data })
          } catch (e) {}
        }
```

That wasn’t too hard—we’re updating two queries when deleting and two when creating. But imagine if we had more sort orders—like last updated or number of stars—and added filters—like number of stars or sentences:

```
# orderBy
createdAt_DESC
createdAt_ASC
updatedAt_DESC
updatedAt_ASC
stars_DESC
stars_ASC

# minStars
1
2
3
4
5

# minSentences
1
2
3
4
5
```

Now when there’s a change, there are many more lists in the cache we might need to update:

```
orderBy: createdAt_DESC, minStars: 1, minSentences: 1
orderBy: createdAt_DESC, minStars: 1, minSentences: 2
orderBy: createdAt_DESC, minStars: 1, minSentences: 3
orderBy: createdAt_DESC, minStars: 1, minSentences: 4
orderBy: createdAt_DESC, minStars: 1, minSentences: 5
orderBy: createdAt_DESC, minStars: 2, minSentences: 1
orderBy: ...
```

In total, there are `6 x 5 x 5 = 150` possibilities. That’s a lot of updating to do. Not only that, but we have to add in some logic—for instance, if a new review is submitted with 4 sentences and 4 stars, we don’t want to also add it to any of the `minStars: 5` or `minSentences: 5` filtered lists. 

When our cache-updating code gets this complicated, we can use [`apollo-link-watched-mutation`](https://github.com/haytko/apollo-link-watched-mutation) to simplify things. With it, we define a function that, given the mutation and the query, returns a new query result. And the package takes care of calling our function as many times as it needs to (for as many variations of the query variables exist in the store) as well as reading from and writing to the store. We won’t actually use this in our app, but here’s how we would implement it:

```
npm install apollo-link-watched-mutation
```

`src/index.js`:

```js
import { ApolloLink } from 'apollo-link'

import { getWatchedMutationLink } from './lib/watchedMutationLink'

const cache = new InMemoryCache()

const link = ApolloLink.from([
  getWatchedMutationLink(cache),
  errorLink,
  networkLink
])
```

`lib/watchedMutationLink.js`:

```js
import WatchedMutationLink from 'apollo-link-watched-mutation'

export const getWatchedMutationLink = cache =>
  new WatchedMutationLink(cache, {
    DeleteReview: {
      ReviewsQuery: ({ mutation, query: { result } }) => {
        ...
      },
      UserQuery: ({ mutation, query: { result } }) => {
        ...
      }
    },
    AddReview: {
      ReviewsQuery: ({ mutation, query }) => {
        ...
      }
    }
  })
```

> We would also remove the `update` functions from our `mutate()` calls in our `withAddReview` and `withDeleteMutation` HOCs.

The first arg to the `WatchedMutationLink` constructor is our cache, and the second is an object that lists each mutation and the queries we want to update when that mutation is complete. In this case, the mutation named `DeleteReview` updates `ReviewsQuery` and `UserQuery`, and the `AddReview` mutation updates `ReviewsQuery`. At first, looking at our deletion update function, we might think to update `ReviewsQuery` and `ReadUserFavorites`: 

`src/components/Review.js`

```js
const READ_USER_FAVORITES = gql`
  query ReadUserFavorites {
    currentUser {
      id
      favoriteReviews {
        id
      }
    }
  }
`

...

  update: store => {
    const query = {
      query: REVIEWS_QUERY,
      variables: { limit: 10, orderBy: 'createdAt_DESC' }
    }

    let data = store.readQuery(query)
    remove(data.reviews, { id })
    store.writeQuery({ ...query, data })

    query.variables.orderBy = 'createdAt_ASC'

    try {
      data = store.readQuery(query)
      remove(data.reviews, { id })
      store.writeQuery({ ...query, data })
    } catch (e) {}

    data = store.readQuery({ query: READ_USER_FAVORITES })
    remove(data.currentUser.favoriteReviews, { id })
    store.writeQuery({ query: READ_USER_FAVORITES, data })
  }
```

However, `ReadUserFavorites` is only used to write data to the store in this update function—it is not a *watched query* (a watched query is a query attached to a React component with a `<Query>` or a `graphql()` HOC). `WatchedMutationLink` goes through all the watched queries and calls functions of the same name in our config, so if we had such a function, it would never get called:

```js
new WatchedMutationLink(cache, {
  DeleteReview: {
    ReviewsQuery: ({ mutation, query: { result } }) => {
      // this function gets called
    },
    ReadUserFavorites: ({ mutation, query: { result } }) => {
      // this function never gets called
    }
```

What we’re trying to update is the `favoriteCount` in the `<Reviews>` header, and that’s calculated from the `user` prop, which is fetched by the `UserQuery`, so we’ll add a `UserQuery` update function to our config object. Here are the `ReviewsQuery` and `UserQuery` functions filled in:

```js
import remove from 'lodash/remove'

new WatchedMutationLink(cache, {
  DeleteReview: {
    ReviewsQuery: ({ mutation, query: { result } }) => {
      const idBeingDeleted = mutation.variables.id
      remove(result.reviews, {
        id: idBeingDeleted
      })
      return result
    },
    UserQuery: ({ mutation, query: { result } }) => {
      const idBeingDeleted = mutation.variables.id
      remove(result.currentUser.favoriteReviews, { id: idBeingDeleted })
      return result
    }
  }
})
```

The update function is given the `mutation` that just occurred and the `query` that is being watched. The `query.result` is the current data in the store—in the case of `ReviewsQuery`, a list of `reviews`. The value we return from the function is the updated result, and contains what we want written back to the store. Here we remove the deleted review from `result.reviews` and return `result`. 

Each function gets called as many times as there are matching queries. For example, if there were all 150 combinations of possible `ReviewsQuery` arguments in the store, our `ReviewsQuery()` function would be called 150 times, and the value of `result.reviews` would be a different list of reviews each time.

Updating after `AddReviews` is more complicated. We don’t have to worry about the `favoriteCount`, because a new review hasn’t been favorited, but the logic for updating `ReviewsQuery` lists is much longer than our above removal logic:

```js
import findIndex from 'lodash/findIndex'

new WatchedMutationLink(cache, {
  DeleteReview: { ... },
  AddReview: {
    ReviewsQuery: ({ mutation, query }) => {
      const newReview = mutation.result.data.createReview

      const { orderBy, minStars, minSentences } = query.variables
      const { reviews } = query.result

      const countSentences = ({ text }) => text.match(/\w[.?!](\s|$)/g).length
      if (
        newReview.stars < minStars ||
        countSentences(newReview) < minSentences
      ) {
        // don't add to store
        return
      }

      switch (orderBy) {
        case 'createdAt_DESC':
        case 'updatedAt_DESC':
          reviews.unshift(newReview)
          break
        case 'createdAt_ASC':
        case 'updatedAt_ASC':
          reviews.push(newReview)
          break
        case 'stars_DESC':
          const insertBefore = findIndex(
            reviews,
            review => review.stars <= newReview.stars
          )
          reviews.splice(insertBefore - 1, 0, newReview)
          break
        case 'stars_ASC':
          const insertBefore = findIndex(
            reviews,
            review => review.stars >= newReview.stars
          )
          reviews.splice(insertBefore - 1, 0, newReview)
          break
      }

      // return the query result, including the modified query.result.reviews
      return query.result
    }
  }
})
```

Depending on what the query variables are (`orderBy`, `minStars`, and `minSentences`), we have to decide whether to add the new review to the list, and if yes, where to add it. If the new review’s number of stars or sentences is below the minimum, we return `undefined` so that `WatchedMutationLink` knows to not alter the store. If the sort order is by `createdAt` or `updatedAt`, we add it to the top or bottom of the list. And if the sort order is by number of stars, we go through the list to find the right location.

## Local state

Section contents:

* [Direct writes](6.md#direct-writes)
* [Local mutations](6.md#local-mutations)

In most of the apps we build, the majority of our *state* (the data that backs our UI) is *remote state*—it comes from a server and is saved in a database. But some of our state doesn’t come from the server and isn’t stored in a database—it originates locally on the client and stays there. This type of data is called our *local state*. One example of local state is a user setting that for whatever reason we didn’t want to send to the server to persist. Another example is data from a device API: if we were making a navigation app, we would want to display the device’s location and speed. A simple solution would be to put the state in a variable, for instance `window.gps`:

```js
navigator.geolocation.watchPosition(position => {
  window.gps = position.coords
}
```

And then we’d reference that variable when we needed it. However, there are a couple of issues with this solution. One is that we’d like be able to trigger view updates when the data changes. We could move it to a component’s `this.state`, but A) when the component is unmounted, we lose the data, and B) if we need the data in different places in the app, we’d have to pass it around as a prop a lot. The other issue is the lack of structure—with a large app and many developers, it gets hard to know what state is out there in variables scattered around the codebase, the data format of each variable, and how each should be modified. A popular solution that addresses both of these issues is [Redux](https://redux.js.org/), a library for maintaining global state. 

> *Global state* means state accessible from anywhere in your app, as opposed to *component state*, which is accessible as `this.state` inside the component in which it’s created, or as a prop if the data is passed to children. **Global vs component** state is tangential to **local vs remote** state. The former is about where on the client the state is kept, and the latter is about whether or not the data is stored on the server.

Redux provides a structure for reading and modifying data, and it re-renders components when the data changes. While Redux is great, Apollo has its own solution to local state which addresses the same issues. Choosing the system we’re already using for local state will make it simpler to implement and result in more understandable, concise code.

Apollo stores local state alongside remote state in the Apollo store. One guess as to how we read it out of the store... with GraphQL queries! All we do is add a `@client` [*directive*](2.md#directives):

```gql
query LocationQuery {
  gps @client {
    lat
    lng
  }
}
```

There are two ways to update our local state—direct writes or mutations. Direct writes are easy to do—we just call the `apollo.writeData()` function, which writes data to the store. Mutations take some work to set up, but provide structure that’s useful in a large codebase or when working with a team. They also allow for reading from the store, which we need to do sometimes in order to figure out what to write.

### Direct writes

> If you’re jumping in here, `git checkout 18_0.2.0` (tag [18_0.2.0](https://github.com/GraphQLGuide/guide/tree/18_0.2.0), or compare [18...19](https://github.com/GraphQLGuide/guide/compare/18_0.2.0...19_0.2.0))

`apollo.writeData()` simply takes an object with a `data` property and writes the data to the store at the root level. So if we wanted to be able to make the root `gps @client` query above, we would do:

```js
navigator.geolocation.watchPosition(position => {
  apollo.writeData({ data: { gps: position.coords } })
}
```

A place in our app where a simple piece of local state would be useful is during login. Right now, our `withUser()` HOC provides a `loggingIn` boolean that’s true when the `currentUser` query is `loading`. But it would be more accurate if `loggingIn` were true as soon as the user clicks the “Sign in” button. If we had a piece of state called `loginInProgress` that was true while the user went through the Auth0 login process, then we could update `loggingIn` to be `loading || loginInProgress`:

[`src/lib/withUser.js`](https://github.com/GraphQLGuide/guide/compare/19_0.2.0...20_0.2.0)

```js
export const USER_QUERY = gql`
  query UserQuery {
    currentUser {
      id
      firstName
      name
      username
      email
      photo
      hasPurchased
      favoriteReviews {
        id
      }
    }
    loginInProgress @client
  }
`

export const withUser = graphql(USER_QUERY, {
  props: ({ data: { currentUser, loading, loginInProgress } }) => ({
    user: currentUser,
    loggingIn: loading || loginInProgress
  })
})
```

We update with `writeData()`:

[`src/lib/auth.js`](https://github.com/GraphQLGuide/guide/compare/19_0.2.0...20_0.2.0)

```js
export const login = () => {
  apollo.writeData({ data: { loginInProgress: true } })

  auth0Login({
    onCompleted: e => {
      apollo.writeData({ data: { loginInProgress: false } })

      if (e) {
        console.error(e)
        return
      }

      apollo.reFetchObservableQueries()
    }
  })
}
```

We make sure to set it to `false` first thing in `onCompleted` so that it runs even when there’s an error. Lastly, we need to set up local state: 

[`src/lib/apollo.js`](https://github.com/GraphQLGuide/guide/compare/19_0.2.0...20_0.2.0)

```js
export const apollo = new ApolloClient({ link, cache, resolvers: {} })

const initializeCache = () => {
  cache.writeData({
    data: {
      loginInProgress: false
    }
  })
}

initializeCache()

apollo.onResetStore(initializeCache)
```

First we add a `resolvers` object to `ApolloClient` so that it knows we’re using local state. Then we make a function to initialize the cache by setting `loginInProgress` to `false`, and we call the function both on pageload and when the store is reset.

Now it’s working—when we click the “Sign in” button, we can see the spinner while the Auth0 popup is open 😊.

### Local mutations

> If you’re jumping in here, `git checkout 19_0.2.0` (tag [19_0.2.0](https://github.com/GraphQLGuide/guide/tree/19_0.2.0), or compare [19...20](https://github.com/GraphQLGuide/guide/compare/19_0.2.0...20_0.2.0))

Now let’s add a local-state feature that uses a mutation. Currently, whenever we switch between sections, one of two things happens to our scroll position:

- If we don’t have the section content on the client, `scrollY` is set to 0 when the loading skeleton is displayed.
- If we do have the section content on the client, `scrollY` remains the same.

It would be nice for the user if, when switching back to a section they were previously reading, the scroll position updates to where they were. So let’s save their last position for each section in local state! We could implement this feature with direct writes, but let’s see what the more structured method—a local mutation—looks like.

When implementing a new feature, the best place to start is often the schema. Thus far we’ve been using an existing schema defined on the `api.graphql.guide` server. But we’re writing a client-side mutation, so the schema for it will live on the client, and Apollo will combine the client and server schemas into one, which we’ll be able to see in the devtools. 

Let’s call the mutation `setSectionScroll`, and all it needs is the section id and `scrollY`:

```gql
type Mutation {
  setSectionScroll(id: String!, scrollY: Int!): Boolean
}
```

Normally a mutation that updates a type will return that type—in this case a `Section`:

```gql
type Mutation {
  setSectionScroll(id: String!, scrollY: Int!): Section
}
```

And then we’d request the `id` and new `scrollY` so that Apollo could update the store:

```gql
mutation {
  setSectionScroll(id: "foo", scrollY: 10) {
    id
    scrollY
  }
}
```

But this mutation will be run on the client, and it will be modifying the store. So all we need to return from the mutation is `true` to indicate success. 

We pass our client-side schema to `ApolloClient()`:

[`src/lib/apollo.js`](https://github.com/GraphQLGuide/guide/compare/19_0.2.0...20_0.2.0)

```js
import gql from 'graphql-tag'

const typeDefs = gql`
  type Query {
    loginInProgress: Boolean
  }
  type Mutation {
    setSectionScroll(id: String!, scrollY: Int!): Boolean
  }
`

export const apollo = new ApolloClient({
  link,
  cache,
  typeDefs,
  resolvers: {}
})
```

Every schema needs to define a `Query` type, so we put our top-level `loginInProgress` field from the [last section](#direct-writes). Next let’s write the `setSectionScroll` resolver:

```js
export const apollo = new ApolloClient({
  link,
  cache,
  typeDefs,
  resolvers: {
    Mutation: {
      setSectionScroll: (_, { id, scrollY }, { cache, getCacheKey }) => {
        const cacheKey = getCacheKey({ __typename: 'Section', id })
        cache.writeData({ id: cacheKey, data: { scrollY } })
        return true
      }
    }
  }
})
```

We’re given the `getCacheKey()` function which generates the *store ID* we talked about in the [Arbitrary updates](#arbitrary-updates) section—for example `'Section:1-1'`. Then we write the new `scrollY` to the cache (just another term for the store).

Now let’s add a `<Mutation>` component so that we can call the mutation:

[`src/components/Section.js`](https://github.com/GraphQLGuide/guide/compare/19_0.2.0...20_0.2.0)

```js
Section.propTypes = {
  ...
  setScrollPosition: PropTypes.func.isRequired
}

const SET_SECTION_SCROLL_MUTATION = gql`
  mutation SetSectionScroll($id: String!, $scrollY: Int!) {
    setSectionScroll(id: $id, scrollY: $scrollY) @client
  }
`

const SectionWithData = ({ location: { state, pathname } }) => {
  ...
  <Mutation mutation={SET_SECTION_SCROLL_MUTATION}>
    {setScrollPosition => (
      <Section
        {...createProps(queryInfo)}
        viewedSection={viewedSection}
        setScrollPosition={setScrollPosition}
      />
    )}
  </Mutation>
}
```

Note the `@client` in the document: `setSectionScroll(id: $id, scrollY: $scrollY) @client`. It tells the state link to resolve the mutation on the client instead of passing it on to the server.

Now we need `<Section>` to call `setScrollPosition()`, which means we need a scroll handler:

```js
import debounce from 'lodash/debounce'

class Section extends Component {
  ...

  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll)

    if (this.props.section) {
      this.viewedSection(this.props.section.id)
    }
  }

  componentWillUnmount() {
    clearTimeout(this.timeoutID)
    window.removeEventListener('scroll', this.handleScroll)
  }

  handleScroll = debounce(() => {
    if (this.props.section.scrollY === window.scrollY) {
      return
    }

    this.props.setScrollPosition({
      variables: {
        id: this.props.section.id,
        scrollY: window.scrollY
      }
    })
  }, 1000)

  ...
}
```

When the component mounts, we add the scroll listener, and on unmount, we remove the listener. For performance, we [debounce](https://css-tricks.com/the-difference-between-throttling-and-debouncing/) the listener (we prevent it from being called continuously, waiting until the user has stopped scrolling for a second). Then inside the listener, we call the mutation (first checking to make sure the `scrollY` has changed).

It now works! Well, at least the mutation gets called. Which we wouldn’t know was happening correctly unless we looked at the devtools mutation log and cache:

![Mutation log with SetSectionScroll](img/mutation-log.png)

![Section:preface in the cache with a scrollY field](img/scrollY-in-cache.png)

What’s left is: when the section changes, updating the scroll position to the new section’s `scrollY`. For that, we have to add it to our section queries:

```js
Section.propTypes = {
  section: PropTypes.shape({
    ...
    scrollY: PropTypes.number
  }),
  ...
}

const SECTION_BY_ID_QUERY = gql`
  query SectionContent($id: String!) {
    section(id: $id) {
      id
      content
      views
      scrollY @client
    }
  }
`

const SECTION_BY_CHAPTER_TITLE_QUERY = gql`
  query SectionByChapterTitle($title: String!) {
    chapterByTitle(title: $title) {
      title
      section(number: 1) {
        id
        content
        views
        scrollY @client
      }
    }
  }
`

const SECTION_BY_NUMBER_QUERY = gql`
  query SectionByNumber($chapterNumber: Int!, $sectionNumber: Int!) {
    chapterByNumber(number: $chapterNumber) {
      number
      section(number: $sectionNumber) {
        id
        number
        title
        content
        views
        scrollY @client
      }
    }
  }
`

const SectionWithData = ({ location: { state, pathname } }) => {
  ...

  if (state) {
    query = SECTION_BY_ID_QUERY
    variables = { id: state.section.id }
    createProps = ({ data, loading }) => ({
      section: {
        ...state.section,
        content: get(data, 'section.content'),
        views: get(data, 'section.views'),
        scrollY: get(data, 'section.scrollY')
      },
      chapter: state.chapter,
      loading
    })
  }
  ...
}
```

And then use the new `section.scrollY` prop inside of `<Section>`:

```js
class Section extends Component {
  ...

  updateScrollPosition = () => {
    window.scrollTo(0, this.props.section.scrollY)
  }

  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll)

    if (this.props.section) {
      this.viewedSection(this.props.section.id)
      this.updateScrollPosition()
    }
  }

  componentDidUpdate(prevProps) {
    if (!this.props.section) {
      return
    }

    const { id } = this.props.section
    const sectionChanged = get(prevProps, 'section.id') !== id

    if (sectionChanged) {
      this.viewedSection(id)
      this.updateScrollPosition()
    }
  }

  ...
}
```

We call our new `updateScrollPosition()` method when we first mount and when the section changes. If we look back at the browser, we’ll see a lot of errors. Above the errors is a warning:

```
Missing field scrollY in {
  "id": "1-7",
  "content": ...
```

Apollo is trying to read `scrollY` from a section in the cache and can’t find it. We can fix this by giving a default value for `scrollY`, which we do in a resolver:

[`src/lib/apollo.js`](https://github.com/GraphQLGuide/guide/compare/19_0.2.0...20_0.2.0)

```js
export const apollo = new ApolloClient({
  ...
  resolvers: {
    Section: {
      scrollY: () => 0
    },
    Mutation: { ... }
  }
})
```

> We can’t use `cache.writeData()` like we did with `loginInProgress` because `scrollY` isn’t a single field at the top level—we need it to default to 0 for any `Section` object.

Now Apollo will first look in the store for a `Section`’s `scrollY`, and if it’s not there, fall back to the resolver that always returns zero.

We can test to see if everything’s working: when we load the preface, scroll down, and click “Introduction”, we see that the scroll position is at the top, and then when we click “Preface”, the scroll position goes back down to where we were!

Looking back, we can see how local mutations provided more structure than direct writes, which could be helpful down the road. Our teammates or our future (forgetful) selves can look at our `SET_SECTION_SCROLL_MUTATION` and see what function and arguments that `<Mutation>` provides, whereas with direct writes, we might have to look for how a piece of local state is used (read from the store) in order to figure out what to write to the store. Our future selves can also look at the `withClientState()` call in order to see all the options for local mutations, or can look at devtools to see the entire schema, with local mutations included at the bottom of the `Mutation` type:

![Devtools schema with the setSectionScroll local mutation](img/schema-local-mutation.png)

The other reason to use local mutations is when we need to read from the store in order to write. We didn’t need to with `setSectionScroll`, but if we had a `clapForSection` mutation, we would:

```js
export const apollo = new ApolloClient({
  ...
  resolvers: {
    ...
    Mutation: {
      clapForSection: (_, { id }, { cache, getCacheKey }) => {
        const cacheKey = getCacheKey({ __typename: 'Section', id })
        const fragment = gql`
          fragment clap on Section {
            claps
          }
        `
        const section = cache.readFragment({ fragment, id: cacheKey })

        cache.writeFragment({ 
          fragment, 
          id: cacheKey, 
          data: {
            claps: section.claps + 1
          }
        })
        return true
      }
    }
  }
})
```

Here we read a fragment containing `claps`, the field we need, and then we write to the store the previous `claps` plus 1. We’re using [`cache.writeFragment`](https://www.apollographql.com/docs/link/links/state.html#write-fragment), which is like `cache.writeData`, but validates the `data` argument to make sure it matches the `fragment` argument.

## REST

> If you’re jumping in here, `git checkout 20_0.2.0` (tag [20_0.2.0](https://github.com/GraphQLGuide/guide/tree/20_0.2.0), or compare [20...21](https://github.com/GraphQLGuide/guide/compare/20_0.2.0...21_0.2.0))

You might be thinking, “What is a section on REST doing in a chapter on GraphQL client dev??” The thing is, not all of our colleagues have seen the light of GraphQL yet, so they’re still making REST APIs! 😉 And we might want to use them in our app. The common solution is for your backend GraphQL server to proxy the REST API. For example, the server will add a query to the schema:

```gql
type Query {
  githubStars
  ...
  latestSatelliteImage(lon: Float!, lat: Float!, sizeInDegrees: Float): String
}
```

And we would write our client query:

```gql
query WhereAmI {
  latestSatelliteImage(lon: -73.94, lat: 40.7, sizeInDegrees: 0.3)
}
```

And when the server received our query, it would send this GET request to NASA:

https://api.nasa.gov/planetary/earth/imagery/?lon=-73.94&lat=40.7&dim=0.3&api_key=DEMO_KEY

The server would get back a URL of an image, which it would return to us, which we would put in the `src` of an `<img>` tag:

![Satellite image of Brooklyn and Manhattan](/img/satellite-image.png)

So that’s how proxying through our GraphQL backend works (and we’ll go into more detail in the server chapter). But what if our backend can’t proxy the REST API? Maybe we don’t have control over the backend, or maybe some less common reason applies, like needing to reduce load on the server or needing better latency (proxying through the server is slightly slower). In that case, we can use [`apollo-link-rest`](https://www.apollographql.com/docs/link/links/rest.html) to send some of our GraphQL queries as REST requests to a REST API instead of to our GraphQL server!

We need to find a REST API to use in our Guide app so that we can learn by example in this section of the book 😜. Displaying a satellite image isn’t useful, but displaying the temperature in the header might conceivably be useful (albeit completely unrelated to GraphQL 😄). If we google “weather api”, the first result is OpenWeatherMap, and we see that it’s free to use—great. Now we want to open up Playground to look at the OpenWeatherMap’s schema to figure out which query to use. But it’s a REST API! And REST doesn’t have a specified way of reporting what the API can do, so we can’t have a standard tool like Playground that shows us. So we have to read their docs. Let’s use their [current weather data](https://openweathermap.org/current) endpoint, `api.openweathermap.org/data/2.5/weather`, which looks like it has a number of options for specifying the location with query parameters: 

- `?q=[city name]`
- `?id=[city id]`
- `?lat=[latitude]&lon=[longitude]`
- `?zip=[zip code]`

Which one can we use? We don’t know the client’s city or GPS coordinates or zip code... so at the moment, none of them! There are a couple of ways, though, to get the user’s location: 

- Query an IP geolocation API, which looks up the client’s IP in a database and returns that IP’s city and approximate coordinates.
- Use the web standard [geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API), which according to [caniuse](https://caniuse.com/#search=geolocation) works in all browsers after IE 8! Except for Opera Mini 😄.

The browser API is more precise, easier to code, and gets the user’s consent via a built-in permission dialog. So let’s do that. All we need to do is just `navigator.geolocation.getCurrentPosition`, and after the user approves, we get the coordinates in a callback:

```js
window.navigator.geolocation.getCurrentPosition(
  ({ coords: { latitude, longitude } }) => {
    console.log(latitude, longitude)
    // logs: 40.7 -73.94
  }
)
```

Now we have numbers to put into our URI format, which was:

`api.openweathermap.org/data/2.5/weather?lat=[latitude]&lon=[longitude]`

And we also need an API key, which their docs say should go in an `appid` query param. The full URL, broken down:

```
http://
api.openweathermap.org
/data/2.5/weather
?lat=40.7
&lon=-73.94
&appid=4fb00091f111862bed77432aead33d04
```

And the link:

[http://api.openweathermap.org/data/2.5/weather?lat=40.7&lon=-73.94&appid=4fb00091f111862bed77432aead33d04](http://api.openweathermap.org/data/2.5/weather?lat=40.7&lon=-73.94&appid=4fb00091f111862bed77432aead33d04)

> If this API key is over its limit, you can [get a free one here](https://home.openweathermap.org/users/sign_up).

We get a response like this:

```json
{
  "coord": { "lon": -73.94, "lat": 40.7 },
  "weather": [
    {
      "id": 803,
      "main": "Clouds",
      "description": "broken clouds",
      "icon": "04n"
    }
  ],
  "base": "stations",
  "main": {
    "temp": 283.59,
    "pressure": 1024,
    "humidity": 66,
    "temp_min": 280.95,
    "temp_max": 285.95
  },
  "visibility": 16093,
  "wind": { "speed": 2.26, "deg": 235.503 },
  "clouds": { "all": 75 },
  "dt": 1539575760,
  "sys": {
    "type": 1,
    "id": 2121,
    "message": 0.0044,
    "country": "US",
    "sunrise": 1539601626,
    "sunset": 1539641711
  },
  "id": 5125125,
  "name": "Long Island City",
  "cod": 200
}
```

That’s a lot of stuff. Since it’s not GraphQL, we didn’t know what we were going to get back until we tried it, unless we were able to find it in their docs (which, eventually, author Loren did—under the heading “Weather parameters in API respond”). Looking through the response JSON, we find `main.temp`, which is a weirdly high number, so we might suspect it’s Kelvin, and we can search the docs to confirm. (In a GraphQL API, this could have been included in a schema comment, and we wouldn’t have had to search 😎.) 

If we didn’t have Apollo, we would use [`fetch()`](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch) or [`axios.get()`](https://github.com/axios/axios#example) to make the HTTP request:

```js
const weatherEndpoint = 'http://api.openweathermap.org/...'
const response = await fetch(weatherEndpoint)
const data = await response.json();
console.log(`It is ${data.main.temp} degrees Kelvin`);
```

[Run in browser](https://codesandbox.io/s/814v12k739?expanddevtools=1&module=%2Fsrc%2Findex.js)

And we would use component lifecycle methods and `setState` to get the returned data into our JSX. Or if we wanted the data cached so that we can use it in other components or on future instances of the current component, or if we wanted all of our data fetching logic separated from our presentational components, we might use [Redux](https://redux.js.org/) instead.

However, with [`apollo-link-rest`](https://www.apollographql.com/docs/link/links/rest.html) we can get Apollo to make the HTTP request for us, cache the response data for future use, and provide the data to our components. First, we set up the link:

[`src/lib/apollo.js`](https://github.com/GraphQLGuide/guide/compare/20_0.2.0...21_0.2.0)

```js
import { ApolloLink, split } from 'apollo-link'
import { RestLink } from 'apollo-link-rest'

...

const restLink = new RestLink({
  uri: 'https://api.openweathermap.org/data/2.5/'
})

const link = ApolloLink.from([errorLink, restLink, networkLink])
```

Since requests flow from left to right in the link chain, we want our `restLink` to be to the left of `networkLink` (it won’t pass on REST requests to `networkLink`, which would send them to our GraphQL server). And since responses (and errors) flow from right to left, we want `restLink` to be to the right of `errorLink` so that errors from `restLink` go through `errorLink`.

Let’s add a temperature component in the header:

[`src/components/App.js`](https://github.com/GraphQLGuide/guide/compare/20_0.2.0...21_0.2.0)

```js
import CurrentTemperature from './CurrentTemperature'

...

<header className="App-header">
  <StarCount />
  <Link ... />
  <CurrentUser />
  <CurrentTemperature />
</header>
```

And now for its implementation. Let’s start with the query:

```gql
{
  weather(lat: $lat, lon: $lon)
    @rest(
      type: "WeatherReport"
      path: "weather?appid=4fb00091f111862bed77432aead33d04&{args}"
    ) {
    main
  }
}
```

Anything with the `@rest` [directive](2.md#directives) `apollo-link-rest` will resolve itself. We’ve already configured the link with the base of the URI, so here we give the rest of it. Since we’re getting back an object, we also need to make up a name for what the object’s type will be in the Apollo store. And we want the `"main"` attribute from the JSON response, so `{ main }` is our selection set.

If we want to be even more explicit about which data we’re using, we could select just `main.temp` instead of the whole `main` object. But when we want to select fields in objects, we need the object to have a type, so we add an `@type` directive:

```gql
query TemperatureQuery {
  weather(lat: $lat, lon: $lon)
    @rest(
      type: "WeatherReport"
      path: "weather?appid=4fb00091f111862bed77432aead33d04&{args}"
    ) {
    main @type(name: "WeatherMain") {
      temp
    }
  }
}
```

Now let’s think about the UX. At some point we need to call `window.navigator.geolocation.getCurrentPosition`, after which the browser prompts the user to share their location. We don’t want to annoy users with this prompt every time they use the app, so let’s start out with a button and go through these steps:

- Display location button
- User clicks button and we request their location from the browser
- User gives permission through browser dialog
- We receive the location and make the query
- We receive the query results and display them

Here’s the shell of our component with that logic and our lat/lon state:

[`src/components/CurrentTemperature.js`](https://github.com/GraphQLGuide/guide/compare/20_0.2.0...21_0.2.0)

```js
import React, { Component } from 'react'
import { Query } from 'react-apollo'
import gql from 'graphql-tag'
import IconButton from '@material-ui/core/IconButton'
import MyLocation from '@material-ui/icons/MyLocation'

class CurrentTemperature extends Component {
  state = {
    lat: null,
    lon: null
  }

  requestLocation = () => { ... }

  render() {
    const dontHaveLocationYet = !this.state.lat

    return (
      <div className="Weather">
        <Query
          query={TEMPERATURE_QUERY}
          skip={dontHaveLocationYet}
          variables={{ lat: this.state.lat, lon: this.state.lon }}
        >
          {({ data, loading }) => {
            if (dontHaveLocationYet) {
              return (
                <IconButton
                  className="Weather-get-location"
                  onClick={this.requestLocation}
                  color="inherit"
                >
                  <MyLocation />
                </IconButton>
              )
            }

            return data.weather.main.temp
          }}
        </Query>
      </div>
    )
  }
}

const TEMPERATURE_QUERY = gql`
  query TemperatureQuery {
    weather(lat: $lat, lon: $lon)
      @rest(
        type: "WeatherReport"
        path: "weather?appid=4fb00091f111862bed77432aead33d04&{args}"
      ) {
      main
    }
  }
`

export default CurrentTemperature
```

When we don’t yet have the user’s location, we skip running the query and show the location button. Once we do have the location, we pass it to our query and display `data.weather.main.temp`. 

![A location button displayed in the header](/img/location-button.png)

It would be nice to display a spinner while we’re waiting for the location and the weather API, so let’s fill in `requestLocation()` and add `gettingPosition` to the state:

```js
class CurrentTemperature extends Component {
  state = {
    lat: null,
    lon: null,
    gettingPosition: false
  }

  requestLocation = () => {
    this.setState({ gettingPosition: true })
    window.navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        this.setState({ lat: latitude, lon: longitude, gettingPosition: false })
      }
    )
  }

  render() {
    const dontHaveLocationYet = !this.state.lat

    return (
      <div className="Weather">
        <Query
          query={TEMPERATURE_QUERY}
          skip={dontHaveLocationYet}
          variables={{ lat: this.state.lat, lon: this.state.lon }}
        >
          {({ data, loading }) => {
            if (loading || this.state.gettingPosition) {
              return <div className="Spinner" />
            }
```

![Loading spinner in place of the location button](/img/loading-temperature.png)

And now it works, and we’re reminded that the API returns Kelvin, so let’s show it in Celsius and Fahrenheit (and default to the former, because it’s just silly that the latter is still in use 😆):

```js
const kelvinToCelsius = kelvin => Math.round(kelvin - 273.15)
const kelvinToFahrenheit = kelvin =>
  Math.round((kelvin - 273.15) * (9 / 5) + 32)

class CurrentTemperature extends Component {
  state = {
    lat: null,
    lon: null,
    gettingPosition: false,
    displayInCelsius: true
  }

  requestLocation = () => { ... }

  toggleDisplayFormat = () => {
    this.setState({
      displayInCelsius: !this.state.displayInCelsius
    })
  }

  render() {
    const dontHaveLocationYet = !this.state.lat

    return (
      <div className="Weather">
        <Query
          query={TEMPERATURE_QUERY}
          skip={dontHaveLocationYet}
          variables={{ lat: this.state.lat, lon: this.state.lon }}
        >
          {({ data, loading }) => {
            ...

            const kelvin = data.weather.main.temp
            const formattedTemp = this.state.displayInCelsius
              ? `${kelvinToCelsius(kelvin)} °C`
              : `${kelvinToFahrenheit(kelvin)} °F`

            return (
              <IconButton onClick={this.toggleDisplayFormat}>
                {formattedTemp}
              </IconButton>
            )
          }}
        </Query>
      </div>
    )
  }
}
```

![Temperature in Celsius](/img/temperature.png)

To recap, we added `@rest` to our query, which made our REST link intercept the query before it was sent to our GraphQL server. The REST link returns data from the weather REST API, which gets saved to our store and provided to our component. We get all the nice things we’re used to in Apollo, like declarative data fetching and loading state. And because the data is in the store, we can reuse the data in other components, and we can update the data (through requerying or direct writes), and our components will automatically update.

## Review subscriptions

> If you’re jumping in here, `git checkout 21_0.2.0` (tag [21_0.2.0](https://github.com/GraphQLGuide/guide/tree/21_0.2.0), or compare [21...22](https://github.com/GraphQLGuide/guide/compare/21_0.2.0...22_0.2.0))

Section contents:

* [Subscription component](6.md#subscription-component)
* [Add new reviews](6.md#add-new-reviews)
* [Update on edit and delete](6.md#update-on-edit-and-delete)

Early on in this chapter we set up our [first subscription](#subscriptions) for an updated GitHub star count. That was a very simple example—each event we received from the server contained a single integer:

```gql
type Subscription {
  githubStars: Int
}
```

In this section we’ll see what it’s like to work with more complex subscriptions:

```gql
type Subscription {
  reviewCreated: Review
  reviewUpdated: Review
  reviewDeleted: ObjID
}
```

The first subscription sends a response event when someone creates a new review. `reviewUpdated` fires whenever a review’s text or stars are edited, and `reviewDeleted` fires when one is deleted. For the first two, the events contain the review created/updated. For the last, it contains just the review’s id.

### Subscription component

The first feature we’ll build is a notification when the user is on the reviews page and a new review is created:

[`src/components/Reviews.js`](https://github.com/GraphQLGuide/guide/compare/21_0.2.0...22_0.2.0)

```js
import ReviewCreatedNotification from './ReviewCreatedNotification'

<main className="Reviews mui-fixed">
  ...
  <ReviewList user={user} orderBy={this.state.orderBy} />
  <ReviewCreatedNotification />
  ...
</main>
```

Now that we’ve got a `<ReviewCreatedNotification>` on the reviews page, what do we put in it? Apollo has a [`<Subscription>` component](https://www.apollographql.com/docs/react/api/react-apollo.html#subscription) that provides new data to its child whenever an event is received from the server:

[`src/components/ReviewCreatedNotification.js`](https://github.com/GraphQLGuide/guide/compare/21_0.2.0...22_0.2.0)

```js
import React, { Component } from 'react'
import { Subscription } from 'react-apollo'

import { ON_REVIEW_CREATED_SUBSCRIPTION } from '../graphql/Review'

class ReviewCreatedNotification extends Component {
  render() {
    return (
      <Subscription
        subscription={ON_REVIEW_CREATED_SUBSCRIPTION}
      >
        {({ data }) => console.log(data) || null}
      </Subscription>
    )
  }
}

export default ReviewCreatedNotification
```

We’ll see what the event looks like in a moment, but first we need the subscription itself:

[`src/graphql/Review.js`](https://github.com/GraphQLGuide/guide/compare/21_0.2.0...22_0.2.0)

```js
export const ON_REVIEW_CREATED_SUBSCRIPTION = gql`
  subscription onReviewCreated {
    reviewCreated {
      ...ReviewEntry
    }
  }
  ${REVIEW_ENTRY}
`
```

And now we can see what happens when we create a review:

- Apollo sends the `createReview` mutation to the server
- The server sends a subscription response event with data
- The `<Subscription>` component gives us the data, and we log it:

```json
{
  "reviewCreated": {
    "id": "5c4b732bcd0a7103471de19b",
    "text": "It's good",
    "stars": 4,
    "createdAt": 1548448555245,
    "favorited": false,
    "author": {
      "id": "5a3cd78368e9c40096ab5e3f",
      "name": "Loren Sands-Ramshaw",
      "photo": "https://avatars2.githubusercontent.com/u/251288?v=4",
      "username": "lorensr",
      "__typename": "User"
    },
    "__typename": "Review"
  }
}
```

The data is in the same format we would expect if we made a Query named `reviewCreated`. We can also see the data arriving from the server. First let’s see what it looks like initially by opening the Network tab of devtools, refreshing the page, scrolling down to “subscriptions” on the left, and selecting the “Frames” tab:

![Four websocket messages](img/subscription-start.png)

We see that the first message the client always sends once the websocket is established has `type: "connection_init"`. Then it sends two messages, each with an operation and sequential `id` numbers. They are `type: "start"` because they are starting subscriptions. The message with `"id": "1"` has our GitHub stars subscription and the message with `id: "2"` has our `onReviewCreated` subscription, which we see in `payload.query`. There’s also a `payload.variables` field that we’re not using. If we were subscribing to a review’s comments, we might use a `commentCreated(review: ObjID!): Comment` subscription, in which case we would see:

```js
{
  id: "3",
  payload: {
    operationName: "onCommentCreated",
    query: "subscription onCommentCreated {↵ commentCreated(review: $review) {↵ id↵ text↵} }",
    variables: { review: "5c4bb280cd0a7103471de19e" }
  },
  type: "start"
}
```

The last websocket message is from the server and has `type: "connection_ack"`, which means that the server acknowledges that it has received the `connection_init` message.

Now let’s create a review and see what happens:

![Message containing the new review appears](img/websocket-data.png)

We receive another message from the server—this one with `type: "data"`, meaning it contains data! 😜 The ID is 2, telling us that it’s an event from the `onReviewCreated` subscription (which we sent to the server earlier with the matching `id: "2"`). And this time the `payload` is the same `data` object that the `<Subscription>` component gave us and we logged to the console. 

But our users usually won’t see messages logged to the console, so let’s think about how we want to display the new review notification to the user. We could `window.alert()`, but that requires dismissal and is annoying 😆. We could put it on the page—for example in the header—but then the notification would be stuck there until either a new subscription event arrived or the page got re-rendered. It doesn’t need to be shown for long, taking up the user’s brainspace and annoying them (at least Loren is annoyed when he can’t dismiss a notification 😄). So let’s show a temporary message somewhere off to the side. We can search the Material UI [component library](https://material-ui.com/demos/app-bar/) and find the component meant for this purpose—the [Snackbar](https://material-ui.com/demos/snackbars/). We control whether it’s visible with an `open` prop, so we need state for that, and the `onClose` prop gets called when the user dismisses the Snackbar.

[`src/components/ReviewCreatedNotification.js`](https://github.com/GraphQLGuide/guide/compare/21_0.2.0...22_0.2.0)

```js
import Snackbar from '@material-ui/core/Snackbar'

class ReviewCreatedNotification extends Component {
  state = {
    isOpen: false
  }

  close = () => {
    this.setState({ isOpen: false })
  }

  open = () => {
    this.setState({ isOpen: true })
    setTimeout(this.close, 5000)
  }

  render() {
    return (
      <Subscription
        subscription={ON_REVIEW_CREATED_SUBSCRIPTION}
        onSubscriptionData={this.open}
      >
        {({ data }) =>
          data && data.reviewCreated ? (
            <Snackbar
              anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
              open={this.state.isOpen}
              onClose={this.close}
              message={`New review from ${data.reviewCreated.author.name}: ${
                data.reviewCreated.text
              }`}
            />
          ) : null
        }
      </Subscription>
    )
  }
}
```

We use `isOpen` for the state. We want to set `isOpen` to true whenever we receive a new event, so we use `<Subscription>`’s `onSubscriptionData` prop. And we want to automatically dismiss the Snackbar after a few seconds, so we use a `setTimeout()`. Now when we create a review, a message slides up from the bottom of the window, stays for few seconds, and then slides back down!

![Review created notification](/img/review-created.gif)
[*gif: Review created notification*](http://res.cloudinary.com/graphql/guide/review-created.gif)

### Add new reviews

Currently when we create a review, the new review card appears at the top of the list on our page because of our optimistic update. But other users just see the notification—the review card doesn’t appear in the list. Let’s figure out how to get it there. One option is to turn on polling in `ReviewList.js`:

```js
const withReviews = graphql(REVIEWS_QUERY, {
  options: ({ orderBy }) => ({
    pollInterval: 1000,
    errorPolicy: 'all',
    variables: { limit: 10, orderBy },
    notifyOnNetworkStatusChange: true
  }),
```

That’s usually the easiest and best way. But this section is on subscriptions 😄. If at some point polling becomes a problem from a resource-usage perspective (usually it won’t) or isn’t fast enough (for example with games or chat apps), we’ll want to use a subscription. We already have a subscription—the one created by our `<Subscription>` component. We could use it for two purposes. The `onSubscriptionData` prop is called with an argument of the form: `{ client, subscriptionData: { loading, data, error } }`, so we could get the new review (`subscriptionData.data.reviewCreated`) and write it to the store using `client.writeQuery()`. However, there’s another way to use a subscription that’s better suited to this case: the same `subscribeToMore` prop we used for `StarCount.js`. The query we want to `subscribeToMore` for is `REVIEWS_QUERY`, our list of reviews. We get the previous query result and the subscription data, and then we return a new query result:

[`src/components/ReviewList.js`](https://github.com/GraphQLGuide/guide/compare/21_0.2.0...22_0.2.0)

```js
import {
  REVIEWS_QUERY,
  REVIEW_ENTRY,
  ON_REVIEW_CREATED_SUBSCRIPTION
} from '../graphql/Review'

class ReviewList extends Component {
  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll)
    this.props.subscribeToReviewUpdates()
  }
  ...
}

const withReviews = graphql(REVIEWS_QUERY, {
  options: ...,
  props: ({
    data: { reviews, fetchMore, networkStatus, subscribeToMore },
    ownProps: { orderBy }
  }) => ({
    reviews,
    networkStatus,
    loadMoreReviews: ...,
    subscribeToReviewUpdates: () => {
      subscribeToMore({
        document: ON_REVIEW_CREATED_SUBSCRIPTION,
        updateQuery: (prev, { subscriptionData }) => {
          // Assuming infinite reviews, we don't need to add new reviews to
          // Oldest list
          if (orderBy === 'createdAt_ASC') {
            return prev
          }

          const newReview = subscriptionData.data.reviewCreated
          return {
            reviews: [newReview, ...prev.reviews]
          }
        }
      })
    }
  })
})
```

Now when we’re viewing the most recent reviews (`createdAt_DESC`) and receive a subscription event, we add the new review to the front of the list of reviews, and it appears first on the page. We can test this out by opening a second browser tab, creating a new review in that tab, and seeing it immediately appear in the first tab.

### Update on edit and delete

It would also be nice to update the reviews when someone else edits or deletes them. If we look at the Playground schema, we can see that the server has more subscription options related to reviews: `reviewUpdated: Review` and `reviewDeleted: ObjID`. So let’s use ’em! Step 1 is writing the subscription documents and step 2 is adding more calls to `subscribeToMore`. (`subscribeToMore` doesn’t mean that we’re necessarily subscribing to new documents—just that we’re subscribing to more related data, and in this case the data is either the review that was updated or the ID of the review that was deleted.) First, the documents:

[`src/graphql/Review.js`](https://github.com/GraphQLGuide/guide/compare/21_0.2.0...22_0.2.0)

```js
export const ON_REVIEW_UPDATED_SUBSCRIPTION = gql`
  subscription onReviewUpdated {
    reviewUpdated {
      ...ReviewEntry
    }
  }
  ${REVIEW_ENTRY}
`

export const ON_REVIEW_DELETED_SUBSCRIPTION = gql`
  subscription onReviewDeleted {
    reviewDeleted
  }
`
```

Because the return type of `reviewDeleted` is a scalar (a custom one called `ObjID`), we don’t write a selection set. `subscriptionData.data.reviewDeleted` will be an `ObjID` string, not an object. Next, `subscribeToMore`:

[`src/components/ReviewList.js`](https://github.com/GraphQLGuide/guide/compare/21_0.2.0...22_0.2.0)

```js
import reject from 'lodash/reject'

import {
  REVIEWS_QUERY,
  REVIEW_ENTRY,
  ON_REVIEW_CREATED_SUBSCRIPTION,
  ON_REVIEW_UPDATED_SUBSCRIPTION,
  ON_REVIEW_DELETED_SUBSCRIPTION
} from '../graphql/Review'

...

const withReviews = graphql(REVIEWS_QUERY, {
  options: ...,
  props: ({
    data: { reviews, fetchMore, networkStatus, subscribeToMore },
    ownProps: { orderBy }
  }) => ({
    reviews,
    networkStatus,
    loadMoreReviews: ...,
    subscribeToReviewUpdates: () => {
      subscribeToMore({
        document: ON_REVIEW_CREATED_SUBSCRIPTION,
        updateQuery: ...
      })
      subscribeToMore({
        document: ON_REVIEW_UPDATED_SUBSCRIPTION,
        updateQuery: (prev, { subscriptionData }) => {
          const updatedReview = subscriptionData.data.reviewUpdated
          return {
            reviews: prev.reviews.map(review =>
              review.id === updatedReview.id ? updatedReview : review
            )
          }
        }
      })
      subscribeToMore({
        document: ON_REVIEW_DELETED_SUBSCRIPTION,
        updateQuery: (prev, { subscriptionData }) => {
          const deletedId = subscriptionData.data.reviewDeleted
          return {
            reviews: reject(prev.reviews, { id: deletedId })
          }
        }
      })
    }
  })
})
```

For review updates, we replace the review in the list from the store (`prev`) with the updated one we get from the subscription. For deletions, we remove it from the list.

## Prefetching

Background: [browser performance](bg.md#browser-performance)

Section contents:

* [On mouseover](6.md#on-mouseover)
* [Cache redirects](6.md#cache-redirects)

Prefetching is fetching data from the server before we need it so that when we do need it, we already have it on the client and can use it right away. This is great for UX because the user doesn’t have to look at a loading screen waiting for data to load. It’s a common pattern—both [Gatsby](https://www.gatsbyjs.org/docs/gatsby-link/) and [Next.js](https://nextjs.org/docs/#prefetching-pages) prefetch entire webpages with their `<Link>` components.

The most useful thing to prefetch in our app is the section content! We can prefetch just by making a query with the Apollo client:

```js
client.query({
  query: ...
})
```

This will place the results in the store, so that when we render a `<Section>` and it makes a query for section data, it will immediately find the data in the store. We could prefetch all the sections using the `sections` root query:

```js
import { withApollo } from 'react-apollo'

class App extends Component {
  componentDidMount() {
    requestIdleCallback(() => {
      this.props.client.query({
        query: ALL_SECTIONS
      })
    })
  }

  render() { ... }
}

const ALL_SECTIONS = gql`
  query AllSections {
    sections {
      id
      content
      views
    }
  }
`

export default withApollo(App)
```

For the query selection set, we check the queries in `Section.js` and see that it needs the `content` and `views`. We use `withApollo` to get access to the `client`, and we use `requestIdleCallback()` (which calls the callback when the browser isn’t busy) so that we don’t delay any of the work involved with the initial app render. When the `AllSections` query response arrives, the data is put in the store, and any future render of `<Section>` is immediate, without need to talk to the server.

### On mouseover

> If you’re jumping in here, `git checkout 22_0.2.0` (tag [22_0.2.0](https://github.com/GraphQLGuide/guide/tree/22_0.2.0), or compare [22...23](https://github.com/GraphQLGuide/guide/compare/22_0.2.0...23_0.2.0))

The potential issue with the above approach is how much data we’re prefetching—the entire content of the book. The more data we fetch, the more work the server has to do, and the more work the client has to do—first to receive and store it, and then later to interact with the larger store. The client’s workload is more likely to become an issue because Apollo runs in the main thread (it interacts with React, which interacts with the DOM, which is in the main thread), and things it does might delay user interaction or freeze animations (see [Background > Browser performance](bg.md#browser-performance) for more info). It takes longer for Apollo to query and update the store when there’s more data in the store.

So usually instead of prefetching all of the data we could possibly need, we selectively prefetch some of it. One common way to do this is prefetching when the user mouses over something clickable. We might know that we’ll need certain data if they click that particular link or button, in which case we can fetch the data when the mouseover happens instead of waiting for the click. It’s possible that they won’t click, in which case we’ll have extra data that we don’t need, but this usually isn’t a problem.

For the Guide, when a user hovers over a link in the table of contents, we know what data we’ll need—that section’s contents. We can export the query for section contents from `Section.js` and use it in `TableOfContents.js` to make the query. In order to make the query, we need access to the client instance, so we use `withApollo()`:

[`src/components/TableOfContents.js`](https://github.com/GraphQLGuide/guide/compare/22_0.2.0...23_0.2.0)

```js
import { graphql, withApollo, compose } from 'react-apollo'
import { ApolloClient } from 'apollo-client'

TableOfContents.propTypes = {
  ...
  client: PropTypes.instanceOf(ApolloClient).isRequired
}

export default compose(
  withData,
  withApollo
)(TableOfContents)
```

Now we can make the query inside the `onMouseOver` function:

```js
import { SECTION_BY_ID_QUERY } from './Section'

const TableOfContents = ({ chapters, loading, client }) => (
  <nav className="TableOfContents">
    ...
    <NavLink
      to={{
        pathname: slugify(chapter),
        state: { chapter, section: chapter.sections[0] }
      }}
      className="TableOfContents-chapter-link"
      activeClassName="active"
      isActive={(match, location) => {
        const rootPath = location.pathname.split('/')[1]
        return rootPath.includes(withHyphens(chapter.title))
      }}
      onMouseOver={() => {
        client.query({
          query: SECTION_BY_ID_QUERY,
          variables: {
            id: chapter.sections[0].id
          }
        })
      }}
    >
      ...
        <NavLink
          to={{
            pathname: slugify(chapter, section),
            state: { chapter, section }
          }}
          className="TableOfContents-section-link"
          activeClassName="active"
          onMouseOver={() => {
            client.query({
              query: SECTION_BY_ID_QUERY,
              variables: {
                id: section.id
              }
            })
          }}
        >
  </nav>
)
```

We have two `onMouseOver`s: When mousing over a chapter link, we query for the first section of that chapter. When mousing over a section link, we query for that section. 

We also need to add the export:

[`src/components/Section.js`](https://github.com/GraphQLGuide/guide/compare/22_0.2.0...23_0.2.0)

```js
export const SECTION_BY_ID_QUERY = gql`
  query SectionContent($id: String!) {
    section(id: $id) {
      id
      content
      views
      scrollY @client
    }
  }
`
```

And now it works! When the user clicks the link, `<Section>` makes a new query, but instantly renders the section content because it’s already in the store. We can check this in two ways:

- Opening the devtools Network tab and watching when the `SectionContent` query is sent to the server.
- Seeing whether the loading skeleton appears when we hover over a new link for a second before clicking, versus immediately clicking it. If we want to see the difference more clearly, we can slow down the connection to “Fast 3G” in the devtools Network tab.

Depending on how long we hover, we may still see the loading skeleton: for example, if it takes three seconds to load when we immediately click, and then we hover on the next link for two seconds before clicking, we will still see the skeleton for one second.

One issue to consider is whether we’re making a lot of extra queries, because users may mouse over sections that we’ve already loaded. But the default Apollo client network policy is [`cache-first`](https://www.apollographql.com/docs/react/api/react-apollo.html#graphql-config-options-fetchPolicy), which means that if Apollo finds the query results in the cache, it won’t send the query to the server. We’re using the default, so we don’t need to do anything, but if we had set a different default in the [`ApolloClient` constructor](https://www.apollographql.com/docs/react/api/apollo-client.html#apollo-client) like this:

`src/lib/apollo.js`

```js
export const apollo = new ApolloClient({ 
  link, 
  cache,
  defaultOptions: {
    query: {
      fetchPolicy: 'cache-and-network'
    }
  }
})
```

> `cache-and-network` immediately returns any results available in the cache *and also* queries the server

then we could set a different network policy just for our prefetching:

```js
onMouseOver={() => {
  client.query({
    query: SECTION_BY_ID_QUERY,
    variables: {
      id: section.id
    },
    fetchPolicy: 'cache-first'
  })
}}
```

### Cache redirects

> If you’re jumping in here, `git checkout 23_0.2.0` (tag [23_0.2.0](https://github.com/GraphQLGuide/guide/tree/23_0.2.0), or compare [23...24](https://github.com/GraphQLGuide/guide/compare/23_0.2.0...24_0.2.0))

There are often more ways than just mouseovers to intelligently prefetch certain data. What the ways are depends on the type of app. We have to think about how the user uses the app, and what they might do next. In our app, one common action will probably be to read the next section. So a simple thing we can do is whenever we show a section, we prefetch the next section. Let’s first get the `client` instance into `<Section>`. Before we used `withApollo()`, which we could do again, but we don’t need to—our `<Section>` is inside a `<Query>`, which always provides a client instance:

[`src/components/Section.js`](https://github.com/GraphQLGuide/guide/compare/23_0.2.0...24_0.2.0)

```js
import { ApolloClient } from 'apollo-client'

class Section extends Component {
  ...
}

Section.propTypes = {
  ...
  client: PropTypes.instanceOf(ApolloClient).isRequired
}

const SectionWithData = 
  ...
    <Query query={query} variables={variables}>
      {queryInfo => (
        ...
          <Section
            {...createProps(queryInfo)}
            client={queryInfo.client}
            ...
          />
      )}
    </Query>
```

Now inside `Section`, we want to make the query on initial render and when the section changes. We’re currently repeating things inside `componentDidMount()` and `componentDidUpdate()`, so let’s refactor out a new method `onSectionChange()`:

```js
class Section extends Component {
  onSectionChange = newId => {
    this.viewedSection(newId)
    this.updateScrollPosition()
  }

  ...

  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll)

    if (this.props.section) {
      this.onSectionChange(this.props.section.id)
    }
  }

  ...

  componentDidUpdate(prevProps) {
    if (!this.props.section) {
      return
    }

    const { id } = this.props.section
    const sectionChanged = get(prevProps, 'section.id') !== id

    if (sectionChanged) {
      this.onSectionChange(id)
    }
  }
  ...
}
```

And now inside `onSectionChange()` we can do the prefetching:

```js
class Section extends Component {
  onSectionChange = newId => {
    this.viewedSection(newId)
    this.updateScrollPosition()
    this.prefetchNextSection(newId)
  }

  prefetchNextSection = currentId => {
    this.props.client.query({
      query: ...
      variables: {
        id: ...
      }
    })
  }

  ...
}
```

But what query do we make? We could take the current section ID, eg `1_3` (chapter 1, section 3) and try the next section number, eg `1-4`, and if that failed (because it was the end of the chapter), we could go to the next chapter with `2_1`. That would look something like:

```js
  prefetchNextSection = async currentId => {
    const nextSectionId = ...
    const { data } = await this.props.client.query({
      query: SECTION_BY_ID_QUERY,
      variables: {
        id: nextSectionId
      }
    })

    if (!data.section) {
      const nextChapterId = ...
      this.props.client.query({
        query: SECTION_BY_ID_QUERY,
        variables: {
          id: nextChapterId
        }
      })
    }
  }
```

[`client.query()`](https://www.apollographql.com/docs/react/api/apollo-client.html#ApolloClient.query) returns a Promise, which we can `await`, and our API resolves the `section` query to `null` when there is no such section. So when `data.section` is null, we query for the next chapter. (Alternatively, if our API instead returned a “No such section” error, we could use a try...catch statement.)

However, there’s a way to get the next section in a single query—the `Section` type has a field `next` of type `Section`! Let’s write a query for that:

```js
  prefetchNextSection = currentId => {
    this.props.client.query({
      query: NEXT_SECTION_QUERY,
      variables: {
        id: currentId
      }
    })
  }

...

const NEXT_SECTION_QUERY = gql`
  query NextSection($id: String!) {
    section(id: $id) {
      id
      next {
        id
        content
        views
        scrollY @client
      }
    }
  }
`
```

For the `next` selection set, we copy the fields from the other queries in `Section.js`, since those are the fields that will be needed if the user navigates to the next section. It now seems like we’re done, and if we look at the Network tab, we see that the prefetch query is made. We can also see in Apollo devtools that the Section object with the next section ID is in the store. However, when we navigate to the next section, the `SectionContent` query is being made!

```gql
query SectionContent($id: String!) {
  section(id: $id) {
    id
    content
    views
    scrollY @client
  }
}
```

The problem is that Apollo doesn’t have a way of knowing that the server will respond to a `section` query that has an `id` argument with the `Section` object matching that ID. We can inform Apollo of this using a [cache redirect](https://www.apollographql.com/docs/react/advanced/caching.html#cacheRedirect), which is a configuration function we provide to `InMemoryCache` that returns the cache key Apollo should look for before it sends the query to the server. If it finds an object in the store under that key, it will just return that.

[`src/lib/apollo.js`](https://github.com/GraphQLGuide/guide/compare/23_0.2.0...24_0.2.0)

```js
const cache = new InMemoryCache({
  cacheRedirects: {
    Query: {
      section: (_, { id }, { getCacheKey }) =>
        getCacheKey({ __typename: 'Section', id })
    }
  }
})
```

`getCacheKey()` formats the object into the cache key—we’re using the default cache key format, `__typename:id`, for example `Section:1-4`, which is what we see in the Cache tab of Apollo devtools.

*Now* our prefetching works. If we turn on Slow 3G in the Network tab and click on the next section, it will render immediately, because it was prefetched when the previous section rendered 😊.

## Batching

> If you’re jumping in here, `git checkout 24_0.2.0` (tag [24_0.2.0](https://github.com/GraphQLGuide/guide/tree/24_0.2.0)). We won’t be leaving the code from this section in our app, so the next section will also start at tag `24`. 

If we load the site with the Network tab of devtools open, we see a lot of requests that say “graphql” on the left—that’s the path, so the full endpoint is `api.graphql.guide/graphql`, our GraphQL API. By default, each of the GraphQL queries in our app is sent in its own HTTP request. We can look at the request payload to see which query it is, for example our simple `StarsQuery`: 

![Network tab request payload](/img/request-payload.png)

We can **batch** our initial queries into one request, which will look like this:

![Array request payload](/img/array-request-payload.png)

> We also see that the third request is to `/graphql`, but the Request Method is `OPTIONS` instead of the normal `POST`, and the status code is `204` instead of the normal `200`. This is called a **preflight** request that Chrome makes to the server to check its security policy ([CORS](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)), since it’s going to a different domain from the client (`localhost:3000`).

At first glance, it seems better to batch—fewer requests is more efficient for our browser, and it reduces the HTTP request load on our server. However, the big drawback is that we only get one response. This means that the server keeps all of our results until the last query in the batch completes, and *then* sends all the results back to us together in one response. Without batching, we get results to our faster queries faster, and those parts of the page get rendered, while the other parts stay in loading state for longer. For this reason, it’s recommended that we keep the default unbatched requests, and only try batching when we have server load issues *and* have [already made other performance improvements](https://blog.apollographql.com/batching-client-graphql-queries-a685f5bcd41b). If we ever get to that point, here’s the simple setup:

```
npm install apollo-link-batch-http
```

`src/lib/apollo.js`

```js
import { BatchHttpLink } from 'apollo-link-batch-http'

const httpLink = new BatchHttpLink({ uri: 'https://api.graphql.guide/graphql' })
```

We replace our previous `httpLink` with the link from [`apollo-link-batch-http`](https://www.apollographql.com/docs/link/links/batch-http.html). One thing you may notice in the Network tab is that soon after our initial batched request, we see another—this one only contains a single operation, named `ViewedSection`:

![Array request payload](/img/viewed-section-request.png)

The reason this wasn’t included in the initial batch request is because it happens a second later: only queries that are made within a certain window are batched together. The default `batchInterval` is 10 milliseconds, and can be changed [as an option](https://www.apollographql.com/docs/link/links/batch-http.html#options) to `BatchHttpLink()`.

If we know there are certain queries that will take longer than others, and we want them to bypass batching, we can set up both a normal http link and a batched link. Then we can use `split()` to decide which link to send a request to:

```js
const client = new ApolloClient({
  link: split(
    operation => operation.getContext().slow === true,
    httpLink, 
    batchHttpLink
  )
});

<Query query={SLOW_QUERY} context={{ slow: true }}>
<Query query={NORMAL_QUERY}>
```

We add data to the context, and then we check it inside `split()`: if the context has `slow: true`, then send via the `httpLink`. Otherwise, send via the `batchHttpLink`. 

## Persisting

> If you’re jumping in here, `git checkout 24_0.2.0` (tag [24_0.2.0](https://github.com/GraphQLGuide/guide/tree/24_0.2.0), or compare [24...25](https://github.com/GraphQLGuide/guide/compare/24_0.2.0...25_0.2.0))

The Apollo store is stored in page-specific memory. When the webpage is closed or reloaded, the memory is cleared, which means the next time our app loads, the store is empty—it has to fetch all the data it needs from the server again. **Persisting** is saving the data in the Apollo store so that on future pageloads, we can restore the data to the store, and we don’t have to fetch it. The main benefit is we can show the data to the user much faster than we could if we had to fetch it from the server. We can easily set this up with the [`apollo-cache-persist`](https://github.com/apollographql/apollo-cache-persist) package:

[`src/components/App.js`](https://github.com/GraphQLGuide/guide/compare/24_0.2.0...25_0.2.0)

```js
import { persistCache } from 'apollo-cache-persist'

import { cache } from '../lib/apollo'

persistCache({
  cache,
  storage: window.localStorage,
  maxSize: 4500000, // little less than 5 MB
  debug: true
})
```

And we need to export `cache`:

[`src/lib/apollo.js`](https://github.com/GraphQLGuide/guide/compare/24_0.2.0...25_0.2.0)

```js
export const cache = new InMemoryCache({ ... })
```

The `persistCache()` function sets up persistence. `debug: true` has it log the size of the cache whenever it’s saved. The `storage` parameter has a number of options:

- `window.localStorage`
- `window.sessionStorage`
- [localForage](https://github.com/localForage/localForage): uses WebSQL or IndexedDB when available (most browsers), and falls back to `localStorage`
- `AsyncStorage` in React Native

`sessionStorage` is rarely used, since it is cleared when the browser is closed, and we usually want to store data for a longer period. `localStorage` is simple to use and can consistently store 5–10 MB. localForage is good for complex querying and larger sets of data. However, it is generally slower than `localStorage` for simple operations (and our operation is simple: it’s just saving and getting a single piece of data—the contents of the Apollo store). We also have to import it from npm, which adds an additional [8 KB gzipped](https://bundlephobia.com/result?p=localforage@1.7.3) to our JavaScript bundle.

So we probably would only want to use localForage if we needed more than 5 MB of space. Let’s think about what kind of data our app queries for, how much space it takes up, and how much we might want of it. The largest thing the Guide queries for is section text, and according our new logging, each section (currently just a paragraph of Lorem ipsum) takes up 2 KB:

```
[apollo-cache-persist] Persisted cache of size 34902
[apollo-cache-persist] Persisted cache of size 37014
```

> The second line was printed after hovering over a section link in the table of contents.

At this rate, we would fill up the cache after loading 5000 KB / 2 KB = 2500 sections, so 5 MB is currently plenty of room for us. Let’s go with `localStorage`. 

`maxSize` is the maximum number of bytes to persist. When `maxSize` is reached, it will stop saving data changes in the current session, and the next time the app starts, the cache will be cleared. We could set a different `maxSize` depending on which browser we’re in, but for simplicity let’s just assume we’re in the [lowest-quota browser](https://www.html5rocks.com/en/tutorials/offline/quota-research/), Safari, which can store 5 MB. We set `maxSize` to 4.5 MB to leave a little room for other uses (for instance our Auth0 library uses `localStorage`, and maybe we’ll decide later that we want to use it for something else).

Alright—we’ve covered all of the arguments we used with `persistCache()` ([there are others](https://github.com/apollographql/apollo-cache-persist#additional-options) we’re not using). But we’re not done: the cache is getting persisted fine, but when a saved cache is restored on subsequent pageloads, our components are still querying, and they don’t get data until the query response comes back from the server. 

> We can verify this by changing the speed to “Slow 3G” in Network devtools and see A) the graphql requests being sent and B) both the first load and subsequent loads take a few seconds for the loading skeleton to be replaced with text.

The reason for this is that `persistCache()` takes time to complete (at least 150 ms on Loren’s computer), and by that time, `@apollo/client` has already sent off our components’ queries. And when it does complete, our components don’t know that there’s new data in the cache. So when there’s a saved cache to restore, we want to wait for `persistCache()` to complete before rendering our components and triggering their queries. Then all of our `cache-first` queries will see that the data is in the cache and use it instead of requesting it from the server. We can tell if there’s a saved cache by checking in `localStorage` for the key that `persistCache()` uses, `apollo-cache-persist`:

[`src/components/App.js`](https://github.com/GraphQLGuide/guide/compare/24_0.2.0...25_0.2.0)

```js
const cacheHasBeenSaved = !!localStorage.getItem('apollo-cache-persist')

class App extends Component {
  state = {
    loading: cacheHasBeenSaved
  }

  async componentDidMount() {
    await persistCache({
      cache,
      storage: window.localStorage,
      maxSize: 4500000, // little less than 5 MB
      debug: true
    })

    this.setState({
      loading: false
    })
  }

  render() {
    if (this.state.loading) {
      return null
    }

    return (
      <div className="App">
        ...
      </div>
    )
  }
}

export default App
```

Now let’s test it out. When we load the app for the first time, we see something like this:

```
[apollo-cache-persist] No stored cache to restore
[apollo-cache-persist] Persisted cache of size 17005
[apollo-cache-persist] Persisted cache of size 17129
```

The first message prints out on load, and the second appears a second after the page content appears, saying that the Apollo cache was saved to `localStorage` and what its size was. The third appears shortly after that, meaning the cache was re-saved, and the size only goes up by about a hundred bytes. What caused the re-save? We must have made another request to the server after the initial set of requests. We can check the Network tab to see what the last GraphQL request was, and we see that it’s the `ViewedSection` mutation. But why would that mutation change the Apollo cache? It’s not a query fetching data. Let’s look at the cache to see. In the Cache tab of Apollo devtools, there’s a `ROOT_MUTATION`:

![ROOT_MUTATION key in Apollo cache](/img/root-mutation.png)

We see that our mutation is indeed in the cache, and it resolved to a `Section` object. Is the entire cache, including mutation results, persisted? We can look at what’s saved by entering this in the browser console:

```js
JSON.parse(localStorage.getItem('apollo-cache-persist'))
```

![ROOT_MUTATION property in localStorage](/img/root-mutation-console.png)

And we see that it is present, and the `viewedSection` mutation has `type: "id"`, meaning that it has been normalized, linking to the top-level object with `id: "Section:5-1"`.

Now let’s see what happens when we reload the app. 

```
[apollo-cache-persist] Restored cache of size 17129
[apollo-cache-persist] Persisted cache of size 17129
```

The cache is restored! We can check to make sure the cache is being used to immediately provide data to our components by: 1) seeing in Network devtools that our initial batch of GraphQL requests are not being made, and 2) slowing the network speed to “Slow 3G” and seeing that there is no loading skeleton. Versus if we delete the cache and reload, we see the skeleton for a few seconds:

- Application devtools
- Select `Local Storage` on the left
- Select `http://localhost:3000`
- Select `apollo-cache-persist` on the right
- Click the `X` delete button
- Reload

So the persisting is working correctly, but if we test the app further, we find that we can’t log out! Well, technically, we can, but it doesn’t look like we are—after clicking “Sign out” on the profile page, the site reloads and we still see our GitHub profile photo on the top-right, and we can still click it to see our profile. Why is that? 

On load, the app reads all the queries from the cache, including the `currentUser` query, which was saved to the cache when we logged in. It’s still there, along with all the private data we had access to, like bonus chapters. To fix this, we can clear the cache when we log out. In order to clear the cache, we need to use a different API from `apollo-cache-persist`. We’ve been using the basic API, `persistCache()`. The more advanced API is [`CachePersistor`](https://github.com/apollographql/apollo-cache-persist#advanced-usage):

```js
const persistor = new CachePersistor(options)
```

And then we call methods on the `persistor` object when we want things to happen: for instance, `persistor.restore()` when we want to restore the cache (which `persistCache()` did automatically, but now we need to do ourselves). So let’s update `App.js`:

[`src/components/App.js`](https://github.com/GraphQLGuide/guide/compare/24_0.2.0...25_0.2.0)

```js
import { CachePersistor } from 'apollo-cache-persist'

import { cache, apollo } from '../lib/apollo'

const persistor = new CachePersistor({
  cache,
  storage: window.localStorage,
  maxSize: 4500000, // little less than 5 MB
  debug: true
})

apollo.onResetStore(() => persistor.purge())

const cacheHasBeenSaved = !!localStorage.getItem('apollo-cache-persist')

class App extends Component {
  state = {
    loading: cacheHasBeenSaved
  }

  async componentDidMount() {
    await persistor.restore()

    this.setState({
      loading: false
    })
  }

  ...
}
```

This line clears the cache when the store is reset:

```js
apollo.onResetStore(() => persistor.purge())
```

And since we call `apollo.resetStore()` on logout in `src/lib/auth.js`, clicking “Sign out” clears the cache, and we see “Sign in” instead of our photo! ✅

But there’s another bug! 😅 When we’re signed out, we get truncated section content back from the API. This gets saved in the cache, and when we sign in, the current section gets refetched (due to `apollo.reFetchObservableQueries()` being called in `auth.js` on login). But if we looked at more than the current section before signing in, the other sections don’t get refetched, because there are no current (“observable”) queries for them. So they get stuck with the truncated content—when we revisit them, the truncated content is loaded from the cache. We can make sure they’re updated either by:

- changing the section content queries’ fetch policy to [`cache-and-network`](https://www.apollographql.com/docs/react/api/react-apollo#graphql-config-options-fetchPolicy), or
- replacing `apollo.reFetchObservableQueries()` with `apollo.resetStore()`

The second would be simpler, but let’s do the first, because it also fixes another issue: when data is cached, it’s saved until it reaches `maxSize`, which could take a long time. The book content will periodically be updated, and we want our users to see the updated content. With `cache-and-network`, the latest version will always be fetched from the server. We make the change by adding the `fetchPolicy` prop to our `<Query>` component:

[`src/components/Section.js`](https://github.com/GraphQLGuide/guide/compare/24_0.2.0...25_0.2.0)

```js
const SectionWithData = ({ location: { state, pathname } }) => {
  ...
  return (
    <Query query={query} variables={variables} fetchPolicy="cache-and-network">
```

And we can test with these steps:

- Sign out
- Click “Preface” and then “Introduction”
- Sign in
- Click “Preface”

The preface content is no longer truncated, but we see a loading skeleton before the full content appears. So `loading` must be initially true, even though we have the truncated preface content in the cache. This is because `loading` is true whenever there is a network request in progress (which there is, because we’re using `cache-and-network`). And we see the skeleton when loading any section—even those with full content in the cache. It’s as if we don’t even have a store anymore. To stop showing the skeleton, we have to go by whether there’s data instead of using Apollo’s `loading` variable. So let’s set `loading: X` in each `createProps` function:

```js
const SectionWithData = ({ location: { state, pathname } }) => {
  const page = deslugify(pathname)

  let query, variables, createProps

  if (state) {
    query = SECTION_BY_ID_QUERY
    variables = { id: state.section.id }
    createProps = ({ data }) => ({
      section: {
        ...state.section,
        content: get(data, 'section.content'),
        views: get(data, 'section.views'),
        scrollY: get(data, 'section.scrollY')
      },
      chapter: state.chapter,
      loading: !data.section
    })
  } else if (page.chapterTitle) {
    query = SECTION_BY_CHAPTER_TITLE_QUERY
    variables = { title: page.chapterTitle }
    createProps = ({ data }) => ({
      section: get(data, 'chapterByTitle.section'),
      chapter: {
        ...data.chapterByTitle,
        number: null
      },
      loading: !data.chapterByTitle
    })
  } else if (page.chapterNumber) {
    query = SECTION_BY_NUMBER_QUERY
    variables = page
    createProps = ({ data }) => ({
      section: get(data, 'chapterByNumber.section'),
      chapter: data.chapterByNumber,
      loading: !data.chapterByNumber
    })
  }

  return (
    <Query query={query} variables={variables} fetchPolicy="cache-and-network">
      {queryInfo => (
        <Mutation mutation={VIEWED_SECTION_MUTATION}>
          {viewedSection => (
            <Mutation mutation={SET_SECTION_SCROLL_MUTATION}>
              {setScrollPosition => (
                <Section
                  {...createProps(queryInfo)}
                  client={queryInfo.client}
                  viewedSection={viewedSection}
                  setScrollPosition={setScrollPosition}
                />
              )}
            </Mutation>
          )}
        </Mutation>
      )}
    </Query>
  )
}
```

And now it works! When we revisit the preface, it shows the truncated content in the cache first, and then shows the full content fetched from the server.

> While the problem we were trying to fix is fixed, the astute will notice [a new bug](https://github.com/GraphQLGuide/guide/issues/49), which is pending a fix in `@apollo/client`.

## Multiple endpoints

> If you’re jumping in here, `git checkout 25_0.2.0` (tag [25_0.2.0](https://github.com/GraphQLGuide/guide/tree/25_0.2.0), or compare [25...26](https://github.com/GraphQLGuide/guide/compare/25_0.2.0...26_0.2.0))

So far we’ve been working with a single GraphQL endpoint, `api.graphql.guide/graphql` (and its websocket counterpart, `/subscriptions`). Would we ever want our app to talk to another endpoint? Maybe. Similarly to the APIs in the [REST section](#REST), we usually would want to proxy the other GraphQL endpoint through our GraphQL server (we’ll go over how to do this in the server chapter). There are two main reasons: 

- If the endpoint is authenticated, we usually will want to keep it private on our server.
- It’s nice for our GraphQL endpoint to have the complete graph of data our app might need, so that devs have one source of truth, and so that our server-side tools—including caching, logging, and analytics—cover all of our queries.

However, there are cases in which we might not want to proxy: we might not have control over the backend, or maybe we want to reduce load on our server or get a slightly better latency than we would while proxying. So we need a GraphQL API from which to fetch some data for this section. Apollo GraphQL shares the name of NASA’s Apollo project, which landed the first humans on the moon in 1969. And Apollo GraphQL identifies with the rocket emoji 🚀. So let’s put that emoji somewhere and make it an easter egg—if it’s clicked, we’ll show the next SpaceX launch using the unofficial [SpaceX GraphQL API](https://github.com/spacexland/api).

So far, all of our queries know what endpoint to talk to because of the `<ApolloProvider>` wrapped around the `<App>`:

`src/index.js`

```js
ReactDOM.render(
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

where `apollo` is the `ApolloClient` instance we created with an HTTP link to `api.graphql.guide/graphql`:

`src/lib/apollo.js`

```js
const httpLink = createHttpLink({
  uri: 'https://api.graphql.guide/graphql'
})

...

export const apollo = new ApolloClient({ link, cache })
```

We’re going to need a second `ApolloClient` instance to use for our launch query:

[`src/lib/apollo.js`](https://github.com/GraphQLGuide/guide/compare/25_0.2.0...26_0.2.0)

```js
export const apolloSpace = new ApolloClient({
  link: ApolloLink.from([
    errorLink,
    createHttpLink({
      uri: 'https://api.spacex.land/graphql'
    })
  ]),
  cache: new InMemoryCache()
})
```

Now to use it, we can put it in the `client` prop of `<Query>`, which overrides its normal behavior of using the client provided by `<ApolloProvider>`.

```js
<Query
  query={LAUNCH_QUERY}
  client={apolloSpace}
>
```

For building the `LAUNCH_QUERY`, let’s see what data is available from the API by browsing its GraphiQL: [api.spacex.land/graphql/](https://api.spacex.land/graphql/). From the available queries, it looks like the relevant one for us is `launchNext`, and we can pick a few fields to display:

![SpaceX GraphiQL with launchNext query](/img/launch-next-query.png)

[`src/components/Profile.js`](https://github.com/GraphQLGuide/guide/compare/25_0.2.0...26_0.2.0)

```js
import gql from 'graphql-tag'

const LAUNCH_QUERY = gql`
  query LaunchQuery {
    launchNext {
      details
      launch_date_utc
      launch_site {
        site_name
      }
      mission_name
      rocket {
        rocket_name
      }
    }
  }
`
```

Now we can use the `<Query>`—let’s put the 🚀 button on the bottom of `Profile`. We need to convert it to a class so that we can have state to toggle whether the launch info is displayed. Then we put the data from the response into a `<dl>`:

[`src/components/Profile.js`](https://github.com/GraphQLGuide/guide/compare/25_0.2.0...26_0.2.0)

```js
import React, { Component } from 'react'
import { Query } from 'react-apollo'

import { apolloSpace } from '../lib/apollo'

class Profile extends Component {
  state = {
    showLaunch: false
  }

  toggleLaunchVisibility = () => {
    this.setState({ showLaunch: !this.state.showLaunch })
  }

  render() {
    const { user, loggingIn } = this.props

    ...

    <main className="Profile">

      ...

      <div className="Profile-footer">
        <button
          className="Profile-toggle-launch"
          onClick={this.toggleLaunchVisibility}
        >
          <span role="img" aria-label="rocket">
            🚀
          </span>
        </button>

        {this.state.showLaunch && (
          <Query
            query={LAUNCH_QUERY}
            fetchPolicy="cache-and-network"
            client={apolloSpace}
            onCompleted={() =>
              window.scrollTo({ top: 1000, left: 0, behavior: 'smooth' })
            }
          >
            {({
              data: {
                launchNext: {
                  details,
                  launch_date_utc,
                  launch_site,
                  mission_name,
                  rocket
                } = {}
              },
              loading
            }) =>
              loading ? (
                <div className="Spinner" />
              ) : (
                <div>
                  The next SpaceX launch will be:
                  <dl>
                    <dt>Date</dt>
                    <dd>
                      <code>{new Date(launch_date_utc).toString()}</code>
                    </dd>

                    <dt>Mission</dt>
                    <dd>
                      <code>{mission_name}</code>
                    </dd>

                    <dt>Rocket</dt>
                    <dd>
                      <code>{rocket.rocket_name}</code>
                    </dd>

                    <dt>Launch site</dt>
                    <dd>
                      <code>{launch_site.site_name}</code>
                    </dd>

                    <dt>Details</dt>
                    <dd className="-non-code">{details}</dd>
                  </dl>
                </div>
              )
            }
          </Query>
        )}
      </div>
    </main>
  }
}
```

When the 🚀 button is clicked, the launch info appears below, but since (depending on our screen height and browser settings) we might be at the bottom of the page already, we might not be able to see the info unless we scroll. It would be nice UX to autoscroll down to show the info. `<Query>` has an [`onCompleted` prop](https://www.apollographql.com/docs/react/api/react-apollo.html#query-props) that is called after the query results are provided to us and our component has re-rendered, so we can call `window.scrollTo` then.

In order to deconstruct `launchNext` we need to add `= {}`, as it will be undefined initially.

We’re using `fetchPolicy="cache-and-network"` instead of the default `cache-first` to make sure we always have the latest results. If a user checked the next launch, left the browser open for a while, and checked back later, it’s possible that the launch we have in the cache will be old—either the launch already happened, or the plans changed. With `cache-and-network`, `<Query>` will first provide us with the cache data, then send the request to the server, then provide us with the response data. However, something unexpected is now happening when we repeatedly toggle the launch info. Do you notice it?

Every time we show the launch info, it shows the loading spinner. Which we wouldn’t expect, because after the first time, it should be immediately giving us data from the cache. If we log `data` and `loading` to see what’s going on, we’ll find that `data` is always filled, and `loading` is first `true` and then `false`. That’s right—at first, `data` is filled at the same time that `loading` is `true`. This is the first time that’s happened in our app—always before, `data` has been an empty object while `loading` was `true`. This actually isn’t a bug—it’s how `loading` is [meant to work](https://www.apollographql.com/docs/react/api/react-apollo.html#graphql-query-data-loading). It’s true whenever a request is currently in flight. 

If we just want to display data whenever it’s available, we can test whether there’s data instead of using `loading`:

```js
{({
  data: {
    launchNext: {
      details,
      launch_date_utc,
      launch_site,
      mission_name,
      rocket
    } = {}
  }
}) =>
  details ? (
    <div>
      The next SpaceX launch will be:
      ...
    </div>
  ) : (
    <div className="Spinner" />
  )
}
```

Now we’ll only see the spinner the first time.

We’re done! We can add more SpaceX data to different parts of our app by importing `apolloSpace` and using it in Apollo’s `client` prop. And we can add more APIs by creating more `ApolloClient` instances.

# Extended topics

Section contents:

* [Linting](6.md#linting)
  * [Setting up linting](6.md#setting-up-linting)
  * [Fixing linting errors](6.md#fixing-linting-errors)
  * [Using linting](6.md#using-linting)
* [Uploading files](6.md#uploading-files)
* [Testing](6.md#testing)

## Linting

> If you’re jumping in here, `git checkout 26_0.2.0` (tag [26_0.2.0](https://github.com/GraphQLGuide/guide/tree/26_0.2.0), or compare [26...27](https://github.com/GraphQLGuide/guide/compare/26_0.2.0...27_0.2.0))

Linters analyze code for errors without running the code—they just look at the code. [ESLint](https://eslint.org/docs/about/) is the main linter for JavaScript. It’s already being used in our app by Create React App. However, their ESLint settings just cover JavaScript—they don’t check our GraphQL queries to see if they’re valid. Let’s set that up!

First let’s run ESLint as it’s currently set up. We have a script in our `package.json` that just runs `eslint src/`:

```sh
$ npm run lint 

> guide@0.2.0 lint /guide
> eslint src/

```

It doesn’t print out any linting errors. We can check the exit code to make sure:

```sh
$ echo $?
0
```

In Mac and Linux, each program has an **exit code**. In Bash, we can print out the last exit code with `echo $?`. An exit code of `0` means success.

### Setting up linting

The npm package `eslint-plugin-graphql` (already in our `package.json` `devDependencies`) adds support for GraphQL to ESLint. We can tell ESLint to use it by modifying our config file:

[`.eslintrc.js`](https://github.com/GraphQLGuide/guide/compare/26_0.2.0...27_0.2.0)

```js
module.exports = {
  extends: 'react-app',
  plugins: ['graphql'],
  parser: 'babel-eslint',
  rules: {
    'graphql/template-strings': [
      'error',
      {
        schemaJson: require('./schema.json')
      }
    ]
  },
}
```

- `extends: 'react-app'`: Use Create React App’s rules as a base
- `plugins: ['graphql']`: Use `eslint-plugin-graphql`
- `schemaJson: require('./schema.json')`: Look in the current directory for the schema

What schema? We want ESLint to validate our queries against our API’s schema—the one the `api.graphql.guide` server has, that Playground shows us in the SCHEMA tab. It makes sense that ESLint is going to need it. But how do we get it in a JSON file? There’s a tool on npm called `graphql-cli` that we can use to download it. It’s in our `devDependencies`, and the program name is `graphql`. Our `update-schema` script uses it:

`"update-schema": "graphql get-schema -e https://api.graphql.guide/graphql -o schema.json"`

- `-e` sets the endpoint
- `-o` gives the output file name

So we can run `npm run update-schema`, and now we have a `schema.json`. It’s like a verbose form of what we see in the Playground SCHEMA tab, and starts with:

```json
{
  "data": {
    "__schema": {
      "queryType": {
        "name": "Query"
      },
      "mutationType": {
        "name": "Mutation"
      },
      "subscriptionType": {
        "name": "Subscription"
      },
      "types": [
        {
          "kind": "OBJECT",
          "name": "Query",
          "description": "",
          "fields": [
            {
              "name": "sections",
              "description": "",
              "args": [
                {
                  "name": "lastCreatedAt",
                  "description": "",
                  "type": {
                    "kind": "SCALAR",
                    "name": "Float",
                    "ofType": null
                  },
                  "defaultValue": null
                },
                {
                  "name": "limit",
                  "description": "",
                  "type": {
                    "kind": "SCALAR",
                    "name": "Int",
                    "ofType": null
                  },
                  "defaultValue": null
                }
              ],
```

We can see that a `__schema` has `types` that include an object with `name: "Query"` with a field named `sections` which has args `lastCreatedAt` and `limit`. And if we scroll down, we see more familiar fields and types.

### Fixing linting errors

Now we can try running ESLint again:

```sh
$ npm run lint

> guide@0.2.0 lint /Users/me/gh/guide
> eslint src/


/Users/me/gh/guide/src/components/CurrentTemperature.js
  80:5  error  Cannot query field "weather" on type "Query"  graphql/template-strings

/Users/me/gh/guide/src/components/Profile.js
  155:5  error  Cannot query field "launchNext" on type "Query"  graphql/template-strings

/Users/me/gh/guide/src/components/Section.js
  163:9  error  Cannot query field "scrollY" on type "Section"            graphql/template-strings
  175:7  error  Cannot query field "scrollY" on type "Section"            graphql/template-strings
  188:9  error  Cannot query field "scrollY" on type "Section"            graphql/template-strings
  204:9  error  Cannot query field "scrollY" on type "Section"            graphql/template-strings
  221:5  error  Cannot query field "setSectionScroll" on type "Mutation"  graphql/template-strings

/Users/me/gh/guide/src/lib/apollo.js
  71:3  error  The Query definition is not executable  graphql/template-strings

/Users/me/gh/guide/src/lib/withUser.js
  18:5  error  Cannot query field "loginInProgress" on type "Query"  graphql/template-strings

✖ 9 problems (9 errors, 0 warnings)

npm ERR! code ELIFECYCLE
npm ERR! errno 1
npm ERR! guide@0.2.0 lint: `eslint src/`
npm ERR! Exit status 1
npm ERR!
npm ERR! Failed at the guide@0.2.0 lint script.
npm ERR! This is probably not a problem with npm. There is likely additional logging output above.

npm ERR! A complete log of this run can be found in:
npm ERR!     /Users/me/.npm/_logs/2019-03-04T01_50_08_741Z-debug.log
```

We get a lot of errors! And we can see that the exit code is no longer `0`: 

```
npm ERR! code ELIFECYCLE
npm ERR! errno 1
npm ERR! guide@0.2.0 lint: `eslint src/`
npm ERR! Exit status 1
```

`Exit status 1` means that the exit code of the command `eslint src/` was `1`.

Let’s go through the errors. First up:

```
/Users/me/gh/guide/src/components/CurrentTemperature.js
  80:5  error  Cannot query field "weather" on type "Query"  graphql/template-strings
```

which is referring to:

[`src/components/CurrentTemperature.js`](https://github.com/GraphQLGuide/guide/compare/26_0.2.0...27_0.2.0)

```js
const TEMPERATURE_QUERY = gql`
  query TemperatureQuery {
    weather(lat: $lat, lon: $lon)
      @rest(
        type: "WeatherReport"
        path: "weather?appid=4fb00091f111862bed77432aead33d04&{args}"
      ) {
      main
    }
  }
`
```

ESLint is looking at our `schema.json` and not finding `weather` as a top-level Query field. Of course it’s not! `weather` isn’t part of the Guide API—it’s from our [weather REST API](#rest). So we don’t want this query linted against the schema. We can tell ESLint to ignore this file by adding `/* eslint-disable graphql/template-strings */` to the top of the file. Now if we re-run `npm run lint`, we no longer see that error. 

8 errors left to go! The next is:

```
/Users/me/gh/guide/src/components/Profile.js
  155:5  error  Cannot query field "launchNext" on type "Query"  graphql/template-strings
```

`launchNext` is from our query to the SpaceX API, which of course has a different schema from the rest of our queries. So far we’ve only told ESLint about `schema.json`, the Guide API schema. But `eslint-plugin-graphql` does support multiple schemas. The way it determines what strings to parse as GraphQL is by the template literal tag name (`gql`). We can use a different tag name for the SpaceX query and have that tag be checked against a different schema. Let’s use `spaceql` instead of our current `gql`:

[`src/components/Profile.js`](https://github.com/GraphQLGuide/guide/compare/26_0.2.0...27_0.2.0)

```js
import spaceql from 'graphql-tag'

const LAUNCH_QUERY = spaceql`
  query LaunchQuery {
    launchNext {
      details
      launch_date_utc
      launch_site {
        site_name
      }
      mission_name
      rocket {
        rocket_name
      }
    }
  }
`
```

And we update the config file:

[`.eslintrc.js`](https://github.com/GraphQLGuide/guide/compare/26_0.2.0...27_0.2.0)

```js
module.exports = {
  extends: 'react-app',
  plugins: ['graphql'],
  parser: 'babel-eslint',
  rules: {
    'graphql/template-strings': [
      'error',
      {
        schemaJson: require('./schema.json')
      },
      {
        tagName: 'spaceql',
        schemaJson: require('./spacex.json')
      }
    ]
  }
}
```

We added this object:

```
{
  tagName: 'spaceql',
  schemaJson: require('./spacex.json')
}
```

Which says, “for any GraphQL document created with the template literal tag name `spaceql`, validate it against the schema located in `spacex.json`.” We can get `spacex.json` with `npm run update-schema-spacex`:

```
  "update-schema-spacex": "graphql get-schema -e https://api.spacex.land/graphql -o spacex.json"
```

And now when we lint, we get one fewer error! The next set of errors is:

```
/Users/me/gh/guide/src/components/Section.js
  163:9  error  Cannot query field "scrollY" on type "Section"            graphql/template-strings
  175:7  error  Cannot query field "scrollY" on type "Section"            graphql/template-strings
  188:9  error  Cannot query field "scrollY" on type "Section"            graphql/template-strings
  204:9  error  Cannot query field "scrollY" on type "Section"            graphql/template-strings
  221:5  error  Cannot query field "setSectionScroll" on type "Mutation"  graphql/template-strings
```

`scrollY` is the piece of [local state](#local-state) in our Section queries:

[`src/components/Section.js`](https://github.com/GraphQLGuide/guide/compare/26_0.2.0...27_0.2.0)

```js
const NEXT_SECTION_QUERY = gql`
  query NextSection($id: String!) {
    section(id: $id) {
      id
      next {
        id
        content
        views
        scrollY @client
      }
    }
  }
`
```

And `setSectionScroll` is our [local mutation](#local-mutations). ESLint will find neither of these in the Guide API schema. We can suppress the errors by adding this line to the top of the file:

```js
/* eslint-disable graphql/template-strings */
```

2 more errors to go! Here’s the next:

```
/Users/me/gh/guide/src/lib/apollo.js
  71:3  error  The Query definition is not executable  graphql/template-strings
```

This refers to the `Query` in our local state schema:

```js
const typeDefs = gql`
  type Query {
    loginInProgress: Boolean
  }
  type Mutation {
    setSectionScroll(id: String!, scrollY: Int!): Boolean
  }
`
```

Instead of `eslint-disable`ing the whole file, let’s just disable part of it. That way if we later add a document to a different part of the file, it will be linted.

[`src/lib/apollo.js`](https://github.com/GraphQLGuide/guide/compare/26_0.2.0...27_0.2.0)

```js
...

/* eslint-disable graphql/template-strings */
const typeDefs = gql`
  type Query {
    loginInProgress: Boolean
  }
  type Mutation {
    setSectionScroll(id: String!, scrollY: Int!): Boolean
  }
`
/* eslint-enable graphql/template-strings */

...
```

And the last error is another local state field—let’s just put the `eslint-disable` comment at the top of `src/lib/withUser.js`.

```
/Users/me/gh/guide/src/lib/withUser.js
  18:5  error  Cannot query field "loginInProgress" on type "Query"  graphql/template-strings
```

### Using linting

Usually people don’t manually run `npm run lint` on the command line. Instead, they set up one or more of the following, which all automatically run the linter:

- [Editor integration](#editor-integration)
- [Pre-commit hook](#pre-commit-cook)
- [Continuous integration](#continuous-integration)

#### Editor integration

Most editors have a linting plugin. VSCode has this [ESLint plugin](https://github.com/Microsoft/vscode-eslint). It looks for a configuration file in the current workspace (for us it would find `.eslintrc.js`) and runs ESLint in the background whenever we type something new into the editor. For instance if we type in `first` as a field of `currentUser`, it is underlined:

![ESLint underlining error in VSCode](/img/eslint-vscode.png)

And if we hover over the word, we see the linting error:

![ESLint error message tooltip](/img/eslint-vscode-tooltip.png)

> Cannot query field "first" on type "User". Did you mean "firstName"?

Since ESLint has the schema, it knows that `currentUser` resolves to a `User`, and that `first` isn’t one of the fields of the `User` type. When we change it to `firstName`, the error underline goes away.

Some linting errors have automatic fixes, and we can have the plugin make those fixes whenever we save the file by enabling this setting:

```
"eslint.autoFixOnSave": true
```

#### Pre-commit hook

Git has [a lot of hooks](https://git-scm.com/docs/githooks)—times when git will run a program for you. One such hook is pre-commit. A pre-commit hook will be called when a dev enters `git commit` and before git actually does the committing. If the hook program ends with a non-zero exit code, the commit will be canceled. The best way to set up git hooks in our project is with [Husky](https://github.com/typicode/husky). To do that, we would:

```
npm install husky --save-dev
```

And add to our `package.json`:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run lint"
    }
  }
}
```

Then if we tried to commit but `npm run lint` failed, the commit would be canceled, and we would see the ESLint output with the problem(s) we need to fix. 

#### Continuous integration

Background: [Continuous integration (CI)](bg.md#continuous-integration)

Our CI server can do `npm run lint` as one of its tests, prevent deployment if linting fails, display a build failure symbol next to the commit or PR, and link to its site where we can view the error output.

## Uploading files

Background: [CDN](bg.md#cdn)

There are two ways to do file uploads: client-side and server-side. In client-side uploads, the client sends the file directly to a cloud service that stores the files. In server-side, the client sends the file to our server, which then stores it someplace (either on a hard drive or with a cloud service—usually the latter). For ease of coding, we recommend client-side. The only possible downside is that someone could upload a lot of files to our service, costing us more money. However, in the unlikely event that this becomes a problem, there are ways with most services to make sure only logged-in users can upload.

The two main services we recommend are: 

- Cloudinary (file storage, CDN, and media file processor)
- Amazon S3 (file storage) and CloudFront ([CDN](bg.md#cdn))

Usually an app needs to process images or videos—resizing an image, centering on a face and cropping it, brightening, etc—before using them. For these apps, we recommend Cloudinary as the all-in-one solution. If you’re just saving files that need to be stored, and maybe downloaded later unchanged, then S3 is fine.

### Client-side

There are two ways to upload to Cloudinary from the client—we can use their upload UI, or we can create our own. Here’s what [theirs](https://cloudinary.com/documentation/upload_widget) looks like:

![Cloudinary upload widget](/img/cloudinary-upload-widget.jpg)

When we open the widget, we give it a callback. The user uses the widget to upload a file to our Cloudinary account, and the widget calls our callback, providing us the ID of the file as an argument. We send the ID to our server in a mutation, and our server saves it to our database. We use the ID to construct the URL of the file, for example:

```
http://res.cloudinary.com/graphql/guide/file-id.jpg
```

If we want our own UI, we can render a file input styled however we want, and then we POST the input file to the Cloudinary server [like in this React example](https://github.com/cloudinary/cloudinary-react/blob/f83e4e561f9709268afbe11812f116f382cc117f/samples/photo_album/src/components/PhotosUploader.js#L99-L119). (And then, as before, we get an ID back to send in a mutation to the server.)

### Server-side

Here’s what we would do to upload a file to our server:

```sh
npm install apollo-upload-client
```

`apollo.js`

```js
import { ApolloClient } from 'apollo-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { createUploadLink } from 'apollo-upload-client'

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: createUploadLink({
    uri: 'https://api.graphql.guide/graphql'
  })
})
```

`FileUpload.js`

```js
import gql from 'graphql-tag'
import { Mutation } from 'react-apollo'

const UPLOAD_FILE_MUTATION = gql`
  mutation UploadFile($file: Upload!) {
    uploadFile(file: $file) {
      id
      fileName
    }
  }
`

const FileUpload = () => (
  <Mutation mutation={UPLOAD_FILE_MUTATION}>
    {mutate => (
      <input
        type="file"
        required
        onChange={({
          target: {
            validity,
            files: [file]
          }
        }) => validity.valid && mutate({ 
          variables : { file } 
        })}
      />
    )}
  </Mutation>
)

export default FileUpload
```

Our server needs to support the [GraphQL multipart request spec](https://github.com/jaydenseric/graphql-multipart-request-spec#server). We’ll see in the server chapter how to do this in Node using [`graphql-upload`](https://github.com/jaydenseric/graphql-upload).

## Testing

We’re holding off on writing this section until the hooks+suspense version of React Apollo comes out. For now, we recommend the built-in [`<MockedProvider>`](https://www.apollographql.com/docs/react/recipes/testing.html) for the easiest setup or [this approach](https://medium.freecodecamp.org/a-new-approach-to-mocking-graphql-data-1ef49de3d491) for the most succinct test code. 

We also recommend using [Jest](https://jestjs.io/) and [`react-testing-library`](https://testing-library.com/react). If you’d like a video introduction to them, as well as testing in general, we recommend [this course](https://testingjavascript.com/).