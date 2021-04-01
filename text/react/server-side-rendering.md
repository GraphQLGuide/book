# Server-side rendering

As we mentioned in [Background > SSR](../background/ssr.md), server-side rendering often results in faster load times. But if we render our app on the server the same way we render on the client, then all our Apollo Client queries will be in the loading state, and the HTML the server sends to the client will have loading spinners and skeletons everywhere. In most cases, we want the HTML to contain all the GraphQL data from the completed queries, so that the client sees the data immediately. We can do this in six steps:

1. Apollo Client makes all queries in our app and waits for them to complete.
2. Once complete, we render the app to HTML.
3. We get the current state of the Apollo cache.
4. We create an HTML document that contains both #2 and #3.
5. We send it to the client.
6. When the page loads on the client, we create an instance of `ApolloClient` with the #3 cache data.

We go through these steps in the SSR chapter, included in the Pro edition of the book:

[Server-Side Rendering](../ssr/index.md)