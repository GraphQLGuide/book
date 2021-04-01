## Review subscriptions

> If you’re jumping in here, `git checkout 21_1.0.0` (tag [`21_1.0.0`](https://github.com/GraphQLGuide/guide/tree/21_1.0.0)). Tag [`22_1.0.0`](https://github.com/GraphQLGuide/guide/tree/22_1.0.0) contains all the code written in this section.

Section contents:

* [Subscription component](#subscription-component)
* [Add new reviews](#add-new-reviews)
* [Update on edit and delete](#update-on-edit-and-delete)

Early on in this chapter we set up our [first subscription](querying.md#subscriptions) for an updated GitHub star count. That was a very simple example—each event we received from the server contained a single integer:

```gql
type Subscription {
  githubStars: Int
}
```

In this section we’ll see what it’s like to work with more complex subscriptions:

```gql
type Subscription {
  reviewCreated: Review
  reviewUpdated: Review
  reviewDeleted: ObjID
}
```

The first subscription sends a response event when someone creates a new review. `reviewUpdated` fires whenever a review’s text or stars are edited, and `reviewDeleted` fires when one is deleted. For the first two, the events contain the review created/updated. For the last, it contains just the review’s id.

In general, we recommend re-querying in lieu of subscriptions—either by [polling](querying.md#polling) or manually re-running the query with [`client.query()`](https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.query). In our app, it would be sufficient and easier to add polling to our reviews query:

`src/components/ReviewList.js`

```js
const { data, fetchMore, networkStatus } = useQuery(REVIEWS_QUERY, {
  variables: { limit: 10, orderBy },
  errorPolicy: 'all',
  notifyOnNetworkStatusChange: true,
  pollInterval: 5000
})
```

If we didn’t want to learn more about subscriptions, we’d just be doing the above.

We recommend using subscriptions when polling becomes a performance bottleneck: perhaps the amount of data being queried is large, or updates are needed every 500ms and that many queries tax the servers. Or it’s something real-time like a game, and the lowest possible latency is required (sending a message over an already-established WebSocket connection is faster than even `pollInterval: 1`, since polling creates a new network connection for each request).

### useSubscription

The first feature we’ll build is a notification when the user is on the reviews page and a new review is created:

[`src/components/Reviews.js`](https://github.com/GraphQLGuide/guide/blob/22_1.0.0/src/components/Reviews.js)

```js
import ReviewCreatedNotification from './ReviewCreatedNotification'

<main className="Reviews mui-fixed">
  ...

  <ReviewList orderBy={orderBy} />

  <ReviewCreatedNotification />
```

Now that we’ve got a `<ReviewCreatedNotification>` on the reviews page, what do we put in it? Apollo has a [`useSubscription()`](https://www.apollographql.com/docs/react/api/react/hooks/#usesubscription) hook that provides new data whenever an event is received from the server:

[`src/components/ReviewCreatedNotification.js`](https://github.com/GraphQLGuide/guide/blob/22_1.0.0/src/components/ReviewCreatedNotification.js)

```js
import React from 'react'
import { useSubscription } from '@apollo/client'
import get from 'lodash/get'

import { ON_REVIEW_CREATED_SUBSCRIPTION } from '../graphql/Review'

export default () => {
  const { data } = useSubscription(ON_REVIEW_CREATED_SUBSCRIPTION)
  console.log(data)
  return null
}
```

We’ll see what the event looks like in a moment, but first we need the subscription itself:

[`src/graphql/Review.js`](https://github.com/GraphQLGuide/guide/blob/22_1.0.0/src/graphql/Review.js)

```js
export const ON_REVIEW_CREATED_SUBSCRIPTION = gql`
  subscription onReviewCreated {
    reviewCreated {
      ...ReviewEntry
    }
  }
  ${REVIEW_ENTRY}
`
```

And now we can see what happens when we create a review:

- Apollo sends the `createReview` mutation to the server
- The server sends a subscription response event with data
- `useSubscription()` gives us the data, and we log it:

```json
{
  "reviewCreated": {
    "id": "5c4b732bcd0a7103471de19b",
    "text": "It's good",
    "stars": 4,
    "createdAt": 1548448555245,
    "favorited": false,
    "author": {
      "id": "5a3cd78368e9c40096ab5e3f",
      "name": "Loren Sands-Ramshaw",
      "photo": "https://avatars2.githubusercontent.com/u/251288?v=4",
      "username": "lorensr",
      "__typename": "User"
    },
    "__typename": "Review"
  }
}
```

The data is in the same format we would expect if we made a Query named `reviewCreated`. We can also see the data arriving from the server. First let’s see what it looks like initially by opening the Network tab of devtools, refreshing the page, scrolling down to “subscriptions” on the left, and selecting the “Frames” tab:

![Four websocket messages](../img/subscription-start.png)

We see that the first message the client always sends once the websocket is established has `type: "connection_init"`. Then it sends two messages, each with an operation and sequential `id` numbers. They are `type: "start"` because they are starting subscriptions. The message with `"id": "1"` has our GitHub stars subscription and the message with `id: "2"` has our `onReviewCreated` subscription, which we see in `payload.query`. There’s also a `payload.variables` field that we’re not using. If we were subscribing to a review’s comments, we might use a `commentCreated(review: ObjID!): Comment` subscription, in which case we would see:

```js
{
  id: "3",
  payload: {
    operationName: "onCommentCreated",
    query: "subscription onCommentCreated {↵ commentCreated(review: $review) {↵ id↵ text↵} }",
    variables: { review: "5c4bb280cd0a7103471de19e" }
  },
  type: "start"
}
```

The last websocket message is from the server and has `type: "connection_ack"`, which means that the server acknowledges that it has received the `connection_init` message.

Now let’s create a review and see what happens:

![Message containing the new review appears](../img/websocket-data.png)

We receive another message from the server—this one with `type: "data"`, meaning it contains data! 😜 The ID is 2, telling us that it’s an event from the `onReviewCreated` subscription (which we sent to the server earlier with the matching `id: "2"`). And this time the `payload` is the same `data` object that the `<Subscription>` component gave us and we logged to the console. 

But our users usually won’t see messages logged to the console, so let’s think about how we want to display the new review notification to the user. We could `window.alert()`, but that requires dismissal and is annoying 😆. We could put it on the page—for example in the header—but then the notification would be stuck there until either a new subscription event arrived or the page got re-rendered. It doesn’t need to be shown for long, taking up the user’s brainspace and annoying them (at least Loren is annoyed when he can’t dismiss a notification 😄). So let’s show a temporary message somewhere off to the side. We can search the Material UI [component library](https://material-ui.com/demos/app-bar/) and find the component meant for this purpose—the [Snackbar](https://material-ui.com/demos/snackbars/). We control whether it’s visible with an `open` prop, so we need state for that, and the `onClose` prop gets called when the user dismisses the Snackbar.

[`src/components/ReviewCreatedNotification.js`](https://github.com/GraphQLGuide/guide/blob/22_1.0.0/src/components/ReviewCreatedNotification.js)

```js
import React, { useState } from 'react'
import { useSubscription } from '@apollo/client'
import { Snackbar } from '@material-ui/core'
import get from 'lodash/get'

import { ON_REVIEW_CREATED_SUBSCRIPTION } from '../graphql/Review'

export default () => {
  const [isOpen, setIsOpen] = useState(false)

  const { data } = useSubscription(ON_REVIEW_CREATED_SUBSCRIPTION, {
    onSubscriptionData: () => {
      setIsOpen(true)
      setTimeout(() => setIsOpen(false), 5000)
    },
  })

  const review = get(data, 'reviewCreated')
  return review ? (
    <Snackbar
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      open={isOpen}
      onClose={() => setIsOpen(false)}
      message={`New review from ${review.author.name}: ${review.text}`}
    />
  ) : null
}
```

We use `isOpen` for the state. We want to set `isOpen` to true whenever we receive a new event, so we use the `onSubscriptionData` option. And we want to automatically dismiss the Snackbar after a few seconds, so we use a `setTimeout()`. Now when we create a review, a message slides up from the bottom of the window, stays for a few seconds, and then slides back down!

![Review created notification](../img/review-created.gif)
[*gif: Review created notification*](http://res.cloudinary.com/graphql/guide/review-created.gif)

### Add new reviews

Currently when we create a review, the new review card appears at the top of the list on our page because of our optimistic update. But other users just see the notification—the review card doesn’t appear in the list. 
Let’s figure out how to get it there.

We could use our existing `ON_REVIEW_CREATED_SUBSCRIPTION` to add the new review to the list. `onSubscriptionData` is called with these arguments: `{ client, subscriptionData }`, so we could get the new review (`subscriptionData.data.reviewCreated`) and write it to the cache using `client.writeQuery()`. 

However, there’s another way that’s better suited to this case: the same `subscribeToMore` prop we used for `StarCount.js`. The query we want to use `subscribeToMore` with is `REVIEWS_QUERY`, our list of reviews. We get the previous query result and the subscription data, and then we return a new query result:

`src/components/ReviewList.js`

```js
import {
  REVIEWS_QUERY,
  ON_REVIEW_CREATED_SUBSCRIPTION,
} from '../graphql/Review'

export default ({ orderBy }) => {
  const { data, fetchMore, networkStatus, subscribeToMore } = useQuery(
    REVIEWS_QUERY,
    {
      variables: { limit: 10, orderBy },
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
    }
  )

  useEffect(() => {
    subscribeToMore({
      document: ON_REVIEW_CREATED_SUBSCRIPTION,
      updateQuery: (prev, { subscriptionData }) => {
        // Assuming infinite reviews, we don't need to add new reviews to
        // Oldest list
        if (orderBy === 'createdAt_ASC') {
          return prev
        }

        const newReview = subscriptionData.data.reviewCreated
        return {
          reviews: [newReview, ...prev],
        }
      },
    })
  }, [orderBy, subscribeToMore])
```

Here we add the new review to the beginning of the list. This code actually doesn’t work! It *would* work if we didn’t have a `merge` function on `Query.reviews`. Since we do, the `merge` function removes all the duplicate reviews (`...prev`) and adds the new review to the *end* of the list. 

TODO cc @benjamn https://github.com/apollographql/apollo-feature-requests/issues/270

```js
useEffect(() => {
  subscribeToMore({
    document: ON_REVIEW_CREATED_SUBSCRIPTION,
    updateQuery: (prev, { subscriptionData }) => {
      cache.modify({
        fields: {
          reviews(existingReviewRefs = [], { storeFieldName }) {
            if (!storeFieldName.includes('createdAt_DESC')) {
              return existingReviewRefs
            }

            const newReview = subscriptionData.data.reviewCreated

            const newReviewRef = cache.writeFragment({
              data: newReview,
              fragment: gql`
                fragment NewReview on Review {
                  id
                  text
                  stars
                  createdAt
                  favorited
                  author {
                    id
                  }
                }
              `,
            })

            return [newReviewRef, ...existingReviewRefs]
          },
        },
      })
      return prev
    },
  })
}, [orderBy, subscribeToMore])
```



Now when we’re viewing the most recent reviews (`createdAt_DESC`) and receive a subscription event, we add the new review to the front of the list of reviews, and it appears first on the page. We can test this out by opening a second browser tab, creating a new review in that tab, and seeing it immediately appear in the first tab.

### Update on edit and delete

It would also be nice to see updates to reviews when someone else edits or deletes them. If we look at the Playground schema, we can see that the server has more subscription options related to reviews: `reviewUpdated: Review` and `reviewDeleted: ObjID`. So let’s use ’em! Step 1 is writing the subscription documents and step 2 is adding more calls to `subscribeToMore`. (`subscribeToMore` doesn’t mean that we’re necessarily subscribing to new documents—just that we’re subscribing to more related data, and, in this case, the data is either the review that was updated or the ID of the review that was deleted.) First, the documents:

[`src/graphql/Review.js`](https://github.com/GraphQLGuide/guide/blob/22_1.0.0/src/graphql/Review.js)

```js
export const ON_REVIEW_UPDATED_SUBSCRIPTION = gql`
  subscription onReviewUpdated {
    reviewUpdated {
      ...ReviewEntry
    }
  }
  ${REVIEW_ENTRY}
`

export const ON_REVIEW_DELETED_SUBSCRIPTION = gql`
  subscription onReviewDeleted {
    reviewDeleted
  }
`
```

Because the return type of `reviewDeleted` is a scalar (a custom one called `ObjID`), we don’t write a selection set. `subscriptionData.data.reviewDeleted` will be an `ObjID` string, not an object. Next, `subscribeToMore`:

TODO cc @benjamn https://github.com/apollographql/apollo-feature-requests/issues/270
convert below to hooks

[`src/components/ReviewList.js`](https://github.com/GraphQLGuide/guide/blob/22_1.0.0/src/components/ReviewList.js)

```js
import reject from 'lodash/reject'

import {
  REVIEWS_QUERY,
  REVIEW_ENTRY,
  ON_REVIEW_CREATED_SUBSCRIPTION,
  ON_REVIEW_UPDATED_SUBSCRIPTION,
  ON_REVIEW_DELETED_SUBSCRIPTION
} from '../graphql/Review'

...

const withReviews = graphql(REVIEWS_QUERY, {
  options: ...,
  props: ({
    data: { reviews, fetchMore, networkStatus, subscribeToMore },
    ownProps: { orderBy }
  }) => ({
    reviews,
    networkStatus,
    loadMoreReviews: ...,
    subscribeToReviewUpdates: () => {
      subscribeToMore({
        document: ON_REVIEW_CREATED_SUBSCRIPTION,
        updateQuery: ...
      })
      subscribeToMore({
        document: ON_REVIEW_UPDATED_SUBSCRIPTION,
        updateQuery: (prev, { subscriptionData }) => {
          const updatedReview = subscriptionData.data.reviewUpdated
          return {
            reviews: prev.reviews.map(review =>
              review.id === updatedReview.id ? updatedReview : review
            )
          }
        }
      })
      subscribeToMore({
        document: ON_REVIEW_DELETED_SUBSCRIPTION,
        updateQuery: (prev, { subscriptionData }) => {
          const deletedId = subscriptionData.data.reviewDeleted
          return {
            reviews: reject(prev.reviews, { id: deletedId })
          }
        }
      })
    }
  })
})
```

For review updates, we replace the review in the list from the cache (`prev`) with the updated one we get from the subscription. For deletions, we remove it from the list.

