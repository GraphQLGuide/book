---
title: Overview
---

# Server-Side Rendering

Chapter contents:

* [Setting up the server](setting-up-the-server.md)
* [Adding React](adding-react.md)
* [Adding Apollo](adding-apollo.md)

---

Background: [SSR](../background/ssr.md), [Node](../background/node-npm-and-nvm.md), [HTTP](../background/http.md), [Server](../background/server.md), and the [React chapter](../react/index.md)

As we mentioned in [Background > SSR](../background/ssr.md), server-side rendering often results in faster load times. But if we render our app on the server the same way we render on the client, then all our Apollo Client queries will be in the loading state, and the HTML the server sends to the client will have loading spinners and skeletons everywhere. In most cases, we want the HTML to contain all the GraphQL data from the completed queries, so that the client sees the data immediately. We can do this in six steps:

1. Apollo Client makes all queries in our app and waits for them to complete.
2. Once complete, we render the app to HTML.
3. We get the current state of the Apollo cache.
4. We create an HTML document that contains both #2 and #3.
5. We send it to the client.
6. When the page loads on the client, we create an instance of `ApolloClient` with the #3 cache data.

There are some differences in the API for parts of this process, depending on which view library we’re using. Here are links to the documentation for [React Apollo SSR](https://www.apollographql.com/docs/react/performance/server-side-rendering/), [Vue Apollo SSR](https://v4.apollo.vuejs.org/guide-advanced/ssr.html), and [Apollo Angular SSR](https://apollo-angular.com/docs/performance/server-side-rendering).

In this chapter, we’ll use the React version as the example API. We’ll base our code off the [Chapter 6: React repository](https://github.com/GraphQLGuide/guide/tree/28), but we won’t cover all the steps, like matching what Create React App is doing for us with Babel, asset loading, etc. If you think you might want SSR when starting a project, we recommend using [Next.js or Gatsby](../react/#build-options) instead of CRA (which doesn’t support SSR). Here’s a [starter template](https://github.com/vercel/next.js/tree/canary/examples/with-apollo) for Next.js and a [theme](https://github.com/apollographql/gatsby-theme-apollo/tree/master/packages/gatsby-theme-apollo) for Gatsby.

