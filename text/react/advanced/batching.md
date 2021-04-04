---
title: Batching
description: How to batch multiple operations into a single HTTP request
---

## Batching

> If you’re jumping in here, `git checkout 24_1.0.0` (tag [`24_1.0.0`](https://github.com/GraphQLGuide/guide/tree/24_1.0.0)). We won’t be leaving the code from this section in our app, so the next section will also start at tag `24`. 

If we load the site with the Network tab of devtools open, we see a lot of requests that say “graphql” on the left—that’s the path, so the full endpoint is `api.graphql.guide/graphql`, our GraphQL API. By default, each of the GraphQL queries in our app is sent in its own HTTP request. We can look at the request payload to see which query it is, for example our simple `StarsQuery`: 

![Network tab request payload](../../img/request-payload.png)

We can **batch** our initial queries into one request, which will look like this:

![Array request payload](../../img/array-request-payload.png)

> We also see that the third request is to `/graphql`, but the Request Method is `OPTIONS` instead of the normal `POST`, and the status code is `204` instead of the normal `200`. This is called a **preflight** request that Chrome makes to the server to check its security policy ([CORS](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)), since it’s going to a different domain from the client (`localhost:3000`). To avoid `OPTIONS` requests in production, we can host our frontend and API at the same domain, like `example.com` for the frontend and `example.com/graphql` for the API.

At first glance, it seems better to batch—fewer requests is more efficient for our browser, and it reduces the HTTP request load on our server. However, the big drawback is that we only get one response. This means that the server keeps all of our results until the last query in the batch completes, and *then* sends all the results back to us together in one response. Without batching, we get results to our faster queries faster, and those parts of the page get rendered, while the other parts stay in loading state for longer. For this reason, it’s recommended that we keep the default unbatched requests, and only try batching when we have server load issues *and* have [already made other performance improvements](https://blog.apollographql.com/batching-client-graphql-queries-a685f5bcd41b). If we ever get to that point, here’s the simple setup:

`src/lib/link.js`

```js
import { BatchHttpLink } from '@apollo/client/link/batch'

const httpLink = new BatchHttpLink({ uri: 'https://api.graphql.guide/graphql' })
```

We replace our previous `HttpLink` with Apollo’s [`BatchHttpLink`](https://www.apollographql.com/docs/link/links/batch-http.html). One thing you may notice in the Network tab is that soon after our initial batched request, we see another—this one only contains a single operation, named `ViewedSection`:

![Array request payload](../../img/viewed-section-request.png)

The reason this wasn’t included in the initial batch request is because it happens a second later: only queries that are made within a certain window are batched together. The default `batchInterval` is 10 milliseconds, and can be changed [as an option](https://www.apollographql.com/docs/link/links/batch-http.html#options) to `BatchHttpLink()`.

If we know there are certain queries that will take longer than others, and we want them to bypass batching, we can set up both a normal http link and a batched link. Then we can use `split()` to decide which link to send a request to:

```js
const client = new ApolloClient({
  link: split(
    operation => operation.getContext().slow,
    httpLink, 
    batchHttpLink
  )
})

useQuery(SLOW_QUERY, { context: { slow: true } })
useQuery(NORMAL_QUERY)
```

We add data to the context, and then we check it inside `split()`: if the context has `slow: true`, then send via the `httpLink`. Otherwise, send via the `batchHttpLink`. 

