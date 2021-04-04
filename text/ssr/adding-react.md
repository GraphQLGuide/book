---
title: Adding React
---

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

![Bold text: My server-rendered React app](../img/ssr-react.png)

`<App>` is currently static (it has no state or event handlers), but if we wanted a dynamic app, we would need to include a `<script>` tag in our HTML pointing to our bundled React JavaScript code. It would need to call [`ReactDom.hydrate()`](https://reactjs.org/docs/react-dom.html#hydrate) to hydrate the HTML:

```js
import { hydrate } from 'react-dom'

hydrate(<App />, document.getElementById('root')) 
```

