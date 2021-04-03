---
title: Subscriptions in depth
description: Server architecture and schema design
---

## Subscriptions in depth

### Server architecture

Back in the [Deployment options](production/deployment.md#options) section, we decided to deploy to a PaaS because our app has subscriptions, which don’t work on FaaS. However, we can split our code into two servers: One that handles subscriptions and WebSockets and runs on a PaaS long-running process, and one that handles queries and mutations over HTTP and runs on a FaaS. This way, our two tasks, which have very different hosting requirements, can be maintained and scaled independently according to their needs.

Let’s recall what our subscription code looks like. When the client sends this operation:

```gql
subscription {
  githubStars
}
```

Our `Subscription.githubStars.subscribe` function is called:

`src/resolvers/Github.js`

```js
import { pubsub } from '../util/pubsub'

export default {
  Subscription: {
    githubStars: {
      subscribe: () => pubsub.asyncIterator('githubStars')
    }
  }
}
```

The server now keeps the WebSocket open and sends over it anything that’s published to the `githubStars` iterator (`pubsub.publish('githubStars', foo)`).

When our server starts up, we start polling:

`src/index.js`

```js
const start = () => {
  Github.startPolling()
  ...
}
```

`src/data-sources/Github.js`

```js
export default {
  async fetchStarCount() {
    const data = await githubAPI.request(GUIDE_STARS_QUERY).catch(console.log)
    return data && data.repository.stargazers.totalCount
  },

  startPolling() {
    let lastStarCount

    setInterval(async () => {
      const starCount = await this.fetchStarCount()
      const countChanged = starCount && starCount !== lastStarCount

      if (countChanged) {
        pubsub.publish('githubStars', { githubStars: starCount })
        lastStarCount = starCount
      }
    }, 1000)
  }
}
```

When the number of stars changes, the new count is published to the `githubStars` iterator, and the server sends it out to all the clients who have subscribed. 

All the above code can be separated into a new Node server. In fact, since we switched from the default in-memory pubsub to [Redis PubSub](production/database-hosting.md#redis-pubsub), the code that publishes updates doesn’t need to be in the same process that receives subscriptions and handles WebSockets! So if we wanted, we could have three servers:

- Subscription server: A PaaS that supports WebSockets
- Query and mutation server: FaaS
- `githubStars` publishing server: FaaS with scheduled periodic executions

Usually, most of an app’s publishing comes from the mutation server: When a mutation changes data, it publishes the change with the new data. When we’re publishing data from an external source, then we need a function triggered on a schedule to check for changes or the source has to notify us when things change (a [webhook](../../background/webhooks.md)). When data is changed from places outside our mutation server, we can publish to our subscriptions in three different ways:

- Have those other places (for instance, a legacy application that works with the same business data) publish the changes they make to Redis.
- Have a long-running server poll the database for changes. This can take a significant amount of memory, since the process needs to keep the current state of the data in order to see what has changed. On the other hand, it scales well with high write loads (since changing data doesn’t trigger anything). This is the strategy [Hasura](hasura.md) uses.
- Use a special database:
  - [RethinkDB](https://rethinkdb.com/) provides *change feeds* as a way to be notified when the results of a query change (though not all possible queries are supported).
  - MongoDB provides an *oplog*—a log of all database operations—that we can have a server listen to (*tail*). If data changes frequently, it can take a significant amount of CPU to process the oplog, determining which operations are changes that should be published for our subscriptions.

> In the [Meteor](https://www.meteor.com/) framework, you can use a mix of oplog tailing and polling when oplog tailing is too CPU-intensive.

### Subscription design

Our `githubStars` subscription is basic—just a single scalar value.

```gql
type Subscription {
  githubStars: Int
}
```

Usually subscriptions are for getting updates to an object or list of objects. For instance, our `createReview` subscription updates clients on objects being added to the list of reviews.

```gql
type Subscription {
  reviewCreated: Review!
}
```

If we wanted to get all types of updates, we have three options:

1) Adding `reviewUpdated` and `reviewDeleted`:

```gql
type Subscription {
  reviewCreated: Review!
  reviewUpdated: Review!
  reviewDeleted: ID!
}
```

2) A single `reviews` subscription:

```gql
type Subscription {
  reviews: ReviewsPayload
}

union ReviewsPayload = 
  CreateReviewPayload | 
  UpdateReviewPayload | 
  DeleteReviewPayload

type CreateReviewPayload {
  review: Review!
}

type UpdateReviewPayload {
  review: Review!
}

type DeleteReviewPayload {
  reviewId: ID!
}
```

Here we could share the same payloads as the `createReview`, `updateReview`, and `deleteReview` mutations.

3) Calling `reviewCreated` and a `review(id)` subscription for each review loaded on the page:

```gql
type Subscription {
  reviewCreated: Review!
  review(id: ID!): ReviewPayload!
}

union ReviewsPayload = 
  UpdateReviewPayload | 
  DeleteReviewPayload
```

Options #1 and #2 are similar in that the client gets updates to the entire list of reviews. In #2, they have to make fewer subscriptions. In #1, they have more flexibility if for some reason they only wanted to subscribe to `reviewCreated` and not the others. In #3, the client makes many more subscriptions, but doesn’t have to deal with receiving events about reviews they don’t care about. In #1 and #2, unless the user has scrolled enough to load the entire list on the page, they’re getting events about review objects that aren’t on the page or in the cache, and ignoring them. Given that it takes resources to receive WebSocket messages and check to see if the review is in the cache, we may want to go with #3. In our use case, though, editing and deleting reviews happens infrequently, and even if adding reviews happens frequently, those events are usually all relevant, since the default sort order is most recent. So we might go with the simplicity of #2.

If we had a review detail page that just showed a single review, we would use the `review(id)` subscription. If the page also had a list of comments, then we might do:

```gql
type Subscription {
  reviewCreated: Review!
  review(id: ID!): ReviewPayload!
  commentsForReview(reviewId: ID!): CommentsPayload!
}

union ReviewsPayload = 
  UpdateReviewPayload | 
  DeleteReviewPayload |

union CommentsPayload = 
  CommentCreatedPayload |
  CommentUpdatedPayload |
  CommentDeletedPayload
```

> Of course, if we had (or thought we might have in the future) a different kind of comment elsewhere in our app, we would change all the instances of `Comment*` to `ReviewComment*`.

And if the client was on page `/review/123`, we would subscribe to `review(id: "123")` and `commentsForReview(id: "123")`. As before with the list of reviews, if there might be a lot of comments and comment edit/delete activity, and only some of the comments were shown on the page, we might instead subscribe to updates to each individual comment: `comment(id: "<comment id>")`.

The design of our subscriptions depends on which client views we want realtime updates for, the size of the data set, and the frequency of updates. We take into consideration how much work it takes for the client to make the subscriptions, how much work it takes them to filter out unwanted messages, and also avoiding overfetching data on the messages we do want. For instance, we return just the ID of a deleted object instead of the whole object. And if we had a granular `changeReviewStars` mutation, we could union and resolve to a `ChangeReviewStarsPayload` type. The client could then only select the `stars` field instead of the whole review:

```gql
fragment ChangeReviewStars on ChangeReviewStarsPayload {
  review {
    id
    stars
  }
}

fragment CreateReview on CreateReviewPayload {
  review {
    id
    text
    stars
    createdAt
  }
}

fragment DeleteReview on DeleteReviewPayload {
  reviewId
}

subscribe {
  reviews {
    ...ChangeReviewStars
    ...CreateReview
    ...DeleteReview
  }
}
```

