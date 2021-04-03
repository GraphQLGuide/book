---
title: Subscriptions
description: How to implement two different GraphQL Subscriptions
---

## Subscriptions

* [githubStars](#githubstars)
* [reviewCreated](#reviewcreated)

GraphQL subscriptions, along with the rest of the spec, are transport-agnostic: that is, the two parties communicating GraphQL don’t need to use a specific way of sending messages. You can even do GraphQL with your friend by passing paper notes back and forth 😄.

The transport we’ve been using (HTTP) won’t work for subscriptions because HTTP is unidirectional—only the client can initiate messages to the server, and the server only has a single opportunity to respond. We need a bidirectional transport—the client needs to be able to tell the server to start and stop the subscription, and the server needs to send subscription events. The main bidirectional transport used in web programming (and most often used for GraphQL subscriptions) is WebSockets.

> In HTTP/2, the server can push resources to the client, but not messages to client code. With SSE ([Server-sent events](https://en.wikipedia.org/wiki/Server-sent_events)), the server can send messages to the client, and if we combine it with HTTP/2, we can do bidirectional communication over a single connection. However, WebSockets are more widely supported and easier to set up.

Subscriptions over WebSockets is supported by Apollo Server (at `ws://hostname/graphql`—`ws://localhost:4000/graphql` in development). In the next section, we’ll see what that looks like with a simple example. Then in [reviewCreated](#reviewcreated) we’ll code a more complex example.

### githubStars

> If you’re jumping in here, `git checkout 17_0.2.0` (tag [17_0.2.0](https://github.com/GraphQLGuide/guide-api/tree/17_0.2.0), or compare [17...18](https://github.com/GraphQLGuide/guide-api/compare/17_0.2.0...18_0.2.0))

The simplest subscription used on the Guide site is for a single integer—the number of stars on the [GraphQLGuide/guide](https://github.com/GraphQLGuide/guide) repo. As always, we start with the schema:

[`src/schema/Github.graphql`](https://github.com/GraphQLGuide/guide-api/blob/18_0.2.0/src/schema/Github.graphql)

```gql
type Subscription {
  githubStars: Int!
}
```

This means that each subscription event that the server sends the client will contain a single integer and be in this format:

```json
{
  "data": {
    "githubStars": <integer>
  }
}
```

We include our new `.graphql` file by adding this to the bottom of `schema.graphql`:

[`src/schema/schema.graphql`](https://github.com/GraphQLGuide/guide-api/compare/17_0.2.0...18_0.2.0)

```graphql
#import 'Github.graphql'
```

We need a publish and subscribe system to keep track of which clients to send events to. Apollo Server has an interface that all pub/sub packages implement, so whichever we use, the API will be the same. We create an instance of the `PubSub` class, use its `.asyncIterator()` method in the subscription resolver, and its `.publish()` method to send events. Let’s start with the first step, using the in-memory, for-use-in-development version of `PubSub` included in Apollo Server:

[`src/util/pubsub.js`](https://github.com/GraphQLGuide/guide-api/blob/18_0.2.0/src/util/pubsub.js)

```js
import { PubSub } from 'apollo-server'

export const pubsub = new PubSub()
```

Our resolver is:

[`src/resolvers/Github.js`](https://github.com/GraphQLGuide/guide-api/blob/18_0.2.0/src/resolvers/Github.js)

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

For subscriptions, instead of defining the function on `Subscription.field`, we use `Subscription.field.subscribe` and return an iterator. We’re naming the iterator `'githubStars'`, so to send events to the interator, we’ll do `pubsub.publish('githubStars', { githubStars: 1337 })`. 

Next we include the resolver:

[`src/resolvers/index.js`](https://github.com/GraphQLGuide/guide-api/compare/17_0.2.0...18_0.2.0)

```js
...

import Github from './Github'

export default [resolvers, Review, User, Date, Github]
```

Now where do we call `pubsub.publish()`? We have to get the information first. Where do we get it from? GitHub, of course! The first three versions of their API were REST-based, but their v4 is a GraphQL API—let’s use that. [Their docs](https://developer.github.com/v4/guides/forming-calls/#the-graphql-endpoint) say the endpoint is `https://api.github.com/graphql` and that we need to [create an access token](https://developer.github.com/v4/guides/forming-calls/#authenticating-with-graphql) to use the API. Once we’ve done that, we add a new `GITHUB_TOKEN` environment variable with the token we created:

`.env`

```
SECRET_KEY=9e769699fae6f594beafb46e9078c2
GITHUB_TOKEN=...
```

Now we can use `process.env.GITHUB_TOKEN` in our auth header to the GitHub API. Let’s put our code in the `data-sources/` directory. Even though it doesn’t talk to our database or follow Apollo’s `DataSource` API (since we don’t need context, a new instance for every request, batching, or caching), it is a source of data used in our app.

[`src/data-sources/Github.js`](https://github.com/GraphQLGuide/guide-api/blob/18_0.2.0/src/data-sources/Github.js)

```js
import { GraphQLClient } from 'graphql-request'

const githubAPI = new GraphQLClient('https://api.github.com/graphql', {
  headers: {
    authorization: `bearer ${process.env.GITHUB_TOKEN}`
  }
})
```

The simplest way to make GraphQL requests is with the [`graphql-request`](https://github.com/prisma/graphql-request) npm package. Now we can call `githubAPI.request(queryString)`, and our query will be sent to GitHub with our auth header. 

To determine what our query should be, we can browse GitHub’s GraphQL Explorer (an authenticated GraphiQL). A repo’s star count should be included in a repository’s information, so let’s look for a root Query field for getting a repository:

![GitHub’s GraphiQL with Query fields](../../img/github-graphql-explorer.png)

We find:

```gql
# Lookup a given repository by the owner and repository name.
repository(owner: String!, name: String!): Repository
```

Clicking on the `Repository` type gives us a long list of fields, including a `stargazers` field:

![Repository field list](../../img/github-stargazers.png)

And clicking on the `StargazerConnection` type gives us:

![StargazerConnection field list](../../img/github-stargazers-totalCount.png)

And we find that `totalCount` is the field we need. Putting all of that together gives us:

```js
const GUIDE_STARS_QUERY = `
query GuideStars {
  repository(owner: "GraphQLGuide", name: "guide") {
    stargazers {
      totalCount
    }
  }
}
`
```

We can make this query periodically to keep the count up to date. Let’s create a `startPolling()` function that does that. When it gets a new number, it will call `pubsub.publish()`:

[`src/data-sources/Github.js`](https://github.com/GraphQLGuide/guide-api/blob/18_0.2.0/src/data-sources/Github.js)

```js
import { pubsub } from '../util/pubsub'

...

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

The first argument to `pubsub.publish()` is the name of the async iterator and the second argument is the event data, the format of which needs to match our Subscription field in the schema (`type Subscription { githubStars: Int! }`).

Next we need to call `startPolling()` on startup. The place where all the other data sources are included seems a fitting place:

[`src/data-sources/index.js`](https://github.com/GraphQLGuide/guide-api/compare/17_0.2.0...18_0.2.0)

```js
import Github from './Github'

Github.startPolling()
```

The last change we need to make is to our context function:

[`src/context.js`](https://github.com/GraphQLGuide/guide-api/compare/17_0.2.0...18_0.2.0)

```js
export default async ({ req }) => {
  const context = {}

  const jwt = req.headers.authorization
```

We’re getting a `req` argument and assuming that it has `headers.authorization` properties. But actually, `req` will be undefined for subscriptions. So let’s guard against that:

```js
export default async ({ req }) => {
  const context = {}

  const jwt = req && req.headers.authorization
```

Now we test out our new subscription:

```gql
subscription {
  githubStars
}
```

![githubStars subscription in Playground with two events](../../img/githubStars-subscription.png)

When we hit the play button, it turns red, but nothing appears on the right—that’s because we haven’t received an event from the server yet, because the server only publishes when the value changes. But if we star [the repo](https://github.com/GraphQLGuide/guide), we’ll see an event of the form:

```json
{
  "data": {
    "githubStars": 87
  }
}
```

And when we unstar the repo, we see another event with the number one lower. Great, we’ve got realtime updates! 🙌 

Well… depending on your definition of realtime. Since we’re polling once a second, we might lag around a second. In the next section we’ll see even faster updates, where the publish happens as soon as the server receives a user’s action.

Lastly, let’s see what the WebSocket communication looks like. If we open devtools Network tab, hit the stop button in Playground, hit play, unstar and re-star the repo, select the `graphql` item in the list on the bottom-left, and select the Messages tab, we’ll see something like:

![Network tab with a list of WebSocket messages](../../img/subscription-websocket-start.png)

The rows with the green up arrow are messages sent over the WebSocket to the server, and the rows with the red down arrow are messages sent from the server to the browser. When we hit the play button, Playground opens the connection to `ws://localhost:4000/graphql` and sends two messages: one with type `connection_init` and one with:

- `type: "start"`—We’re starting a subscription.
- `payload.query`—The GraphQL document containing our subscription (what we typed on the left side of the Playground).
- `id: 1`—We might start more subscriptions over this websocket, so we have a number to identify this one that we’re starting in this message.

Then the server sends a message with type `connection_ack` (**ack**nowledging receipt of the `connection_init`), and messages like this:

![WebSocket message containing a subscription event](../../img/subscription-websocket-event.png)

- `type: "data"`—This message contains a subscription event.
- `id: 1`—This event corresponds to the subscription with an `id` of 1.
- `payload: {data: {githubStars: 89}}`—This is the subscription event, which Playground displays in the right-side panel.

Similar to how Playground took our subscription document and put it in WebSocket messages in the right format, and how it parsed the response messages and displayed the payload on the page, most of our clients will be using libraries that take care of the messaging part, so that all they’ll get is the payload object: `{data: {githubStars: 89}}`.

### reviewCreated

> If you’re jumping in here, `git checkout 18_0.2.0` (tag [18_0.2.0](https://github.com/GraphQLGuide/guide-api/tree/18_0.2.0), or compare [18...19](https://github.com/GraphQLGuide/guide-api/compare/18_0.2.0...19_0.2.0))

In the last section we set up our first subscription for a single integer based on an external source of data. In this section we’ll set up a subscription for an object type (`Review`) based on a user action (creating a review). The subscription will be named `reviewCreated`, and whenever any user creates a review, the server will send an event with that review data to all the clients that are subscribed to the `reviewCreated` subscription.

Let’s start with the schema!

[`src/schema/Review.graphql`](https://github.com/GraphQLGuide/guide-api/compare/18_0.2.0...19_0.2.0)

```gql
type Subscription {
  reviewCreated: Review!
}
```

We now have an error because we’re declaring `type Subscription` in two places, so let’s change the one in `Github.graphql` (which we can see in `src/schema/schema.graphql` is included after `Review.graphql` is included) to `extend type Subscription`:

[`src/schema/Github.graphql`](https://github.com/GraphQLGuide/guide-api/compare/18_0.2.0...19_0.2.0)

```gql
extend type Subscription {
  githubStars: Int!
}
```

Now we only need to do two things: 

- add a `Subscription.reviewCreated.subscribe` function that returns an iterator
- at the end of the `createReview` resolver, publish the new review object to that iterator

[`src/resolvers/Review.js`](https://github.com/GraphQLGuide/guide-api/compare/18_0.2.0...19_0.2.0)

```js
import { pubsub } from '../util/pubsub'

export default {
  Query: ...
  Review: ...
  Mutation: {
    createReview: (_, { review }, { dataSources, user }) => {
      ...

      const newReview = dataSources.reviews.create(review)

      pubsub.publish('reviewCreated', {
        reviewCreated: newReview
      })

      return newReview
    }
  },
  Subscription: {
    reviewCreated: { subscribe: () => pubsub.asyncIterator('reviewCreated') }
  }
}
```

The second argument to `pubsub.publish` is the event data, which needs to match the schema (`reviewCreated: Review!`): a `reviewCreated` attribute with an object of type `Review` for the value.

Aaaaand we’re done! That was easy. To test, we start the subscription in one Playground tab:

```gql
subscription {
  reviewCreated {
    id
    text
    stars
    createdAt
  }
}
```

And create the review in another:

```gql
mutation {
  createReview(review: { text: "Now that’s a downtown job!", stars: 5 }) {
    id
    text
  }
}
```

![createReview completed in Playground](../../img/createReview-downtown-job.png)

Now when we go back to the subscription tab, we’ll see the event:

![reviewCreated subscription with data received](../../img/subscription-downtown-job.png)

Other common types of subscriptions include when objects are edited and deleted:

```gql
type Subscription {
  reviewEdited: Review!
  reviewDeleted: ID!
}
```

`reviewEdited` events would include the review post-edit, and `reviewDeleted` events would just include the ID of the deleted review, so that clients can remove it from their cache. We’ll discuss subscriptions in more depth in the section Extended topics -> Subscription design.

