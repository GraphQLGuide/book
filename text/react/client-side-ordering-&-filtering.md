## Client-side ordering & filtering

> If you’re jumping in here, `git checkout 18_1.0.0` (tag [`18_1.0.0`](https://github.com/GraphQLGuide/guide/tree/18_1.0.0)). Tag [`18-filtering_1.0.0`](https://github.com/GraphQLGuide/guide/tree/18-filtering_1.0.0) contains all the code written in this section.

We learned in the [pagination section](paginating.md#skip-&-limit) that by default, Apollo creates a new cache entry when arguments change. To get pagination working, we configured the cache to only use a single entry with `keyArgs: false`. In the last section, we changed it to `keyArgs: ['orderBy']` so that we'd have two cache entries: one for each possible value of the `orderBy` argument.

In this section, we’ll add arguments to our `reviews` query that filter out some reviews. We’ll look at different options for `keyArgs` and add a [`read`](https://www.apollographql.com/docs/react/caching/cache-field-behavior/#handling-pagination) function to our field policy.

The last two available arguments for `Query.reviews` are `minStars: Int` and `minSentences: Int`. They filter on the number of stars and the number of sentences in the review text. Let’s add them to our query, along with select inputs to change the values. First, the query:

[`src/graphql/Review.js`](https://github.com/GraphQLGuide/guide/blob/18-filtering_1.0.0/src/graphql/Review.js)

```js
export const REVIEWS_QUERY = gql`
  query ReviewsQuery(
    $after: ObjID
    $limit: Int
    $orderBy: ReviewOrderBy
    $minStars: Int
    $minSentences: Int
  ) {
    reviews(
      after: $after
      limit: $limit
      orderBy: $orderBy
      minStars: $minStars
      minSentences: $minSentences
    ) {
      ...ReviewEntry
    }
  }
  ${REVIEW_ENTRY}
`
```

Next, the UI:

[`src/components/Reviews.js`](https://github.com/GraphQLGuide/guide/blob/18-filtering_1.0.0/src/components/Reviews.js)

```js
export default () => {
  const [filters, setFilters] = useState({
    orderBy: 'createdAt_DESC',
    minStars: '1',
    minSentences: '1',
  })

  ...

  return (
    <main className="Reviews mui-fixed">
      <div className="Reviews-header-wrapper">
        <header className="Reviews-header">
          ...

          <FormControl>
            <Select
              value={filters.orderBy}
              onChange={(e) =>
                setFilters({ ...filters, orderBy: e.target.value })
              }
              displayEmpty
            >
              <MenuItem value="createdAt_DESC">Newest</MenuItem>
              <MenuItem value="createdAt_ASC">Oldest</MenuItem>
            </Select>

            <Select
              value={filters.minStars}
              onChange={(e) =>
                setFilters({ ...filters, minStars: e.target.value })
              }
              displayEmpty
            >
              <MenuItem value="1">1+ stars</MenuItem>
              <MenuItem value="2">2+ stars</MenuItem>
              <MenuItem value="3">3+ stars</MenuItem>
              <MenuItem value="4">4+ stars</MenuItem>
              <MenuItem value="5">5 stars</MenuItem>
            </Select>

            <Select
              value={filters.minSentences}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  minSentences: e.target.value,
                })
              }
              displayEmpty
            >
              <MenuItem value="1">1+ sentences</MenuItem>
              <MenuItem value="2">2+ sentences</MenuItem>
              <MenuItem value="3">3+ sentences</MenuItem>
              <MenuItem value="4">4+ sentences</MenuItem>
              <MenuItem value="5">5+ sentences</MenuItem>
            </Select>
          </FormControl>
        </header>
      </div>

      <ReviewList {...filters} />
```

We pass all three arguments to `ReviewList`, which makes the query:

[`src/components/ReviewList.js`](https://github.com/GraphQLGuide/guide/blob/18-filtering_1.0.0/src/components/ReviewList.js)

```js
export default ({ orderBy, minStars, minSentences }) => {
  const variables = { limit: 10, orderBy }
  if (minStars) {
    variables.minStars = parseInt(minStars)
  }
  if (minSentences) {
    variables.minSentences = parseInt(minSentences)
  }

  const { data, fetchMore, networkStatus } = useQuery(REVIEWS_QUERY, {
    variables,
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
  })
```

If we test out our new code by loading [`localhost:3000/reviews`](http://localhost:3000/reviews) and selecting "5+ sentences," we find that the list of reviews shown on the page doesn’t change! This is due to a combination of two settings:

- The default cache-first fetch policy, in which Apollo first checks the cache for results, and if there are results, doesn’t query the server.
- `keyArgs: ['orderBy']`, which tells Apollo to just create new cache entries for `Query.reviews` when there are new values of the `orderBy` argument. 

When we select "5+ sentences," we’re updating the `minSentences` argument, but the `orderBy` argument stays the same, so Apollo looks in the cache for `Query.reviews` and finds the data saved from the query with the same `orderBy` that happened on pageload. Apollo returns that data and doesn’t query the server for more.

Now we know why the list of reviews isn’t changing. How can we get it to change? 

- Change the fetch policy to `network-only` and remove our `merge` function. Then whenever we changed an argument, Apollo would send the request to the server and replace the cache entry with the new result. This would result in a delay before the user sees the UI update, and it would break our pagination.
- Use `keyArgs: ['orderBy', 'minStars', 'minSentences']`. Then Apollo would create a new cache entry for each new set of ordering and filtering arguments (but not for pagination arguments). This would result in a delay in seeing results the first time we changed a filter, and then immediate updates when going back to a filter choice that’s cached. It would also result in a lot of cache entries with overlapping reviews.
- Use `keyArgs: false`, `fetchPolicy: cache-and-network`, and a [`read`](https://www.apollographql.com/docs/react/caching/cache-field-behavior/#handling-pagination) function. All reviews are placed into a single cache entry and we use a `read` function to order and filter reviews being read from the cache. Apollo will first display anything in the cache that matches the current arguments and will also send the request to the server in case there are more or updated results. 

The last is the solution that’s recommended for most lists that have sorting and filtering arguments, and it’s the one we’ll implement. Let’s start with the `read` function, which we add to the field policy:

[`src/lib/apollo.js`](https://github.com/GraphQLGuide/guide/blob/18-filtering_1.0.0/src/lib/apollo.js)

```js
import { countSentences } from './helpers'

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        reviews: {
          merge ...,
          keyArgs: false,
          read(
            reviewRefs,
            { args: { orderBy, minStars, minSentences }, readField }
          ) {
            if (!reviewRefs) {
              return reviewRefs
            }

            const filtered = reviewRefs.filter((reviewRef) => {
              const stars = readField('stars', reviewRef),
                text = readField('text', reviewRef)
              return stars >= minStars && countSentences(text) >= minSentences
            })

            filtered.sort((reviewRefA, reviewRefB) => {
              const createdAtA = readField('createdAt', reviewRefA),
                createdAtB = readField('createdAt', reviewRefB)

              if (orderBy === 'createdAt_DESC') {
                return createdAtB - createdAtA
              } else {
                return createdAtA - createdAtB
              }
            })

            return filtered
          },
        },
      },
    },
  },
})
```

When Apollo Client reads data from the cache to provide to our `useQuery()` hooks, it will first go through this function. The first argument we receive is the list of review refs in the cache. The second argument contains the query’s `args` as well as the same helper functions provided to the `merge` function. First, we filter out reviews that don’t fit our two filter arguments. Then we sort the reviews by their `createdAt` according to the `orderBy` arg.

We use a `countSentences` helper function:

[`src/lib/helpers.js`](https://github.com/GraphQLGuide/guide/blob/18-filtering_1.0.0/src/lib/helpers.js)

```js
export const countSentences = (text) => {
  const matches = text.match(/\w[.?!](\s|$)/g)
  return matches ? matches.length : 1
}
```

And finally, we need to update the fetch policy:

[`src/components/ReviewList.js`](https://github.com/GraphQLGuide/guide/blob/18-filtering_1.0.0/src/components/ReviewList.js)

```js
const { data, fetchMore, networkStatus } = useQuery(REVIEWS_QUERY, {
  variables,
  errorPolicy: 'all',
  notifyOnNetworkStatusChange: true,
  fetchPolicy: 'cache-and-network',
})
```

And we’re done! Now, when we change a filter, we’ll immediately get any matching cached reviews, and then might see additional reviews when the query result arrives from the server. We’ll also see this behavior when changing the sort order: when we switch from the default "Newest" to "Oldest", we first see the newest 10 reviews in reverse order (so the oldest of the reviews in the cache), and then the absolute oldest reviews arrive from the server and are displayed first.

One last thing to note is that we can store any data structure in the cache—it doesn’t have to be an array. We just have to have a `read` function that returns an array. The runtime of our merge function could be improved by using a map: instead of returning an array to be stored in the cache, we return an object with `id` keys and review object values. Then we don’t have to search through an array to figure out whether an incoming review is already in the cache—we just add it to the map, and, if there was an existing object, it gets overwritten. We would need to modify our `read` function accordingly: the `reviewRefs` first argument coming from the cache would be a map, so we would do `Object.values(reviewRefs)` to get an array for filtering and sorting.

