---
title: Persisting
---

# Persisting

> If you’re jumping in here, `git checkout 2_1.0.0` (tag [2_1.0.0](https://github.com/GraphQLGuide/guide/tree/2_1.0.0), or compare [2...3](https://github.com/GraphQLGuide/guide/compare/2_1.0.0...3_1.0.0))

While most aspects of using Apollo Client are the same between React and React Native, one thing that’s different is that React Native doesn’t have a global `window` variable. For example, in [Chapter 6 > REST](../react/advanced/rest.md) we used `window.navigator.geolocation.getCurrentPosition()`. Running that code in React Native would throw an error. Instead, we would use `Location.getCurrentPositionAsync()` from the [`expo-location`](https://docs.expo.io/versions/v39.0.0/sdk/location/#locationgetcurrentpositionasyncoptions) package.

We also used `window` in [Chapter 6 > Persisting](../react/advanced/persisting.md):

```js
persistCache({
  cache,
  storage: window.localStorage,
})
```

We can substitute `window.localStorage` with `AsyncStorage` from [`@react-native-community/async-storage`](https://react-native-community.github.io/async-storage/), and we can use `<AppLoading />` to keep the splash screen up until `persistCache()` has completed:

[`App.js`](https://github.com/GraphQLGuide/guide-react-native/blob/3_1.0.0/App.js)

```js
import React, { useState, useEffect } from 'react'
import AsyncStorage from '@react-native-community/async-storage'
import { persistCache } from 'apollo3-cache-persist'
import { AppLoading } from 'expo'

const cache = new InMemoryCache()

const client = new ApolloClient({
  uri: 'https://api.graphql.guide/graphql',
  cache,
})

export default function App() {
  const [loadingCache, setLoadingCache] = useState(true)

  useEffect(() => {
    persistCache({
      cache,
      storage: AsyncStorage,
    }).then(() => setLoadingCache(false))
  }, [])

  if (loadingCache) {
    return <AppLoading />
  }

  return (
    <ApolloProvider client={client}>
      ...
    </ApolloProvider>
  )
}
```

Now when we navigate to a chapter, reload the app, and navigate to the same chapter, we won’t see a spinner. The app will also display the home screen sooner, since it’s just waiting for the cached data to be read from `AsyncStorage`, instead of waiting for the data from the server.

The last thing we probably want to update is the Apollo fetch policy. It defaults to `cache-first`: first looking for the data in the cache, and if it’s not there, fetching from the server. With a persisted cache, after the first time the data is queried, the data will always be there, so we’ll never again fetch from the server. The problem is that if the data ever changes on the server, the app will never get the new data. In our case, the chapter or section lists may change, and we want the user to get the most recent version. We can set the fetch policy to `cache-and-network` to both return data from the cache *and* from the network (if the network data is different). We can set the policy either in individual queries (in the second argument to `useQuery()`) or set a new default for all queries:

[`App.js`](https://github.com/GraphQLGuide/guide-react-native/blob/3_1.0.0/App.js)

```js
const client = new ApolloClient({
  uri: 'https://api.graphql.guide/graphql',
  cache,
  defaultOptions: { watchQuery: { fetchPolicy: 'cache-and-network' } },
})
```

