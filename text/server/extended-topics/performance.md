---
title: Performance
---

## Performance

Background: [HTTP](../../background/http.md), [Latency](../../background/latency.md), [Databases](../../background/databases.md), [CDN](../../background/cdn.md)

Performance is mostly about speed—how quickly can the client receive a response. It’s also about *load* (how much work a server is doing) since high load (caused by many concurrent requests) can result in either slower responses or no responses 😅. *Capacity* is defined as either the load a server can handle before it fails to respond or before its response speed decreases.

There are many places in the request-response cycle where we can improve speed or increase capacity. They all have different costs (in terms of development time, maintenance, and money) and different levels of improvement. An essential aspect of performance engineering is measurement. We need to know how long things take or how much load we can handle before we:

1. Decide we want to improve (performance / scalability is a common area of premature optimization).
2. Make improvements (so we can compare measurements before and after to determine how effective the change is).

We can determine our capacity with *load testing*, using [k6](https://k6.io/) with [`easygraphql-load-tester`](https://easygraphql.com/docs/easygraphql-load-tester/usage) to make many simultaneous requests. We can measure server-side performance with Apollo Studio like we did in the [Analytics](../production/analytics.md) section: request rate and response time, as well as resolver timelines. Resolvers usually spend most of their time making database queries (which we’ll examine in the next section, [Data fetching](#data-fetching)), but if we wanted to look at exactly how long each one takes, we could do that as well (how we do that depends on which database we’re using). 

We also want to measure the response time from the client in order to spot:

- Longer times due to latency or limited bandwidth.
- Shorter times due to CDN or browser caching.

[Caching](#caching) has its own section, but here are a couple of other ways to improve speed measured from the client:

- Use an HTTP/2 server (like Node.js 10+).
- Use automatic persisted queries (APQ).

**HTTP/2**: Browsers limit the number of HTTP/1.1 connections to a single server, so if more than a certain number of requests (usually six) are made, the ones beyond six wait until the first six are completed. This drastically increases the time it takes the ones beyond six to complete. We can fix this by using HTTP/2, which can make multiple requests over a single connection.

**APQ**: When the client’s requests include large queries and they’re on a low-bandwidth connection, it can take a long time to send the request. Automatic persisted queries allow the client to send a hash of the query instead of the whole thing. It’s enabled by default in Apollo Server and [with a link](https://www.apollographql.com/docs/apollo-server/performance/apq/#setup) on the client. The client creates a hash (a relatively small string) of the query and sends that to the server. The first time the server receives a hash, it doesn’t recognize it and returns an error. Then the client replies with the full query and the hash, which the server saves. After that, whenever any client sends that hash, the server will recognize it and know which query to execute.

> It’s also possible to persist database queries (called *prepared statements* in SQL), in which the query is stored in the database and the API server just sends the query ID and arguments. This is done for us automatically when using [Hasura](hasura.md).

Before a request’s processing reaches our resolvers, the GraphQL server library has to parse and validate the request. Then, during the execution phase, the library calls our resolvers. Different GraphQL servers do this process faster than others. For Node.js, the main improvement available is compiling queries to code, which [`graphql-jit`](https://github.com/zalando-incubator/graphql-jit) does. It integrates with Apollo Server [like this](https://github.com/zalando-incubator/graphql-jit/blob/master/examples/blog-apollo-server/src/server.ts). Another option for Python, Ruby, and Node is [Quiver](https://graphql-quiver.com/).

### Data fetching

The largest server-side factor that contributes to the response time is how long resolvers take to return, and the majority of resolvers’ runtime is usually taken up by fetching data. In this section, we’ll cover the performance of data fetching in our resolvers.

> Some of this section will apply to subscriptions. We also discussed scaling subscription servers in [Subscriptions in depth > Server architecture](subscriptions-in-depth.md#server-architecture).

The three general speed factors, in order of importance:

1. How many data requests are made in series
2. How long the data source takes to get the data
3. Latency between our GraphQL server and the data source

> Here *data source* means a source of data, like a database or an API—not an Apollo Server data source class.

Usually, we locate both our GraphQL server and our data sources in the same location, in which case #3 is very small (~0.2ms when inside the same AWS Availability Zone). However, when they’re far apart—for instance when the data source is an external API hosted across the country—#3 can become a larger factor than #2. 

Factor #2 depends on the type of data source and what data is being requested. For databases, usually the largest factor is if there is an index that covers the query—otherwise, the database has to search through all records in the table/collection, which takes much more time. Another large factor is whether data has to be read from disk—it’s faster when the data is already in RAM. (MongoDB [recommends](https://docs.atlas.mongodb.com/sizing-tier-selection/#memory) having enough RAM to fit the *working set*—the indexes and data that are accessed frequently.) 

Since different types of databases work differently, we may get faster results by using another database, in which case we might move or duplicate part or all of our data to the other database. For instance, Elasticsearch handles search queries more efficiently than our main database. We would duplicate all the data we wanted searchable from our main database to Elasticsearch, and then we would resolve all searches by querying Elasticsearch. Another type of query that is slow in many databases is one that skips a large number of results. This issue, which we talk about in the [Pagination section](pagination.md), is one reason to use [cursors](pagination.md#cursors).

Another factor that can improve database speed and reduce load is avoiding overfetching—instead of fetching all the fields (for instance `SELECT * FROM reviews`), we can fetch only the ones needed for the current query’s selection set. If we use a library like [Join Monster](../more-data-sources/sql.md#sql-performance) or a platform like [Hasura](hasura.md), this is done for us, as well as JOINs. Otherwise we can look at [`info`](https://www.apollographql.com/docs/graphql-tools/resolvers/#resolver-function-signature), the fourth resolver argument, to look up which fields to select.

A large area in which we can reduce load on a data source is sending fewer queries! One issue of basic implementations of GraphQL resolvers and ORMs is the *N+1 problem*. Consider this query:

```gql
query {
  post(id: "abc") {
    comments {
      id
      text
    }
  }
}
```

The N+1 problem is when our server does 1 query for the post document and then N comment queries—one for each ID in the `post.commentIds` array. There are actually two issues with this:

- The comment queries are done in parallel, but the post and the group of comment queries are done in series—the post is fetched before the comments. This is a significant hit to our GraphQL server’s response time.
- When there are a lot of comments, there are a lot of comment queries, which is a high load on the server.

The second issue is fixed by DataLoader, which batches all the comment queries into a single query. To learn how to use DataLoader, see the [Custom data source](../more-data-sources/custom-data-source.md) section. Also, if our data source is existing REST APIs, we can generate DataLoader code with Yelp’s [`dataloader-codegen`](https://github.com/Yelp/dataloader-codegen) library.

To fix the first issue, we need the `post` resolver to fetch both the post and the comments at the same time. If we use Join Monster or Hasura, this is done for us. If we use MongoDB, we have two options:

- Use a de-normalized structure in the posts collection, storing an array of comment objects inside each post document—then fetching the post will get the comments as well.
- Use the `info` resolver arg:
  - Store each comment with a `postId` field.
  - Look at `info` to see if `comments` is selected.
  - If it is selected, query for both the post and the comments at the same time.
  
```js
const resolvers = {
  Query: {
    post: async (_, { id }, { dataSources }, info) => {
      const postPromise = dataSources.posts.findOneById(id)

      if (commentsIsSelected(info)) {
        const [post, comments] = await Promise.all([
          postPromise,
          dataSources.comments.findAllByPostId(id)
        ])
        post.comments = comments
        return post
      } else {
        return postPromise
      }
    }
  }
}
```

We can use this `info` technique with other databases as well as beyond the N+1 problem—there may be other queries we can initiate early. Viewing data in the `info` object can be simplified with the [`graphql-parse-resolve-info`](https://github.com/graphile/graphile-engine/tree/master/packages/graphql-parse-resolve-info) library.

### Caching

Wikipedia’s [definition](https://en.wikipedia.org/wiki/Cache_(computing)) of a cache is “a hardware or software component that stores data so that future requests for that data can be served faster.” In addition to improving speed, caching also reduces load on the part of the system that originally provided the data that’s being cached. For instance, a CDN caching an HTTP response reduces load on our server, which originally provided the response. And our `MongoDataSource` caching documents reduces load on our MongoDB database.

Here are the possible places for caches, starting in the client code that’s requesting data, and ending with the database:

- **Client library**: GraphQL client libraries like Apollo Client [cache](../../client/client-libraries.md#caching) response data from previous requests in memory.
- **Browser / Client OS**: Browsers, iOS, and Android cache HTTP responses based on the `Cache-Control` HTTP header.
- **CDN**: CDNs also cache HTTP responses based on `Cache-Control` (see [Background > CDN](../../background/cdn.md)).
- **Application server**: 
  - Our GraphQL server can cache GraphQL responses in a caching database like Redis.
  - Our server’s data source classes can [cache database responses](../production/database-hosting.md#redis-caching) in Redis.
- **Database**: Our database has various levels of caching—in its software that uses RAM, in the operating system, and in the hard drives.
  
> It’s caches all the way down.
> —Yoav Weiss

Apollo Server will set the `Cache-Control` header for us as well as save the response to the cache. By default, however, it assumes we don’t want data cached and doesn’t do so. We have to tell it which fields and types we want cached and for how long. Then, if a response includes only those fields, it will set the header and save the response in the cache.

We can tell Apollo Server which fields and types we want cached with a *cache hint*. We can provide the hint in two ways:

- The `@cacheControl` schema directive
- Calling [`info.cacheControl.setCacheHint()`](https://www.apollographql.com/docs/apollo-server/performance/caching/#adding-cache-hints-dynamically-in-your-resolvers) in our resolvers

The first method we can use on both types and fields:

```gql
type Query {
  hello: String!
  reviews: [Review!]! @cacheControl(maxAge: 120)
  user(id: ID!): User
}

type Review @cacheControl(maxAge: 60) { 
  id: ID!
  text: String!
  stars: Int
  commentCount: Int! @cacheControl(maxAge: 30)
}

type User @cacheControl(maxAge: 600) {
  id: ID!
  firstName: String!
  reviews: [Review!]!
}
```

`maxAge` is in seconds. The lowest `maxAge` is used. For instance, `Review.commentCount` has a `maxAge` of 30, so the response to the below query would be cached for 30 seconds:

```gql
query {
  user(id: "1") {
    reviews {
      text
      stars
      commentCount
    }
  }
}
```

Whereas this would be cached for 60:

```gql
query {
  user(id: "1") {
    reviews {
      text
      stars
    }
  }
}
```

Similarly, if we didn’t select `User.reviews`, the hint on `User` would be used, and the below query would be cached for 10 minutes:

```gql
query {
  user(id: "1") {
    firstName
  }
}
```

Field cache hints override type hints, so for the below query, `Query.reviews`’s `maxAge: 120` would be used instead of `Review`’s `maxAge: 60`:

```gql
query {
  reviews {
    text
    stars
  }
}
```

Finally, neither of the below queries would be cached, as `Query.hello` doesn’t have a hint:

```gql
query {
  hello
}
```

```gql
query {
  reviews {
    text
    stars
  }
  hello
}
```

There’s one more directive argument: `scope`. It’s `PUBLIC` by default, and the other value is `PRIVATE`:

```gql
type Query {
  me: User! @cacheControl(maxAge: 300, scope: PRIVATE)
}
```

Apollo would set the response header to `Cache-Control: max-age=300, private`. Including [`private`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control#Directives) means that the response should only be stored in a browser’s cache, not a CDN. Because if a CDN stored `Query.me` (the current user’s account), other clients who made the query would get access to the first user’s account data.

Some advanced CDNs like [Cloudflare](https://blog.cloudflare.com/token-authentication-for-cached-private-content-and-apis/) actually support caching private responses by matching them to a single user with an authentication token. Similarly, Apollo Server supports caching responses through a function that returns a session ID or any unique string associated with a user—in the below code, we use the JWT:

```js
import responseCachePlugin from 'apollo-server-plugin-response-cache';

const server = new ApolloServer({
  ...,
  plugins: [
    responseCachePlugin({
      sessionId: requestContext => 
        requestContext.request.http.headers.get('authorization') || null,
    })
  ]
})
```

If Apollo caches a response with scope `PRIVATE`, it will also save the session ID. If the same request arrives later, and the same session ID is returned from this function, Apollo will use the cached response.

One issue with CDN caching is that many CDNs only cache GET requests, and GraphQL requests are usually made via POSTs. Apollo Server supports GET requests, and clients can switch to using them, but GET requests have the query in the URL, and sometimes queries are too long to fit in a URL. However, we can use automatic persisted queries (discussed [earlier](#performance)), which results in clients using cacheable GET requests with short URLs, regardless of the query length.
