## Further topics

> The code in this section isn’t included in the repository, but if you’d like to get it working inside our app, start with `git checkout 3_1.0.0` (tag [3_1.0.0](https://github.com/GraphQLGuide/guide/tree/1_1.0.0) contains all the code from previous sections).

* [Advanced querying](#advanced-querying)
* [Mutating](#mutating)
* [Subscriptions](#subscriptions)

### Advanced querying

The third argument to `useQuery()` is [`options`](https://v4.apollo.vuejs.org/guide-composable/query.html#options), with which we can set (statically or reactively):


- whether the query is disabled (`{ enabled: false }`), 
- the network policy (`{ fetchPolicy: 'cache-and-network' })`, and
- the `pollInterval`.

In addition to polling, we can manually re-send the query with the `refetch()` function:

```js
const { refetch } = useQuery(gql`
  query ChapterList {
    chapters {
      id
      number
      title
    }
  }
`)

...

refetch()
```

`useQuery()` also returns hooks:

```js
const { onResult, onError } = useQuery(gql` ... `)

onError(error => {
  console.log(error.graphQLErrors)
})
```

The hooks are called whenever a result is available or an error is received.

And `useQuery()` returns `fetchMore`, which we can use for pagination exactly as we did in [Chapter 6 > Paginating](../react/#paginating).

### Mutating

To send a mutation, we call [`useMutation()`](https://v4.apollo.vuejs.org/guide-composable/mutation.html#executing-a-mutation) in setup. It returns a function named `mutate`, which we can rename to `createReview` and provide to the component:

```js
import { useMutation } from '@vue/apollo-composable'
import gql from 'graphql-tag'

export default {
  setup () {
    const { mutate: createReview } = useMutation(gql`
      mutation AddReview($input: CreateReviewInput!) {
        createReview(input: $input) {
          id
          text
          stars
        }
      }
    `)

    return {
      createReview,
    }
  },
}
```

The mutation can be called with `createReview({ input: { text: 'Super', stars: 5 } })`. Alternatively, we can provide the variables in `options`, the second argument to `useMutation`, either statically like this:

```js
const { mutate: createReview } = useMutation(gql`
  mutation AddReview($input: CreateReviewInput!) {
    createReview(input: $input) {
      id
      text
      stars
    }
  }
`, {
  variables: {
    input: { text: 'Super', stars: 5 }
  }
})
```

Or dynamically as a function:

```js
const text = ref('')
const stars = ref(0)

const { mutate: createReview } = useMutation(gql`
  mutation AddReview($input: CreateReviewInput!) {
    createReview(input: $input) {
      id
      text
      stars
    }
  }
`, () => ({
  variables: {
    input: { text: text.value, stars: stars.value }
  }
}))
```

Just as with React’s mutations, if we include an `id` in the fields we select, and an object with that ID is in the cache, it will automatically be updated (for instance with the `editReview` mutation). And in other cases, we can update the cache with an `update()` function (see [Chapter 6 > Arbitrary updates](../react/#arbitrary-updates)).

`useMutation()` returns `loading` and `error`, as well as `onDone` and `onError` hooks, similar to `useQuery()`’s `onResult` and `onError`.

### Subscriptions

As we did in [Chapter 6 > Subscriptions](../react/#subscriptions), we first need to create a WebSocket link. Then we either call `useSubscription()` or `subscribeToMore()`. Here’s an example [`useSubscription()`](https://v4.apollo.vuejs.org/guide-composable/subscription.html#usesubscription):

```js
import { useSubscription } from '@vue/apollo-composable'
import { watch, ref } from '@vue/composition-api'

export default {
  setup() {
    const newReviews = ref([])

    const { result } = useSubscription(gql`
      subscription OnReviewCreated {
        reviewCreated {
          id
          text
          stars
        }
      }
    `)

    watch(result, (data) => newReviews.value.push(data.reviewCreated))

    return {
      newReviews,
    }
  },
}
```

`useSubscription()` returns a `result`, which we can watch for new data. In this case, we’re adding each new review to an array that’s returned for use in the template. 

`useSubscription()` has similar options (like a variables function) and return values (like `error` and `onResult`) to `useQuery()` and `useMutation()`.

[`subscribeToMore()`](https://v4.apollo.vuejs.org/guide-composable/subscription.html#subscribetomore) is returned by `useQuery()`, and we use it when we want to alter the results of a query with data from a subscription. In the below example, we query for the list of reviews, and we subscribe to `reviewCreated` to get new reviews to add to the list:

```js
import { useQuery } from '@vue/apollo-composable'

export default {
  setup() {
    const { result, subscribeToMore } = useQuery(
      gql`
        query ReviewsQuery {
          reviews {
            id
            text
            stars
          }
        }
    `
    )

    const reviews = useResult(result, [])

    subscribeToMore(() => ({
      document: gql`
        subscription OnReviewCreated {
          reviewCreated {
            id
            text
            stars
          }
        }
      `,
      updateQuery: (previousResult, { subscriptionData }) => {
        previousResult.reviews.push(subscriptionData.data.reviewCreated)
        return previousResult
      },
    }))

    return {
      reviews,
    }
  },
}
```

`updateQuery()` is called each time there’s a new subscription message, and it receives the previous query result and the subscription data. The returned result updates the `result` returned by `useQuery()`.