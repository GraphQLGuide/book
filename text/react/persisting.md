## Persisting

> If you’re jumping in here, `git checkout 24_0.2.0` (tag [`24_0.2.0`](https://github.com/GraphQLGuide/guide/tree/24_0.2.0)). Tag [`25_0.2.0`](https://github.com/GraphQLGuide/guide/tree/25_0.2.0) contains all the code written in this section.

The Apollo cache is cached in page-specific memory. When the webpage is closed or reloaded, the memory is cleared, which means the next time our app loads, the cache is empty—it has to fetch all the data it needs from the server again. **Persisting** is saving the data in the Apollo cache so that on future pageloads, we can restore the data to the cache, and we don’t have to fetch it. The main benefit is we can show the data to the user much faster than we could if we had to fetch it from the server. We can easily set this up with the [`apollo3-cache-persist`](https://github.com/apollographql/apollo-cache-persist) package:

[`src/components/App.js`](https://github.com/GraphQLGuide/guide/blob/25_0.2.0/src/components/App.js)

```js
import { persistCache } from 'apollo3-cache-persist'

import { cache } from '../lib/apollo'

persistCache({
  cache,
  storage: window.localStorage,
  maxSize: 4500000, // little less than 5 MB
  debug: true
})
```

The `persistCache()` function sets up persistence. `debug: true` has it log the size of the cache whenever it’s saved. The `storage` parameter has a number of options:

- `window.localStorage`
- `window.sessionStorage`
- [localForage](https://github.com/localForage/localForage): uses WebSQL or IndexedDB when available (most browsers), and falls back to `localStorage`
- `AsyncStorage` in React Native

`sessionStorage` is rarely used, since it is cleared when the browser is closed, and we usually want to cache data for a longer period. `localStorage` is simple to use and can consistently cache 5–10 MB. localForage is good for complex querying and larger sets of data. However, it is generally slower than `localStorage` for simple operations (and our operation is simple: it’s just saving and getting a single piece of data—the contents of the Apollo cache). We also have to import it from npm, which adds an additional [8 KB gzipped](https://bundlephobia.com/result?p=localforage@1.9.0) to our JavaScript bundle.

So we probably would only want to use localForage if we needed more than 5 MB of space. Let’s think about what kind of data our app queries for, how much space it takes up, and how much we might want of it. The largest thing the Guide queries for is section text, and according our new logging, each section takes up 2 KB:

```
[apollo-cache-persist] Persisted cache of size 34902
[apollo-cache-persist] Persisted cache of size 37014
```

> The second line was printed after hovering over a section link in the table of contents.

At this rate, we would fill up the cache after loading 5000 KB / 2 KB = 2500 sections, so 5 MB is currently plenty of room for us. Let’s go with `localStorage`. 

`maxSize` is the maximum number of bytes to persist. When `maxSize` is reached, it will stop saving data changes in the current session, and the next time the app starts, the cache will be cleared. We could set a different `maxSize` depending on which browser we’re in, but, for simplicity, let’s just assume we’re in the [lowest-quota browser](https://www.html5rocks.com/en/tutorials/offline/quota-research/), Safari, which can store 5 MB. We set `maxSize` to 4.5 MB to leave a little room for other uses (for instance our Auth0 library uses `localStorage`, and maybe we’ll decide later that we want to use it for something else).

Alright—we’ve covered all the arguments we used with `persistCache()` ([there are others](https://github.com/apollographql/apollo-cache-persist#additional-options) we’re not using). But we’re not done: the cache is getting persisted fine, but when a saved cache is restored on subsequent pageloads, our components are still querying, and they don’t get data until the query response comes back from the server. 

> We can verify this by changing the speed to “Slow 3G” in Network devtools and see A) the graphql requests being sent and B) both the first load and subsequent loads take a few seconds for the loading skeleton to be replaced with text.

The reason for this is that `persistCache()` takes time to complete (at least 150 ms on Loren’s computer), and, by that time, `@apollo/client` has already sent off our components’ queries. And when it does complete, our components don’t know that there’s new data in the cache. So when there’s a saved cache to restore, we want to wait for `persistCache()` to complete before rendering our components and triggering their queries. Then all of our `cache-first` queries will see that the data is in the cache and use it instead of requesting it from the server. We can tell if there’s a saved cache by checking in `localStorage` for the key that `persistCache()` uses, `apollo-cache-persist`:

[`src/components/App.js`](https://github.com/GraphQLGuide/guide/blob/25_0.2.0/src/components/App.js)

```js
const cacheHasBeenSaved = !!localStorage.getItem('apollo-cache-persist')

export default () => {
  const [loadingFromCache, setLoadingFromCache] = useState(cacheHasBeenSaved)

  useEffect(() => {
    async function persist() {
      await persistCache({
        cache,
        storage: window.localStorage,
        maxSize: 4500000, // little less than 5 MB
        debug: true,
      })

      setLoadingFromCache(false)
    }

    persist()
  }, [])

  if (loadingFromCache) {
    return null
  }

  return (
    <div className="App">
      ...
    </div>
  )
}
```

Now let’s test it out. When we load the app for the first time, we see something like this:

```
[apollo-cache-persist] No stored cache to restore
[apollo-cache-persist] Persisted cache of size 17005
[apollo-cache-persist] Persisted cache of size 17129
```

The first message prints out on load, and the second appears a second after the page content appears, saying that the Apollo cache was saved to `localStorage` and what its size was. The third appears shortly after that, meaning the cache was re-saved, and the size only goes up by about a hundred bytes. What caused the re-save? We must have made another request to the server after the initial set of requests. We can check the Network tab to see what the last GraphQL request was, and we see that it’s the `ViewedSection` mutation. But why would that mutation change the Apollo cache? It’s not a query fetching data. Let’s look at the cache to see. In the Cache tab of Apollo devtools, there’s a `ROOT_MUTATION`:

![ROOT_MUTATION key in Apollo cache](../img/root-mutation.png)

We see that our mutation is indeed in the cache, and it resolved to a `Section` object. Is the entire cache, including mutation results, persisted? We can look at what’s saved by entering this in the browser console:

```js
JSON.parse(localStorage.getItem('apollo-cache-persist'))
```

![ROOT_MUTATION property in localStorage](../img/root-mutation-console.png)

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

So the persisting is working correctly, but, if we test the app further, we find that we can’t log out! Well, technically, we can, but it doesn’t look like we are—after clicking “Sign out” on the profile page, the site reloads and we still see our GitHub profile photo on the top-right, and we can still click it to see our profile. Why is that? 

On load, the app reads all the queries from the cache, including the `currentUser` query, which was saved to the cache when we logged in. It’s still there, along with any private data we had, like our email address. To fix this, we can clear the cache when we log out. In order to clear the cache, we need to use a different API from `apollo3-cache-persist`. We’ve been using the basic API, `persistCache()`. The more advanced API is [`CachePersistor`](https://github.com/apollographql/apollo-cache-persist#advanced-usage):

```js
const persistor = new CachePersistor(options)
```

And then we call methods on the `persistor` object when we want things to happen: for instance, `persistor.restore()` when we want to restore the cache (which `persistCache()` did automatically, but now we need to do ourselves). So let’s update `App.js`:

[`src/components/App.js`](https://github.com/GraphQLGuide/guide/blob/25_0.2.0/src/components/App.js)

```js
import { CachePersistor } from 'apollo3-cache-persist'

import { cache, apollo } from '../lib/apollo'

const persistor = new CachePersistor({
  cache,
  storage: window.localStorage,
  maxSize: 4500000, // little less than 5 MB
  debug: true,
})

apollo.onResetStore(() => persistor.purge())

const cacheHasBeenSaved = !!localStorage.getItem('apollo-cache-persist')

export default () => {
  const [loadingFromCache, setLoadingFromCache] = useState(cacheHasBeenSaved)

  useEffect(() => {
    async function persist() {
      await persistor.restore()
      setLoadingFromCache(false)
    }

    persist()
  }, [])
```

This line deletes our data stored in LocalStorage when the cache is reset:

```js
apollo.onResetStore(() => persistor.purge())
```

And since we call `apollo.resetStore()` on logout in `src/lib/auth.js`, clicking “Sign out” clears the cache, and we see “Sign in” instead of our photo! ✅

But there’s another bug! 😅 When we’re signed out, we get truncated section content back from the API. This gets saved in the cache, and when we sign in, the current section gets refetched (due to `apollo.reFetchObservableQueries()` being called in `auth.js` on login). But if we looked at more than the current section before signing in, the other sections don’t get refetched, because there are no current (“observable”) queries for them. So they get stuck with the truncated content—when we revisit them, the truncated content is loaded from the cache. We can make sure they’re updated either by:

- changing the section content queries’ fetch policy to [`cache-and-network`](https://www.apollographql.com/docs/react/data/queries/#configuring-fetch-logic), or
- replacing `apollo.reFetchObservableQueries()` with `apollo.resetStore()`

The second would be simpler, but let’s do the first, because it also fixes another issue: when data is cached, it’s saved until it reaches `maxSize`, which could take a long time. The book content will periodically be updated, and we want our users to see the updated content. With `cache-and-network`, the latest version will always be fetched from the server. We make the change by adding the `fetchPolicy` option to our `useQuery()` hook:

[`src/components/Section.js`](https://github.com/GraphQLGuide/guide/blob/25_0.2.0/src/components/Section.js)

```js
const { data, loading } = useQuery(query, {
  variables,
  fetchPolicy: 'cache-and-network',
})
```

And we can test with these steps:

- Sign out
- Click “Preface” and then “Introduction”
- Sign in
- Click “Preface”

The preface content is no longer truncated, but we see a loading skeleton before the full content appears. So `loading` must be initially true, even though we have the truncated preface content in the cache. This is because `loading` is true whenever there is a network request in progress (which there is, because we’re using `cache-and-network`). And we see the skeleton when loading any section—even those with full content in the cache. It’s as if we don’t even have a cache anymore. To stop showing the skeleton, we have to go by whether there’s data instead of using Apollo’s `loading` variable. So let’s set `loading` ourselves:

```js
const { data } = useQuery(query, {
  variables,
  fetchPolicy: 'cache-and-network',
})

let section, chapter, loading

// eslint-disable-next-line default-case
switch (query) {
  case SECTION_BY_ID_QUERY:
    section = {
      ...state.section,
      content: get(data, 'section.content'),
      views: get(data, 'section.views'),
      scrollY: get(data, 'section.scrollY'),
    }
    chapter = state.chapter
    loading = !get(data, 'section')
    break
  case SECTION_BY_CHAPTER_TITLE_QUERY:
    section = get(data, 'chapterByTitle.section')
    chapter = {
      ...get(data, 'chapterByTitle'),
      number: null,
    }
    loading = !get(data, 'chapterByTitle')
    break
  case SECTION_BY_NUMBER_QUERY:
    section = get(data, 'chapterByNumber.section')
    chapter = get(data, 'chapterByNumber')
    loading = !get(data, 'chapterByNumber')
    break
}
```

And now it works! When we revisit the preface, it shows the truncated content in the cache first, and then shows the full content fetched from the server.

