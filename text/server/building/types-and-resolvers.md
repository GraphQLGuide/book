## Types and resolvers

> If you’re jumping in here, `git checkout 1_0.2.0` (tag [1_0.2.0](https://github.com/GraphQLGuide/guide-api/tree/1_0.2.0), or compare [1...2](https://github.com/GraphQLGuide/guide-api/compare/1_0.2.0...2_0.2.0))

The heart of a GraphQL server is the types and resolvers. The schema has the types and each type’s fields, and the resolvers *resolve* each field. We generally resolve fields by fetching data from a data source, formatting fetched data, or enacting mutations. 

Let’s add some more types and fields to get a better sense of how they match up with resolvers. We want people to be able to submit reviews for the book, so we need a mutation:

```gql
type Mutation {
  createReview(text: String!, stars: Int): Review
}
```

The convention for naming a creation mutation is `create<Type>`, and it usually resolves to that type (hence `: Review` at the end). However, it’s best practice to use a single input type as an argument instead of listing out all the scalars needed. So let’s change it to:

```gql
type Mutation {
  createReview(input: CreateReviewInput!): Review
}
input CreateReviewInput {
  text: String!
  stars: Int
}
```

We also want people to be able to read past reviews, so we add a Query field:

```gql
type Query {
  hello: String!
  reviews: [Review!]!
}
```

We don’t have a `Review` type yet, so we need to add that:

```
type Review {
  text: String!
  stars: Int
  fullReview: String!
}
```

All together, our new schema looks like this:

[`src/index.js`](https://github.com/GraphQLGuide/guide-api/compare/1_0.2.0...2_0.2.0)

```js
const server = new ApolloServer({
  typeDefs: gql`
    type Query {
      hello: String!
      reviews: [Review!]!
    }
    type Review {
      text: String!
      stars: Int
      fullReview: String!
    }
    type Mutation {
      createReview(review: CreateReviewInput!): Review
    }
    input CreateReviewInput {
      text: String!
      stars: Int
    }
  `,
  resolvers: { ... }
})
```

We need a resolver for each field except for the `input` type. (Input types are only used for mutation arguments: fields can’t resolve to input types, so input types don’t need resolvers.) The structure of our `resolvers` object matches the schema, so it should look like:

```js
const server = new ApolloServer({
  typeDefs: ...
  resolvers: {
    Query: {
      hello: () => 
      reviews: () => 
    },
    Review: {
      text: () => 
      stars: () => 
      fullReview: () => 
    }
    Mutation: {
      createReview: () => 
    },
  }
})
```

Now let’s fill them in! We’ll start with `createReview`:

```js
const reviews = [
  {
    text: 'Super-duper book.',
    stars: 5
  }
]

const server = new ApolloServer({
  typeDefs: ...
  resolvers: {
    ...
    Mutation: {
      createReview: (_, { review }) => {
        reviews.push(review)
        return review
      }
    }
  }
})
```

We don’t need the first resolver parameter, just the second, which contains the mutation argument—the review. We add it to our array of reviews and return it (since our schema says that `createReview` resolves to an object of type `Review`).

Next we can implement the `reviews` Query field:

```js
const reviews = [
  {
    text: 'Super-duper book.',
    stars: 5
  }
]

const server = new ApolloServer({
  typeDefs: ...
  resolvers: {
    Query: {
      hello: ...
      reviews: () => reviews
    }
  }
})
```

For `Query.reviews` we just return our array of reviews. But a GraphQL server doesn’t just return the `reviews` array to the client: it looks at the schema, sees that `Query.reviews` resolves to `[Review!]!`, checks to make sure the `reviews` array is non-null, and then resolves each object in the array as a `Review`. The way it does that is by calling `Review` field resolvers, which we also have to define:

```js
const reviews = [
  {
    text: 'Super-duper book.',
    stars: 5
  }
]

const server = new ApolloServer({
  typeDefs: ...
  resolvers: {
    Query: {
      hello: ...
      reviews: () => reviews
    },
    Review: {
      text: review => review.text
      stars: review => review.stars
      fullReview: review =>
        `Someone on the internet gave ${review.stars} stars, saying: "${
          review.text
        }"`
    }
  }
})
```

When the GraphQL server calls a `Review` field resolver, it provides the object as the first parameter, for example: 

```js
{
  text: 'Super-duper book.',
  stars: 5
}
```

The `text` and `stars` type fields we can just resolve to the corresponding object properties (for example, `text: review => review.text`). And we can actually take the `text` and `stars` resolvers out, because Apollo Server will do that by default. The `fullReview` field isn’t a property on the object, so the default resolver won't work. So we define our own resolver, returning a string constructed from the review’s properties.

All together, without the extraneous object property resolvers, we have:

[`src/index.js`](https://github.com/GraphQLGuide/guide-api/compare/1_0.2.0...2_0.2.0)

```js
import { ApolloServer, gql } from 'apollo-server'

const reviews = [
  {
    text: 'Super-duper book.',
    stars: 5
  }
]

const server = new ApolloServer({
  typeDefs: gql`
    type Query {
      hello: String!
      reviews: [Review!]!
    }
    type Review {
      text: String!
      stars: Int
      fullReview: String!
    }
    type Mutation {
      createReview(review: CreateReviewInput!): Review
    }
    input CreateReviewInput {
      text: String!
      stars: Int
    }
  `,
  resolvers: {
    Query: {
      hello: () => '🌍🌏🌎',
      reviews: () => reviews
    },
    Review: {
      fullReview: review =>
        `Someone on the internet gave ${review.stars} stars, saying: "${
          review.text
        }"`
    },
    Mutation: {
      createReview: (_, { review }) => {
        reviews.push(review)
        return review
      }
    }
  }
})

server
  .listen({ port: 4000 })
  .then(({ url }) => console.log(`GraphQL server running at ${url}`))
```

We can try it out with `npm run dev`, see that Playground loads, and try out the new query:

```gql
{
  reviews {
    text
    fullReview
    stars
  }
}
```

![reviews query](../../img/reviews-playground.png)

[localhost:4000: `{ reviews { text fullReview stars } }`](http://localhost:4000/)

We see our one hard-coded review. Now if we do our mutation followed by the `reviews` query, we’ll see both that and the new review:

![createReview mutation](../../img/createReview-mutation.png)

[localhost:4000: `mutation { createReview(review: { text: "Passing", stars: 3 }) { text } }`](http://localhost:4000/)

![reviews query with two results](../../img/reviews-playground-two-results.png)

[localhost:4000: `{ reviews { text fullReview stars } }`](http://localhost:4000/)

Notice how the only things we changed in our server were our types (in the Apollo Server `typeDefs` parameter) and our resolvers. These two things (including code called by our resolver functions) will be the bulk of the coding we do for our GraphQL server.

