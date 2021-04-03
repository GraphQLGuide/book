---
title: Setting up
description: Setting up our React app with Apollo Client
---

# Setting up

Section contents:

* [Build options](#build-options)
* [App structure](#app-structure)
* [Set up Apollo](#set-up-apollo)

## Build options

Background: [server-side rendering](../background/ssr.md)

In the early days, setting up a new React app was plagued by complex Webpack and
Babel configurations. There are now a number of tools for this, four of which
we recommend: Create React App, Gatsby, Next.js, and Meteor.

> [Babel](https://babeljs.io/) converts our modern JavaScript to old JavaScript so it will run in the browser or Node. [Webpack](https://webpack.js.org/) bundles our JavaScript and other files together into a website.

### Create React App

```sh
npm i -g create-react-app
create-react-app my-app
cd my-app/
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
gatsby new my-app
cd my-app/
gatsby develop
```

[Gatsby](https://www.gatsbyjs.org/) is the best static site generator out there. But by “static site generator,” we don’t mean it generates HTML-only non-interactive sites. It generates pages that render the HTML & CSS UI immediately and run JavaScript to hydrate the page into a React app. It can’t generate logged-in content (like you can with SSR and cookies) because it’s not your production server—deploying is building HTML, JS, and CSS files and serving them as-is (*statically*). However, you can [render logged-in content on the client](https://www.gatsbyjs.org/docs/building-apps-with-gatsby/).

### Next.js

```sh
npm i -g create-next-app
create-next-app my-app
cd my-app/
npm run dev
```

[Next.js](https://github.com/zeit/next.js) is similar to CRA and Gatsby in that it takes
care of Webpack/Babel for us, but it also does [server-side rendering](../background/ssr.md)
(SSR), routing, automatic page-level code splitting, dynamic importing, and hot
code reloading. CRA and Gatsby are just your dev server and build tool, whereas Next.js, since it
does SSR, is also your Node production server. 

Next.js also has an `export` command that outputs HTML and JS that you can serve as static files (like Gatsby). The HTML is rendered once at the time that you run the `export` command, instead of in real time whenever a client requests the site.

### Meteor

```sh
curl https://install.meteor.com/ | sh
git clone https://github.com/jamiter/meteor-starter-kit.git my-app
cd my-app/
npm install
meteor
```

Like Next.js, [Meteor](https://www.meteor.com) is a build tool and the production server. But, unlike Next.js and the other options, it does not use
Webpack—it has its own advanced build system that is blissfully
configuration-free. It does not have built-in SSR, since it is view layer agnostic (it can be used with any view library, like Vue, Svelte, Angular, etc.), but it does
have other advanced features. It has dynamic (runtime) imports, and all dynamically imported modules are fetched quickly
over a WebSocket and [cached on the client](https://blog.meteor.com/announcing-meteor-1-5-b82be66571bb) (in
[IndexedDB](https://en.wikipedia.org/wiki/Indexed_Database_API)). It also does [differential bundling](https://blog.meteor.com/meteor-1-7-and-the-evergreen-dream-a8c1270b0901), reducing bundle size for modern browsers.

## App structure

For our Guide app, we’ll use CRA, because it’s the most widely used and the most
basic, straightforward option. Here’s our starter app:

```sh
git clone https://github.com/GraphQLGuide/guide.git
cd guide/
git checkout 0_1.0.0
npm install
```

Now we should be able to run CRA’s development server:

```sh
npm start
```

And see our app at [localhost:3000](http://localhost:3000/):

![Create React App starting site](../img/cra.png)

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
    ├── components
    │   └── App.js
    │   └── App.test.js
    ├── index.css
    ├── index.js
    └── logo.svg
```

`.eslintrc.js` — The CRA dev server (`npm start`) outputs linter warnings ([background on ESLint](https://eslint.org/docs/about/)), but it’s
nice to see the warnings directly in our text editor, so we have an `.eslintrc`
file that uses the same rules as the dev server. Most editors’ ESLint plugins
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
    "react": "16.13.1",
    "react-dom": "16.13.1",
    "react-scripts": "3.4.1",
    ...
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject",
    ...
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
```

We have our normal react dependencies, `react` and `react-dom`, plus
`react-scripts`, which is what CRA lives inside, and which provides the
commands:

* `npm start` starts the dev server
* `npm run build` bundles the app for deployment
* `npm test` runs all the tests found in `*.test.js` files
* `npm run eject` takes us out of CRA (replaces `react-scripts` in our dependencies with a long list
  of other packages, adds a `scripts/` directory, and adds an 8-file `config/` directory
  with Webpack, Babel, and testing configuration)

`browserslist` defines which browsers the generated site will support. We can use [browserl.ist/](https://browserl.ist/) to interpret our browserlist strings:

* Supported browsers: [>0.2%, not dead, not op_mini all](https://browserl.ist/?q=%3E0.2%25%2C+not+dead%2C+not+op_mini+all)
* Not supported: [<=0.2%, dead, op_mini all](https://browserl.ist/?q=%3C%3D0.2%25%2C+dead%2C+op_mini+all)

For instance, here is the [dead](https://browserl.ist/?q=dead) list at time of writing:

![Some versions of Blackberry, IE, IE Mobile, Opera Mobile, and Samsung Internet](../img/browserlist.png)

In our `public/` directory, we have a
[favicon](https://en.wikipedia.org/wiki/Favicon), `manifest.json` (which is used
when our app is added to an Android homescreen), and our only HTML page, `public/index.html` — our [SPA](../background/spa.md) shell, basically just:

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

We can add HTML, like meta tags to the head or a Google Analytics tracking
script to the bottom of the body. Our React JavaScript code gets added to the
body, and when it runs, it puts the app inside the root tag `<div
id="root"></div>`:

[`src/index.js`](https://github.com/GraphQLGuide/guide/blob/0_1.0.0/src/index.js)

```js
import React from 'react'
import { render } from 'react-dom'
import './index.css'
import App from './components/App'

render(<App />, document.getElementById('root'))

module.hot.accept()
```

Let’s look at some of the lines:

`import './index.css'` — CRA supports importing CSS from JavaScript. There are
many ways to do CSS with React, and we’ll be sticking with this single plain
`.css` file so that we can focus on the GraphQL parts of app-building.

`render(<App />, document.getElementById('root'))` — Our only component,
`<App />`, gets rendered into the `#root` div.

`module.hot.accept()` — This enables HMR ([Hot Module Replacement](https://webpack.js.org/concepts/hot-module-replacement/)), a Webpack feature that updates JavaScript when code is saved in development without reloading the page.

Here’s our App component:

[`src/components/App.js`](https://github.com/GraphQLGuide/guide/blob/0_1.0.0/src/components/App.js)

```js
import React from 'react'

import logo from '../logo.svg'

export default () => (
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
```

`import logo from '../logo.svg'` — CRA supports importing files, like images and
fonts. When we import a file, it gets included in the app bundle, and we get a
URL that we can use—for example, in a `src` attribute:

```html
<img src={logo} className="App-logo" alt="logo" />
```

We also have a test file:

[`src/components/App.test.js`](https://github.com/GraphQLGuide/guide/blob/0_1.0.0/src/components/App.test.js)

```js
import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'

it('renders without crashing', () => {
  const div = document.createElement('div')
  render(<App />, div)
})
```

This and any other files ending in `.test.js` get run when we do `npm test`.

## Set up Apollo

The best GraphQL library for React is
[`@apollo/client`](https://www.apollographql.com/docs/react/). It has all the features we
talked about in the [Client Libraries](../client/client-libraries.md) section and more. Our `package.json` already has these packages, but normally we would install it and `graphql` with:

```sh
npm i -S @apollo/client graphql
```

Now we need to create an instance of `ApolloClient` and wrap our app JSX in a
component called `<ApolloProvider>`, which provides our client instance to all
descendants. So we go to `src/index.js`, where our `<App />` component is
rendered, and replace the `render()` line with:

[`src/index.js`](https://github.com/GraphQLGuide/guide/blob/1_1.0.0/src/index.js)

```js
import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  HttpLink,
} from '@apollo/client'

const link = new HttpLink({
  uri: 'https://api.graphql.guide/graphql',
})

const cache = new InMemoryCache()

const client = new ApolloClient({ link, cache })

render(
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

