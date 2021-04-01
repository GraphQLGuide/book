## Creating users

* [Protecting with secret key](#protecting-with-secret-key)
* [Setting user context](#setting-user-context)
* [Linking users to reviews](#linking-users-to-reviews)

Currently our `User` type just has two fields (`firstName` and `lastName`), and we aren’t storing users in the database. If we wanted to continue without storing users in the database, we could fetch any further information we want, like email address or GitHub username, from Auth0 or GitHub whenever we needed it. However, this would be a little more complicated than querying our database, introduce latency (it takes longer for our server to talk to their servers than to query our database), and introduce another point of failure (if their services went down or there was a network failure between us and them). Furthermore, we’re going to have to store some new user data (for instance, which sections they’ve read, or which reviews they’ve favorited), so we might as well have other user data we need stored along with it. In the first part of this section, we’ll create user documents in a new users Mongo collection. In the second part, we’ll query the collection to set the user context for resolvers.

### Protecting with secret key

> If you’re jumping in here, `git checkout 7_0.2.0` (tag [7_0.2.0](https://github.com/GraphQLGuide/guide-api/tree/7_0.2.0), or compare [7...8](https://github.com/GraphQLGuide/guide-api/compare/7_0.2.0...8_0.2.0))

There are two ways we could create our user doc. One is, in our context function, checking if the user we decode from the JWT exists in the database, and if they don’t, fetching their data from Auth0 and GitHub and saving it to the database. The other method is to use an Auth0 hook—a function we write that runs on a certain trigger. The “Post User Registration” hook runs whenever a user first uses their GitHub account to log in. Inside of our hook function, we can put together the user data we want and send it to the server in a mutation. The Guide hook looks something like this:

```js
const request = require('graphql-request').request
const pick = require('lodash').pick

const query = `
mutation createUserFromHook($user: CreateUserInput!, $secretKey: String!) {
  createUser(user: $user, secretKey: $secretKey) {
    id
  }
}`

module.exports = function (user, context, cb) {
  const secretKey = context.webtask.data.secretKey
  const input = pick(user, 'username', 'email')
  input.authId = user.id
  const variables = {
    user: input,
    secretKey
  }
  request('https://api.graphql.guide/graphql', query, variables).then(data => cb(null, data))
};
```

The exported function is given data about the user, and then sends a `createUser` mutation to the Guide server. The mutation takes as arguments both the user data and a `secretKey`—a secret string that the server verifies before running the mutation, so that no one but the hook can create users.

When we want to protect a query, mutation, or field from being accessed by anyone, normally we use a JWT in the authorization header. We could create a JWT for this purpose, but it’s easier to generate a random string (i.e. key). We could put the key in the authorization header like is usually done for API keys, which would look like this:

[`src/context.js`](https://github.com/GraphQLGuide/guide-api/compare/7_0.2.0...8_0.2.0)

```js
import { getAuthIdFromJWT } from './util/auth'

const API_KEYS = ['alohomora', 'speak-friend']

export default async ({ req }) => {
  const context = {}

  if (API_KEYS.includes(req.headers.authorization)) {
    context.apiUser = true
  } else {
    const jwt = req.headers.authorization
    const authId = await getAuthIdFromJWT(jwt)
    if (authId === 'github|1615') {
      context.user = {
        firstName: 'John',
        lastName: 'Resig'
      }
    }
  }

  return context
}
```

We add an if statement and set `context.apiUser` to `true`, which we can check inside our resolvers.

However, since we only need the key for this one mutation, we’ll add a `secretKey` argument to it. As always, we start with the schema:

[`src/schema/User.graphql`](https://github.com/GraphQLGuide/guide-api/compare/7_0.2.0...8_0.2.0)

```gql
type User {
  firstName: String
  lastName: String
}

extend type Query {
  me: User
}

extend type Mutation {
  createUser(user: CreateUserInput!, secretKey: String!): User
}

input CreateUserInput {
  firstName: String!
  lastName: String!
  username: String!
  email: String!
  authId: String!
}
```

We’re extending the `Mutation` type that first appears in `src/schema/Review.graphql`, and we follow the standard practice of our creation mutation resolving to the type it creates, `User`. And we create a new input type with the user fields we want. Next, we implement the `createUser` resolver:

[`src/resolvers/User.js`](https://github.com/GraphQLGuide/guide-api/compare/7_0.2.0...8_0.2.0)

```js
export default {
  Query: {
    me: (_, __, context) => context.user
  },
  Mutation: {
    createUser(_, { user, secretKey }, context) {
      // TODO
    }
  }
}
```

We have three things to do in our resolver:

- verify `secretKey` is correct
- create the user
- return the user

Best practice is to avoid committing secrets to git, so we won’t do `if (secretKey !== 'foo')`. Instead, we’ll use the [`dotenv`](https://github.com/motdotla/dotenv#readme) package to set an environment variable. First we need to generate a secret:

```sh
$ node
> require('crypto').randomBytes(15, (e, buffer) => console.log(buffer.toString('hex')))
9e769699fae6f594beafb46e9078c2
> .exit
```

Then we put it in a file named `.env`:

```
SECRET_KEY=9e769699fae6f594beafb46e9078c2
```

That we have git ignore:

`.gitignore`

```
node_modules/
dist/
.env
```

And then we have `dotenv` read the values listed in `.env` into `process.env` at the beginning of our code (the first line of `src/index.js`):

```js
import 'dotenv/config'
import { ApolloServer } from 'apollo-server'
import typeDefs from './schema/schema.graphql'
...
```

And then we can reference `process.env.SECRET_KEY` in our code:

`src/resolvers/User.js`

```js
import { AuthenticationError } from 'apollo-server'

export default {
  Query: ...
  Mutation: {
    createUser(_, { user, secretKey }, context) {
      if (secretKey !== process.env.SECRET_KEY) {
        throw new AuthenticationError('wrong secretKey')
      }
      
      // TODO
    }
  }
}
```

> We’ll learn about errors in the [Errors section](errors.md).

The next step is creating the user, for which we need a users data source! We create a new file:

[`src/data-sources/Users.js`](https://github.com/GraphQLGuide/guide-api/compare/7_0.2.0...8_0.2.0)

```js
import { MongoDataSource } from 'apollo-datasource-mongodb'

export default class Users extends MongoDataSource {
  create(user) {
    user.updatedAt = new Date()
    this.collection.insertOne(user)
    return user
  }
}
```

The `create()` method adds an `updatedAt` property, inserts, and returns, just like our `Reviews` data source. We include our new data source in the index file:

[`src/data-sources/index.js`](https://github.com/GraphQLGuide/guide-api/compare/7_0.2.0...8_0.2.0)

```js
import Reviews from './Reviews'
import Users from './Users'
import { db } from '../db'

export default () => ({
  reviews: new Reviews(db.collection('reviews')),
  users: new Users(db.collection('users'))
})
```

So now `users` will be available in our resolvers at `context.dataSources.users`:

[`src/resolvers/User.js`](https://github.com/GraphQLGuide/guide-api/compare/7_0.2.0...8_0.2.0)

```js
export default {
  Query: ...
  Mutation: {
    createUser(_, { user, secretKey }, { dataSources } ) {
      if (secretKey !== process.env.SECRET_KEY) {
        throw new AuthenticationError('wrong secretKey')
      }
      
      return dataSources.users.create(user)
    }
  }
}
```

Now the `createUser` should work (using your own data and `authId` for the `user` argument):

![Successful createUser query in Playground](../../img/createUser.png)

```gql
mutation {
  createUser(
    user: {
      firstName: "John"
      lastName: "Resig"
      username: "jeresig"
      email: "john@graphql.guide"
      authId: "github|1615"
    }
    secretKey: "9e769699fae6f594beafb46e9078c2"
  ) {
    firstName
    lastName
  }
}
```

### Setting user context

> If you’re jumping in here, `git checkout 8_0.2.0` (tag [8_0.2.0](https://github.com/GraphQLGuide/guide-api/tree/8_0.2.0), or compare [8...9](https://github.com/GraphQLGuide/guide-api/compare/8_0.2.0...9_0.2.0))

Now that we have our user document in the database, we can fetch it and put it in context:

[`src/context.js`](https://github.com/GraphQLGuide/guide-api/compare/8_0.2.0...9_0.2.0)

```js
import { getAuthIdFromJWT } from './util/auth'
import { db } from './db'

export default async ({ req }) => {
  const context = {}

  const jwt = req.headers.authorization
  const authId = await getAuthIdFromJWT(jwt)
  const user = await db.collection('users').findOne({ authId })
  if (user) {
    context.user = user
  }

  return context
}
```

One possible concern with this method is latency—every authenticated request now has to wait for a round trip to the database before resolvers are run, and if the request is one that doesn’t use `context.user`, we’ve wasted that time. It’s usually not a long enough period of time to be concerned about, but if we were, we could solve it in a couple of ways:

- Store whatever user data we needed in the JWT. Then we wouldn’t have to fetch it from the database—we’d just decode it. This takes some additional coding, and what the code looks like depends on how you’re creating the JWT (in this case we’d be talking to Auth0 via their API). JWTs have a limited size (~7k sent in an HTTP header), but that wouldn’t be a limiting factor for us, since we don’t have that much user data. 
- Put a Promise on the context instead of the doc:

```js
import { getAuthIdFromJWT } from './util/auth'
import { db } from './db'

export default async ({ req }) => {
  const context = {}

  const jwt = req.headers.authorization
  const authId = await getAuthIdFromJWT(jwt)
  context.userPromise = db.collection('users').findOne({ authId })

  return context
}
```

And then any resolvers that needed user data would do:

```js
const user = await context.userPromise
```

That would clutter the code a little, so let’s stick with our `context.user` code. ✨😊

Now if we do the `me` query (and set our authorization header as we did in the [React > Authentication](../authentication.md) section), we should be able to get the name from our user document:

![me query with authorization header and returned name](../../img/me-with-name.png)

There’s more data about a user that our web client will need, so let’s add to our schema:

[`src/schema/User.graphql`](https://github.com/GraphQLGuide/guide-api/compare/8_0.2.0...9_0.2.0)

```gql
type User {
  id: ID!
  firstName: String!
  lastName: String!
  username: String!
  email: String!
  photo: String!
  createdAt: Date!
  updatedAt: Date!
}

extend type Query {
  me: User
}

extend type Mutation {
  createUser(user: CreateUserInput!, secretKey: String!): User
}

input CreateUserInput {
  firstName: String!
  lastName: String!
  username: String!
  email: String!
  authId: String!
}
```

`username`, `email`, and `updatedAt` are fields of the user document, so we don’t need resolvers for them. We do need resolvers for `id`, `photo`, and `createdAt`. Also note that we don’t have a `User.authId` field: while it’s part of `CreateUserInput` and is stored in the user document, we don’t need the client to be able to access it, so leaving it out of the `User` type means they won’t be able to query for it. 

For the `createdAt` resolver, we can do the same as the `Review.createdAt` resolver, calling the `getTimestamp()` method of the `ObjectId`:

[`src/resolvers/User.js`](https://github.com/GraphQLGuide/guide-api/compare/8_0.2.0...9_0.2.0)

```js
export default {
  Query: {
    me: (_, __, context) => context.user
  },
  User: {
    id: ({ _id }) => _id,
    photo(user) {
      // user.authId: 'github|1615'
      const githubId = user.authId.split('|')[1]
      return `https://avatars.githubusercontent.com/u/${githubId}`
    },
    createdAt: user => user._id.getTimestamp()
  },
  Mutation: ...
}
```

For the user’s photo field, we can use GitHub avatar URLs, which have the GitHub user ID at the end, like:

```
https://avatars.githubusercontent.com/u/1615
```

And we can get the GitHub user ID number from the second part of the `authId`, after the `|` character (for example `github|1615`).

Now we can query for all `User` fields:

![me query will all fields selected](../../img/me-with-all-fields.png)

### Linking users to reviews

> If you’re jumping in here, `git checkout 9_0.2.0` (tag [9_0.2.0](https://github.com/GraphQLGuide/guide-api/tree/9_0.2.0), or compare [9...10](https://github.com/GraphQLGuide/guide-api/compare/9_0.2.0...10_0.2.0))

Another thing we can add now that we have a users collection is associate users with reviews. We want our client to be able to show the user’s name and photo next to reviews, so we can update our `Review` type with an `author` field that resolves to a `User`:

[`src/schema/Review.graphql`](https://github.com/GraphQLGuide/guide-api/compare/9_0.2.0...10_0.2.0)

```gql
type Review {
  id: ID!
  author: User!
  text: String!
  stars: Int
  fullReview: String!
  createdAt: Date!
  updatedAt: Date!
}
```

When we create the review, we need to save the author’s ID. The author is the currently logged-in user, which is stored at `context.user`. Inside data sources, the context is available at `this.context`. So we can save `this.context.user._id` to an `authorId` field of the review document:

[`src/data-sources/Reviews.js`](https://github.com/GraphQLGuide/guide-api/compare/9_0.2.0...10_0.2.0)

```js
export default class Reviews extends MongoDataSource {
  ...

  create(review) {
    review.authorId = this.context.user._id
    review.updatedAt = new Date()
    this.collection.insertOne(review)
    return review
  }
}
```

Now our new `Review.author` resolver can use this `authorId` prop to fetch the user doc:

[`src/resolvers/Review.js`](https://github.com/GraphQLGuide/guide-api/compare/9_0.2.0...10_0.2.0)

```js
export default {
  Query: ...
  Review: {
    id: ...
    author: (review, _, { dataSources }) =>
      dataSources.users.findOneById(review.authorId),
    fullReview: ...
    createdAt: ...
  },
  Mutation: ...
}
```

The next task is updating our current reviews in the database to have an `authorId` field (because we made `author` non-nullable, we’ll get an error without one). Using our own user ID (from a `{ me { id } }` query) in the below `ObjectId`:

```sh
$ mongo
> use guide
switched to db guide
> db.reviews.updateMany({}, {$set: {authorId: ObjectId('5cf8331934e9730c83399fd5')}})
{ "acknowledged" : true, "matchedCount" : 2, "modifiedCount" : 2 }
> exit
```

we should now be able to add `author` to our selection set for our `reviews` query:

![reviews query with author selected](../../img/reviews-with-author.png)

```gql
{
  reviews {
    text
    stars
    author {
      id
      firstName
      photo
    }
  }
}
```

And we should also be able to create a review and select the author, if we include our JWT in the authorization header:

![createReview mutation with author selected](../../img/createReview-with-author.png)

The last thing to update is `Review.fullReview`: let’s change “Someone on the internet gave N stars” to use the author’s name. Currently we have:

[`src/resolvers/Review.js`](https://github.com/GraphQLGuide/guide-api/compare/9_0.2.0...10_0.2.0)

```js
export default {
  Query: {
    reviews: (_, __, { dataSources }) => dataSources.reviews.all()
  },
  Review: {
    id: review => review._id,
    author: (review, _, { dataSources }) =>
      dataSources.users.findOneById(review.authorId),
    fullReview: review =>
      `Someone on the internet gave ${review.stars} stars, saying: "${
        review.text
      }"`,
    createdAt: review => review._id.getTimestamp()
  },
  Mutation: ...
}
```

We’d like to do:

```js
    fullReview: review =>
      `${review.author.firstName} ${review.author.lastName} gave ${
        review.stars
      } stars, saying: "${review.text}"`,
```

But trying to query `{ reviews { fullReview } }` gives the error `Cannot read property 'firstName' of undefined`, which means that `review.author` is undefined. This is because `review` is a MongoDB document and has an `authorId` property, not an `author` property. We could either call the other resolver (as we saw in [Custom scalars](custom-scalars.md) with `Review.updatedAt`) or use the data source directly:

```js
export default {
  Query: ...
  Review: {
    id: review => review._id,
    author: (review, _, { dataSources }) =>
      dataSources.users.findOneById(review.authorId),
    fullReview: async (review, _, { dataSources }) => {
      const author = await dataSources.users.findOneById(review.authorId)
      return `${author.firstName} ${author.lastName} gave ${
        review.stars
      } stars, saying: "${review.text}"`
    },
    createdAt: review => review._id.getTimestamp()
  },
  Mutation: ...
}
```

```gql
{ 
  reviews { 
    fullReview 
  } 
}
```

![reviews query with author names in fullReview](../../img/fullReview-with-author.png)

