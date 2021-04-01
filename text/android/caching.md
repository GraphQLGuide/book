# Caching

> If you’re jumping in here, `git checkout 3_0.1.0` (tag [3_0.1.0](https://github.com/GraphQLGuide/guide-android/tree/3_0.1.0), or compare [3...4](https://github.com/GraphQLGuide/guide-android/compare/3_0.1.0...4_0.1.0))

In the JavaScript Apollo Client, caching is enabled by default. In Apollo Android, it isn’t—we might notice that when we go back and forth between the first and second page, the second page sometimes shows a loading spinner as it waits on the response from the server. 

There are three types of caching we can enable:

- [HTTP caching](https://www.apollographql.com/docs/android/essentials/http-cache/): Whenever an HTTP request with a query operation is sent to the server, the response is saved for a certain configurable period of time in a file. When subsequent identical requests are made, Apollo will check the file, find the saved response, and return it instead of sending the request to the server.
- [Normalized caching](https://www.apollographql.com/docs/android/essentials/normalized-cache/): Take objects out of query responses and save them by type and ID. If an object that is part of another query is changed, any code watching that query is given the updated results.
  - In memory: Use the [LruNormalizedCacheFactory](https://www.apollographql.com/docs/android/essentials/normalized-cache/#storing-your-data-in-memory) class to store the cached object in memory.
  - In SQLite: Use the [SqlNormalizedCacheFactory](https://www.apollographql.com/docs/android/essentials/normalized-cache/#persisting-your-data-in-a-sqlite-database) class to persist the cache between app restarts.

We can also [combine Lru and Sql in a chain](https://www.apollographql.com/docs/android/essentials/normalized-cache/#chaining-caches).

When querying, we can specify a fetch policy with [ResponseFetchers](https://github.com/apollographql/apollo-android/blob/master/apollo-runtime/src/main/java/com/apollographql/apollo/fetcher/ApolloResponseFetchers.java):

- `CACHE_ONLY`: Try to resolve the query from the cache.
- `NETWORK_ONLY`: Try to resolve from the network (by sending the query to the server).
- `CACHE_FIRST` (default): First try the cache, and if the result isn’t there, use the network.
- `NETWORK_FIRST`: First try the network, and if we don’t get a response from the server, look in the cache.
- [`CACHE_AND_NETWORK`](https://github.com/apollographql/apollo-android/blob/9a77b4adf79bfc512f21fb059e41b25407dee5b4/apollo-runtime/src/main/java/com/apollographql/apollo/fetcher/ApolloResponseFetchers.java#L39-L46) (only available with a normalized cache): First try reading from the cache. Then, even if we found the data in the cache, make the network request.

We can improve the efficiency of normalization by [providing functions](https://www.apollographql.com/docs/android/essentials/normalized-cache/#specifying-your-object-ids) that return an object’s key. We can also read and write [directly to the cache](https://www.apollographql.com/docs/android/essentials/normalized-cache/#interacting-with-the-cache).

To add an in-memory cache to our app, we make a small addition to `data/Apollo.kt`:

`app/src/main/java/guide/graphql/toc/data/Apollo.kt`

```kt
package guide.graphql.toc.data

import com.apollographql.apollo.ApolloClient
import com.apollographql.apollo.cache.normalized.lru.EvictionPolicy
import com.apollographql.apollo.cache.normalized.lru.LruNormalizedCacheFactory

object Apollo {
  val client: ApolloClient by lazy {
    val cacheFactory =
      LruNormalizedCacheFactory(EvictionPolicy.builder().maxSizeBytes(10 * 1024 * 1024).build())

    ApolloClient.builder()
      .serverUrl("https://api.graphql.guide/graphql")
      .normalizedCache(cacheFactory)
      .build()
  }
}
```

We create a `cacheFactory` that starts evicting (deleting) the least recently used data from the cache once the cache size grows to 10 MB. Now when we go back and forth between the chapter list and the Chapter 2 section list, there’s no delay after the first time the sections are loaded. 

