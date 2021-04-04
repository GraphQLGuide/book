---
title: Extending entities
---

### Extending entities

> If you’re jumping in here, `git checkout federation3_0.1.0` (tag [federation3_0.1.0](https://github.com/GraphQLGuide/guide-api/tree/federation3_0.1.0), or compare [federation3...federation4](https://github.com/GraphQLGuide/guide-api/compare/federation2_0.1.0...federation4_0.1.0))

In this section, we’ll build another service—this one for reviews—and we’ll see how to extend entities created by other services. Then, we’ll add the reviews service to the gateway and see how the gateway resolves queries involving both services.

Let’s start with the schema. First, we take the `Review` type and `reviews` query from our monolith for our new schema, and then we add a few things:

[`services/reviews/schema.js`](https://github.com/GraphQLGuide/guide-api/blob/federation4_0.2.0/services/reviews/schema.js)

```js
import { gql } from 'apollo-server'

export default gql`
  scalar Date

  type Review @key(fields: "id") {
    id: ID!
    text: String!
    stars: Int
    author: User!
    createdAt: Date!
    updatedAt: Date!
  }

  extend type Query {
    reviews: [Review!]!
  }

  extend type User @key(fields: "id") {
    id: ID! @external
    reviews: [Review!]!
  }
`
```

- `scalar Date`, as we did in the `users` service
- `@key` directive for `type Review`, to declare it as a federation entity
- `extend type User`: Here we’re extending the `User` type originally defined externally. We have to include both the `@key` directive as well as the primary key fields—in this case just `User.id`—with the `@external` directive (signifying that this field was originally defined in another service). The `reviews` field doesn’t have `@external`, which means it’s being added to the `User` type, and we’ll need to write a resolver for it:

[`services/reviews/resolvers.js`](https://github.com/GraphQLGuide/guide-api/blob/federation4_0.2.0/services/reviews/resolvers.js)

```js
import { ObjectId } from 'mongodb'

import Date from '../../lib/Date'

export default {
  ...Date,
  Query: {
    reviews: (_, __, { dataSources }) => dataSources.reviews.all()
  },
  Review: {
    __resolveReference: (reference, { dataSources }) =>
      dataSources.reviews.findOneById(ObjectId(reference.id)),
    id: review => review._id,
    author: review => ({ id: review.authorId }),
    createdAt: review => review._id.getTimestamp()
  },
  User: {
    reviews: (user, _, { dataSources }) =>
      dataSources.reviews.all({ authorId: ObjectId(user.id) })
  }
}
```

These resolvers are taken from our monolith with four additions:

- The `Date` custom scalar resolver.
- The `Review.__resolveReference` resolver, required because this service is the origin of the `Review` entity.
- The `Review.author` resolver, which returns a `reference` (the same reference passed to `__resolveReference` above)—an object with an entity’s primary key. The gateway takes this reference and provides it to the `User.__resolveReference` resolver to get the user object.
- The `User.reviews` resolver, which uses the data source `review.all()` method with a MongoDB selector. Speaking of which, we need a `Reviews` data source with a `.all()` method:

[`services/reviews/Reviews.js`](https://github.com/GraphQLGuide/guide-api/blob/federation4_0.2.0/services/reviews/Reviews.js)

```js
import { MongoDataSource } from 'apollo-datasource-mongodb'

export default class Reviews extends MongoDataSource {
  all(query) {
    return this.collection.find(query).toArray()
  }
}
```

We’ll include this, along with our schema and resolvers, when creating the server:

[`services/reviews/index.js`](https://github.com/GraphQLGuide/guide-api/blob/federation4_0.2.0/services/reviews/index.js)

```js
import { ApolloServer } from 'apollo-server'
import { buildFederatedSchema } from '@apollo/federation'

import resolvers from './resolvers'
import typeDefs from './schema'
import Reviews from './Reviews'
import { mongoClient } from '../../lib/db'
import context from '../../lib/userContext'

const server = new ApolloServer({
  schema: buildFederatedSchema([
    {
      typeDefs,
      resolvers
    }
  ]),
  dataSources: () => ({
    reviews: new Reviews(mongoClient.db().collection('reviews'))
  }),
  context
})

mongoClient.connect()

server.listen({ port: 4002 }).then(({ url }) => {
  console.log(`Reviews service ready at ${url}`)
})
```

We use the same context function as the `users` service and a new port (4002, versus 4001 for the `users` service and the default 4000 for the gateway).

One piece of our old schema that we’re missing is `Review.fullReview`. Since it involves the author’s name, we need to query the users collection. And the service that is responsible for querying the users collection is the `users` service. So let’s add the field to the `users` service:

[`services/users/schema.js`](https://github.com/GraphQLGuide/guide-api/compare/federation3_0.2.0...federation4_0.2.0)

```js
export default gql`
  ...

  extend type Review @key(fields: "id") {
    id: ID! @external
    fullReview: String!
  }
`
```

Like with `extend type User`, when we `extend type Review`, we repeat the directive and include the primary key field. However, we have an issue: The `fullReview` resolver needs data from the review document (`authorId`, `text`, and `stars`). By default, the resolver will only receive an object with the review’s `id` field. 

We can solve this issue with the `@requires` directive:

```js
export default gql`
  ...

  extend type Review @key(fields: "id") {
    id: ID! @external
    text: String! @external
    stars: Int @external
    authorId: ID! @external
    fullReview: String! @requires(fields: "authorId text stars")
  }
`
```

We list the fields we require in order to resolve `fullReview` using `@requires`, and we list those fields above with `@external`. The last issue is that `authorId` isn’t currently part of the `Review` type, so let’s add it to the `reviews` service schema:

[`services/reviews/schema.js`](https://github.com/GraphQLGuide/guide-api/blob/federation4_0.2.0/services/reviews/schema.js)

```js
export default gql`
  scalar Date

  type Review @key(fields: "id") {
    id: ID!
    text: String!
    stars: Int
    authorId: ID!
    author: User!
    createdAt: Date!
    updatedAt: Date!
  }

  ...
`
```

This makes `authorId` appear in the public gateway schema as well, which isn’t ideal, as it unnecessarily clutters the schema, but the ability to define a private, internal field is [a planned addition](https://github.com/apollographql/apollo-server/issues/2812) to the federation spec.

Finally, we can implement the `fullReview` resolver back in the `users` service:

[`services/users/resolvers.js`](https://github.com/GraphQLGuide/guide-api/compare/federation3_0.2.0...federation4_0.2.0)

```js
export default {
  ...
  Review: {
    fullReview: async (review, _, { dataSources }) => {
      const author = await dataSources.users.findOneById(
        ObjectId(review.authorId)
      )
      return `${author.firstName} ${author.lastName} gave ${review.stars} stars, saying: "${review.text}"`
    }
  }
}
```

We add the `reviews` service to our gateway by simply adding it to our `serviceList`:

[`gateway.js`](https://github.com/GraphQLGuide/guide-api/compare/federation3_0.2.0...federation4_0.2.0)

```js
const gateway = new ApolloGateway({
  serviceList: [
    { name: 'users', url: 'http://localhost:4001/graphql' },
    { name: 'reviews', url: 'http://localhost:4002/graphql' }
  ],
  buildService({ url }) {
    return new AuthenticatedDataSource({ url })
  }
})
```

We can run both services with:

```sh
$ npm run start-services
```

And in another terminal run the gateway:

```sh
$ npm start
```

And test! 🙏

![reviews query with author.firstName and fullReview](../img/reviews-through-gateway.png)

✅ Here we see both of the jumps from the `reviews` service to the `users` service working: The `reviews` service resolves `Query.reviews` and the `Review.author` reference, and the `users` service resolves the reference into a user, as well as `User.firstName` and `Review.fullReview`.

Next, we can see that going from the `users` service to the `reviews` service works. First the `users` service resolves `Query.user`, and then the `reviews` service resolves `User.reviews`.

![user query with User.reviews selected](../img/user-reviews-through-gateway.png)

To see a more detailed explanation of the *query plan*—the process by which the gateway determines how to get all the data it needs from the services—we can add this last argument to `ApolloGateway()`:

```js
const gateway = new ApolloGateway({
  serviceList...  
  buildService...
  __exposeQueryPlanExperimental: true
})
```

Now inside Playground, we can open the QUERY PLAN tab on the bottom-right:

![Query plan tab in Playground](../img/user-reviews-through-gateway.png)

```gql
{
  user(id: "5d24f846d2f8635086e55ed3") {
    id
    firstName
    reviews {
      stars
      text
    }
  }
}
```

The above query results in the below query plan:

```gql
QueryPlan {
  Sequence {
    Fetch(service: "users") {
      {
        user(id: "5d24f846d2f8635086e55ed3") {
          id
          firstName
          __typename
        }
      }
    },
    Flatten(path: "user") {
      Fetch(service: "reviews") {
        {
          ... on User {
            __typename
            id
          }
        } =>
        {
          ... on User {
            reviews {
              stars
              text
            }
          }
        }
      },
    },
  },
}
```

`Sequence` means the following queries are done in sequence—one after the other. So first it does a `Fetch` from the `users` service, and then a fetch from the `reviews` service.

Our first query involves a `Parallel` in addition to a `Sequence`:

```gql
{
  reviews {
    author {
      firstName
    }
    fullReview
  }
}
```

```gql
QueryPlan {
  Sequence {
    Fetch(service: "reviews") {
      {
        reviews {
          author {
            __typename
            id
          }
          __typename
          id
          authorId
          text
          stars
        }
      }
    },
    Parallel {
      Flatten(path: "reviews.@") {
        Fetch(service: "users") {
          {
            ... on Review {
              __typename
              id
              authorId
              text
              stars
            }
          } =>
          {
            ... on Review {
              fullReview
            }
          }
        },
      },
      Flatten(path: "reviews.@.author") {
        Fetch(service: "users") {
          {
            ... on User {
              __typename
              id
            }
          } =>
          {
            ... on User {
              firstName
            }
          }
        },
      },
    },
  },
}
```

The gateway first fetches from the `reviews` service and then does two fetches from the `users` service for each review, all in parallel. 

We can look at the query plan to diagnose performance issues—it’s possible that the query plan will show a lot of fetches in series, which increases latency. A fetch in series—where the second fetch happens after the first is complete—is denoted by `Sequence`. In the case of bugs, the query plan might also help us discover why the gateway is not working as we expect. 

Another tool we have for diagnosing bugs is our gateway’s `RemoteGraphQLDataSource`, to which we can add the `didReceiveResponse` method, where we can log responses from the services:

```js
class AuthenticatedDataSource extends RemoteGraphQLDataSource {
  willSendRequest...

  didReceiveResponse({ response, request, context }) {
    console.log('response data:', response.data)
    return response
  }
}
```

Here are further capabilities we aren’t using:

- Having [multiple primary keys](https://www.apollographql.com/docs/apollo-server/federation/entities/#defining-multiple-primary-keys) or [compound primary keys](https://www.apollographql.com/docs/apollo-server/federation/entities/#defining-a-compound-primary-key)
- Resolving other services’ fields with the [`@provides`](https://www.apollographql.com/docs/apollo-server/federation/entities/#resolving-another-services-field-advanced) directive
- [Modifying the gateway’s response](https://www.apollographql.com/docs/apollo-server/federation/implementing/#customizing-outgoing-responses)
- Using [custom directives](https://www.apollographql.com/docs/apollo-server/federation/implementing/#implementing-custom-directives)

