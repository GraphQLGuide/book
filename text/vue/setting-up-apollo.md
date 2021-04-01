## Setting up Apollo

We start with a basic Vue app:

```sh
git clone https://github.com/GraphQLGuide/guide-vue.git
cd guide-vue/
git checkout 0_1.0.0
npm install
npm serve
```

This uses the Vue CLI to serve the development version of our app, which automatically refreshes when we change files: [http://localhost:8080/](http://localhost:8080/).

![Web page with the Vue logo and a heading](../img/vue-starter.png)

Basic, indeed 😄. Here’s the code:

[`public/index.html`](https://github.com/GraphQLGuide/guide-vue/blob/1_1.0.0/public/index.html)

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <link rel="icon" href="<%= BASE_URL %>favicon.ico">
    <title>The GraphQL Guide</title>
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>
```

The single `<div>` is where we mount the Vue app:

[`src/main.js`](https://github.com/GraphQLGuide/guide-vue/blob/1_1.0.0/src/main.js)

```js
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
```

[`src/App.vue`](https://github.com/GraphQLGuide/guide-vue/blob/1_1.0.0/src/App.vue)

```html
<template>
  <img alt="Vue logo" src="./assets/logo.png" />
  <h1>The GraphQL Guide</h1>
</template>

<script>
export default {
  name: 'App'
}
</script>
```

Files with `.vue` extensions are [single file components](https://v3.vuejs.org/guide/single-file-component.html), which contain both the template and the JavaScript (as well as the CSS, which would go in a `<style>` tag at the bottom). Beyond that, we have:

[`babel.config.js`](https://github.com/GraphQLGuide/guide-vue/blob/1_1.0.0/babel.config.js)

```js
module.exports = {
  presets: ['@vue/cli-plugin-babel/preset']
}
```

[`package.json`](https://github.com/GraphQLGuide/guide-vue/blob/1_1.0.0/package.json)

```json
{
  "name": "guide-vue",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "serve": "vue-cli-service serve",
    "build": "vue-cli-service build",
    "lint": "vue-cli-service lint"
  },
  "dependencies": {
    "@apollo/client": "^3.3.6",
    "@vue/apollo-composable": "^4.0.0-alpha.12",
    "core-js": "^3.6.5",
    "graphql": "^15.4.0",
    "vue": "^3.0.4"
  },
  "devDependencies": {
    "@vue/cli-plugin-babel": "~4.5.0",
    "@vue/cli-plugin-eslint": "~4.5.0",
    "@vue/cli-service": "~4.5.0",
    "@vue/compiler-sfc": "^3.0.4",
    "babel-eslint": "^10.1.0",
    "eslint": "^6.7.2",
    "eslint-plugin-vue": "^7.0.0-0"
  },
  "eslintConfig": {
    "root": true,
    "env": {
      "node": true
    },
    "extends": [
      "plugin:vue/vue3-essential",
      "eslint:recommended"
    ],
    "parserOptions": {
      "parser": "babel-eslint"
    },
    "rules": {}
  },
  "browserslist": [
    "> 1%",
    "last 2 versions",
    "not dead"
  ]
}
```

We have configuration for babel, eslint, and target browsers. The two dependencies needed for a Vue app are `core-js` and `vue`. We will also use `graphql`, `@apollo/client`, and the Vue Apollo composition API, `@vue/apollo-composable`. First, we create an `ApolloClient` instance, and, then, during component setup, we [provide](https://v3.vuejs.org/api/composition-api.html#provide-inject) the instance to the component tree so that any component can access it. We use `DefaultApolloClient` from `@vue/apollo-composable` as our `InjectionKey` so that `@vue/apollo-composable` knows how to access it.

[`src/App.vue`](https://github.com/GraphQLGuide/guide-vue/blob/1_1.0.0/src/App.vue)

```js
import { ApolloClient, InMemoryCache } from '@apollo/client/core'
import { DefaultApolloClient } from '@vue/apollo-composable'
import { provide } from 'vue'

const client = new ApolloClient({
  uri: 'https://api.graphql.guide/graphql',
  cache: new InMemoryCache()
})

export default {
  name: 'App',
  setup() {
    provide(DefaultApolloClient, client)
  }
}
```

> This snippet replaces what used to be inside the `<script>` tag in `App.vue`.

If we want the Apollo CLI or VS Code extension to work, we’ll also want a config file:

[`apollo.config.js`](https://github.com/GraphQLGuide/guide-vue/blob/1_1.0.0/apollo.config.js)

```js
module.exports = {
  client: {
    service: {
      name: 'guide-api',
      url: 'https://api.graphql.guide/graphql'
    },
    includes: ['src/**/*.vue', 'src/**/*.js']
  }
}
```

