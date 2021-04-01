## Data sources

* [Setting up](#setting-up)
* [File structure](#file-structure)
* [Creating reviews](#creating-reviews)

### Setting up

Background: [MongoDB](../../background/databases.md#mongodb), [JavaScript classes](../../background/javascript.md#classes)

> If you’re jumping in here, `git checkout 3_0.2.0` (tag [3_0.2.0](https://github.com/GraphQLGuide/guide-api/tree/3_0.2.0), or compare [3...4](https://github.com/GraphQLGuide/guide-api/compare/3_0.2.0...4_0.2.0))

Our reviews are currently stored in a JavaScript array variable. There are a few problems with this storage method. JavaScript variables are part of the Node server process, which means that:

- When the server process restarts (for instance when we deploy), our reviews get erased.
- When the server machine loses power (it’s unlikely but possible for our data center to have a power outage), the data kept in RAM (which requires electricity to remember things) is lost. Since each process’s variables are stored in RAM, our reviews get erased. 
- When we have multiple server processes (common in the age of Heroku, when it’s easy to scale up small containers), the user will see different reviews based on which container each request is routed to.
- When we we’re using serverless and don’t have a long-running server process (widely introduced by AWS Lambda in 2014 and now, with Now 2.0 and Netlify Functions, becoming the standard way to host “servers” 😄), the process is started up for each request, so every `reviews` query would return just the single item we started out with.

The solution to all of these problems is to have a database that all of the server processes can talk to—one that stores data on a drive that doesn’t require power to remember things (either a disk drive that stores data on magnetic disks or a solid-state drive that stores data in flash memory). 

We’ll be using MongoDB because it’s the most popular database among Node developers and because it’s simple to use. The object-based API is easy to understand, and we don’t need to create a schema or do migrations. (Of course, just as a schema is useful in GraphQL, it’s useful for databases, and we could enforce a schema for our MongoDB database, for example with the [Mongoose ORM](https://mongoosejs.com), but we’ll be using the simplest model layer possible.) For an introduction to MongoDB, check out the [MongoDB section](../../background/databases.md#mongodb) of the Background chapter.

There are two main ways to talk to a database from our GraphQL resolvers: [data sources](https://www.apollographql.com/docs/apollo-server/features/data-sources) and [Prisma](https://www.prisma.io/). We generally recommend Prisma (a next-generation ORM) for ease of use. For now, we’ll use a MongoDB data source, for the same reasons we used Create React App instead of Next.js or Gatsby in the React chapter—data sources are more basic and familiar.

Data sources are classes that interact with a source of data (a database or a service). They often take care of some amount of batching queries and caching responses. We’ll go into them more deeply in the [More data sources](../more-data-sources/index.md) section. 

Usually there are two classes: a superclass that we import from a library that matches our type of database, and a subclass that we implement. There are superclass libraries for MongoDB, [SQL](#sql), and [REST](#rest), and we’ll also learn how to [create our own](#custom-data-source). The MongoDB library is [`apollo-datasource-mongodb`](https://github.com/GraphQLGuide/apollo-datasource-mongodb), and its superclass is called `MongoDataSource`. Let’s use it to create a data source for a `'reviews'` MongoDB collection:

[`src/data-sources/Reviews.js`](https://github.com/GraphQLGuide/guide-api/blob/4_0.2.0/src/data-sources/Reviews.js)

```js
import { MongoDataSource } from 'apollo-datasource-mongodb'

export default class Reviews extends MongoDataSource {
  all() {
    return this.collection.find().toArray()
  }
}
```
 
We start with a single method `all()` that fetches all reviews from the collection. Where does `this.collection` come from, you might ask? It’s set in the constructor (defined in `MongoDataSource`), which gets the collection as an argument:

```js
const reviews = new Reviews(db.collection('reviews'))
```

But in order to do that, we need to set up the database! We can install and start MongoDB on Windows with [these steps](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/#install-mdb-edition) or with [Homebrew](https://brew.sh/) on a Mac:

```sh

$ brew tap mongodb/brew
$ brew install mongodb-community
$ brew services start mongodb-community
```

The database is now running on our computer. We connect to it with the [`mongodb`](http://mongodb.github.io/node-mongodb-native/) package:

[`src/db.js`](https://github.com/GraphQLGuide/guide-api/blob/4_0.2.0/src/db.js)

```js
import { MongoClient } from 'mongodb'

export let db

const URL = 'mongodb://localhost:27017/guide'

const client = new MongoClient(URL, { useNewUrlParser: true })
client.connect(e => {
  if (e) {
    console.error(`Failed to connect to MongoDB at ${URL}`, e)
    return
  }

  db = client.db()
})
```

`'mongodb://localhost:27017/'` is the default URL of the MongoDB server running on our computer, and `'guide'` is the name of our database. Now we can import `db` and use it to create our data source. Data sources are created in a function that we pass to `ApolloServer`:

[`src/index.js`](https://github.com/GraphQLGuide/guide-api/compare/3_0.2.0...4_0.2.0)

```js
import Reviews from './data-sources/Reviews'
import { db } from './db'

const server = new ApolloServer({
  typeDefs: ...
  resolvers: ...
  dataSources: () => ({
    reviews: new Reviews(db.collection('reviews'))
  }),
  context: ...
})
```

Like the `context` function, the `dataSources` function is run for each request, so each request gets a new instance of each data source. `ApolloServer` adds data sources to the context so that we can access them in our resolvers like this:

```js
const server = new ApolloServer({
  typeDefs: ...
  resolvers: {
    Query: {
      me: (_, __, context) => context.user,
      hello: () => '🌍🌏🌎',
      reviews: (_, __, { dataSources }) => dataSources.reviews.all()
    },
    ...
  },
  dataSources: () => ({
    reviews: new Reviews(db.collection('reviews'))
  }),
  context: ...
})
```

We always get context as the third argument to our resolvers, and here in the `Query.reviews` resolver we’re destructuring context’s `dataSources` property. Then we get the instance of our `Reviews` data source, `dataSources.reviews`, and call its `.all()` method. Now when we do our reviews query again, we get an empty array, since nothing is yet in the `reviews` collection:

![reviews query with empty array result](../../img/empty-reviews.png)

<!-- { reviews { text } } -->

### File structure

> If you’re jumping in here, `git checkout 4_0.2.0` (tag [4_0.2.0](https://github.com/GraphQLGuide/guide-api/tree/4_0.2.0), or compare [4...5](https://github.com/GraphQLGuide/guide-api/compare/4_0.2.0...5_0.2.0))

Our `src/index.js` file is getting long, and continuing to put most of our code in one file would get ridiculous 😄. Let’s really simplify this file and get our `ApolloServer` creation down to just:

```js
const server = new ApolloServer({
  typeDefs,
  resolvers,
  dataSources,
  context
})
``` 

with each parameter imported from other files. There’s no one right way to structure the other files, but our favorite is:

- directories for the schema, resolvers, and data sources
- one file for each major type, for example:
  - `schema/Review.graphql` for the `Review` type schema
  - `resolvers/Review.js` for the resolvers associated with the `Review` type 
  - `data-sources/Reviews.js` for the `reviews` collection data source

With this structure, our `src/` looks like:

```
.
├── context.js
├── data-sources
│   ├── Reviews.js
│   └── index.js
├── db.js
├── index.js
├── resolvers
│   ├── Review.js
│   ├── User.js
│   └── index.js
├── schema
│   ├── Review.graphql
│   ├── User.graphql
│   └── schema.graphql
└── util
    └── auth.js
```

Some notes on the above:

- We haven’t yet made a data source for the users collection.
- We have context in a single file `context.js`, but if that ever got too long, we could make a `context/` directory and split it into multiple files.
- We have `index.js` files so that we can import the directory (for example `import resolvers from './resolvers'` imports from `'./resolvers/index.js'`). 
- We don’t have an `index.js` in `schema/` because they’re `.graphql` files, and you can’t import a directory with GraphQL imports.

For GraphQL imports, we’re using a babel plugin called [`babel-plugin-import-graphql`](https://github.com/detrohutt/babel-plugin-import-graphql) which replaces our imported `.graphql` files with schema objects (the same ones that the `gql` template string tag creates). We could have instead done JS files with template strings and given an array of them as our `typeDefs` parameter, which would look like this:

```js
// schema/Review.js
import gql from 'graphql-tag'

export default gql`
type Review {
  text: String!
  stars: Int
  fullReview: String!  
}
`

// schema/User.js
import gql from 'graphql-tag'

export default gql`
type User {
  firstName: String
  lastName: String
}
`

// schema/index.js
import reviewSchema from './Review.js'
import userSchema from './User.js'

export default [reviewSchema, userSchema]

// index.js
import typeDefs from './schema'

const server = new ApolloServer({
  typeDefs,
  ...
})
```

Instead, we have:

[`src/schema/schema.graphql`](https://github.com/GraphQLGuide/guide-api/blob/5_0.2.0/src/schema/schema.graphql)

```gql
type Query {
  hello: String!
}

# import Review first
#import 'Review.graphql'
#import 'User.graphql'
```

And the babel plugin makes the `#import` statements work, bringing in these files:

[`src/schema/Review.graphql`](https://github.com/GraphQLGuide/guide-api/blob/5_0.2.0/src/schema/Review.graphql)

```gql
type Review {
  text: String!
  stars: Int
  fullReview: String!
}

extend type Query {
  reviews: [Review!]!
}

type Mutation {
  createReview(review: CreateReviewInput!): Review
}

input CreateReviewInput {
  text: String!
  stars: Int
}
```

[`src/schema/User.graphql`](https://github.com/GraphQLGuide/guide-api/blob/5_0.2.0/src/schema/User.graphql)

```gql
type User {
  firstName: String
  lastName: String
}

extend type Query {
  me: User
}
```

`extend type Query` adds fields to the existing `Query` type (which we defined first in `schema.graphql`). `Review.graphql` is the first to define `Mutation`, so it doesn’t use `extend`. And we import it first so that future files we import below can all do `extend type Mutation`. (And we include the `# import Review first` comment in the file so that others—or our future selves 😄—won’t change the order.)

Thanks to our babel plugin, our `schema.graphql` can be imported like this:

```js
import typeDefs from './schema/schema.graphql'
```

In our `resolvers/` directory we have `Review.js` and `User.js`, which just have the resolvers related to the `Review` and `User` types, respectively:

[`src/resolvers/Review.js`](https://github.com/GraphQLGuide/guide-api/blob/5_0.2.0/src/resolvers/Review.js)

```js
export default {
  Query: {
    reviews: (_, __, { dataSources }) => dataSources.reviews.all()
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
```

[`src/resolvers/User.js`](https://github.com/GraphQLGuide/guide-api/blob/5_0.2.0/src/resolvers/User.js)

```js
export default {
  Query: {
    me: (_, __, context) => context.user
  }
}
```

We combine them in `index.js`:

[`src/resolvers/index.js`](https://github.com/GraphQLGuide/guide-api/blob/5_0.2.0/src/resolvers/index.js)

```js
const resolvers = {
  Query: {
    hello: () => '🌍🌏🌎'
  }
}

import Review from './Review'
import User from './User'

export default [resolvers, Review, User]
```

We can now import all resolvers with:

```js
import resolvers from './resolvers'
```

Next up is data sources! We already have `src/data-sources/Review.js`, so all we need is an `index.js` that will combine future data sources with our `Review.js` and export the function that creates new instances:

[`src/data-sources/index.js`](https://github.com/GraphQLGuide/guide-api/blob/5_0.2.0/src/data-sources/index.js)

```js
import Reviews from './Reviews'
import { db } from '../db'

export default () => ({
  reviews: new Reviews(db.collection('reviews'))
})
```

The last thing we want to move out of `src/index.js` is our context function. It’s small enough that we can put it in a single file:

[`src/context.js`](https://github.com/GraphQLGuide/guide-api/blob/5_0.2.0/src/context.js)

```js
import { getAuthIdFromJWT } from './util/auth'

export default async ({ req }) => {
  const context = {}

  const jwt = req.headers.authorization
  const authId = await getAuthIdFromJWT(jwt)
  if (authId === 'github|1615') {
    context.user = {
      firstName: 'John',
      lastName: 'Resig'
    }
  }

  return context
}
```

This brings our entire [`src/index.js`](https://github.com/GraphQLGuide/guide-api/blob/5_0.2.0/src/index.js) to just:

```js
import { ApolloServer } from 'apollo-server'
import typeDefs from './schema/schema.graphql'
import resolvers from './resolvers'
import dataSources from './data-sources'
import context from './context'

const server = new ApolloServer({
  typeDefs,
  resolvers,
  dataSources,
  context
})

server
  .listen({ port: 4000 })
  .then(({ url }) => console.log(`GraphQL server running at ${url}`))
```

So clean! ✨

### Creating reviews

> If you’re jumping in here, `git checkout 5_0.2.0` (tag [5_0.2.0](https://github.com/GraphQLGuide/guide-api/tree/5_0.2.0), or compare [5...6](https://github.com/GraphQLGuide/guide-api/compare/5_0.2.0...6_0.2.0))

In [Setting up](#setting-up), we updated our `reviews` query to fetch from MongoDB, but our reviews database collection is empty! So let’s get reviews into the database. API clients usually find it helpful if we give them an ID for objects we send them, so let’s add one to the schema:

[`src/schema/Review.graphql`](https://github.com/GraphQLGuide/guide-api/compare/5_0.2.0...6_0.2.0)

```gql
type Review {
  id: ID!
  text: String!
  stars: Int
  fullReview: String!
}
```

Let’s update our `createReview` mutation to talk to the database:

[`src/resolvers/Review.js`](https://github.com/GraphQLGuide/guide-api/compare/5_0.2.0...6_0.2.0)

```js
export default {
  ...
  Mutation: {
    createReview: (_, { review }, { dataSources }) =>
      dataSources.reviews.create(review)
  }
}
```

It just calls a method on our data source, which we need to define:

[`src/data-sources/Reviews.js`](https://github.com/GraphQLGuide/guide-api/compare/5_0.2.0...6_0.2.0)

```js
export default class Reviews extends MongoDataSource {
  all() {
    return this.collection.find().toArray()
  }

  create(review) {
    this.collection.insertOne(review)
    return review
  }
}
```

`createReview` resolves to a `Review`, so we need to return `review`. And it needs to have an ID. MongoDB’s [`insertOne()`](http://mongodb.github.io/node-mongodb-native/3.2/api/Collection.html#insertOne) synchronously adds a generated `_id` to the argument we give it, so when we `return review`, `review._id` is filled in. We return before the MongoDB node library talks to the database in order to send a response to the client as quickly as possible. If we wanted to wait until after we knew that the database operation had completed successfully, we could `await`:

```js
  async create(review) {
    await this.collection.insertOne(review)
    return review
  }
```

In this case, if there were a problem with the database insertion, `insertOne()` would throw an error, which Apollo Server would format and send to the client. Our method is now `async`, which means it returns a Promise, which means our `createReview` resolver returns a Promise. Apollo Server waits for Promises to resolve before continuing the GraphQL execution process.

While it’s good that in either case, the `_id` property is added to our `review` object, `_id` doesn’t match with our schema (the schema says the `Review` type has a field named `id`, without an underscore). If we create a review and include `id` in the selection set:

```gql
mutation {
  createReview(review: { text: "Passing", stars: 3 }) {
    id
    text
    stars
  }
}
```

then we get this error:

![Review.id error in Playground](../../img/non-nullable-id-error.png)

Apollo Server is trying to resolve the `id` field in our selection set, looking at the review object we return from the `createReview` resolver, and not finding an `id` property on that object. When it can’t find a property or `Review` field resolver, it normally returns `null`. However, the `Review` type in our schema has an `!` in the type of `id` (`id: ID!`), so it is non-nullable. Hence the error text: `"Cannot return null for non-nullable field Review.id."`

We can fix this by adding a `Review.id` resolver:

[`src/resolvers/Review.js`](https://github.com/GraphQLGuide/guide-api/compare/5_0.2.0...6_0.2.0)

```js
export default {
  ...
  Review: {
    id: review => review._id,
    fullReview: review =>
      `Someone on the internet gave ${review.stars} stars, saying: "${
        review.text
      }"`
  },
  ...
}
```

`review._id` is an object—an instance of [`ObjectId`](http://mongodb.github.io/node-mongodb-native/3.2/api/ObjectId.html), MongoDB’s default ID type. `Review.id` is supposed to resolve to the GraphQL `ID` scalar type, which is serialized as a string. This might make us think that we should be getting an error. But if we try our Playground mutation again, it’s successful. The reason is that because the schema says the `id` resolver should return an `ID`, Apollo Server knows to call `.toString()` on the object we return.

![Successful createReview mutation in Playground](../../img/createReview-success.png)

We can now see the list of reviews in the database—one for each time we ran the `createReview` mutation:

```gql
{ 
  reviews {
    id
    text
    stars
    fullReview
  }
}
```

![reviews query in Playground](../../img/reviews-query.png)

