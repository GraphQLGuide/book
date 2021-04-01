## Custom scalars

> If you’re jumping in here, `git checkout 6_0.2.0` (tag [6_0.2.0](https://github.com/GraphQLGuide/guide-api/tree/6_0.2.0), or compare [6...7](https://github.com/GraphQLGuide/guide-api/compare/6_0.2.0...7_0.2.0))

In the last section we mentioned that the `ID` scalar is serialized like a string, but what does that process look like, and how do we make our own scalars? The only built-in scalars are `Int`, `Float`, `String`, `Boolean`, and `ID`. Another scalar type that most apps use is a date. For example, it would be nice to have a `Review.createdAt`. We could make it an `Int`, but then is it seconds or milliseconds since the [Unix epoch](https://en.wikipedia.org/wiki/Epoch_(computing\))? Or it could be a `String`, but there are a lot of string date formats out there. And both ways are missing validation (testing whether the string is a valid date string) and the improved understanding that comes from being able to know, looking at the schema, which fields are meant to be dates. So let’s make our own `Date` scalar. We can add it to our schema:

[`src/schema/schema.graphql`](https://github.com/GraphQLGuide/guide-api/compare/6_0.2.0...7_0.2.0)

```gql
scalar Date

type Query {
  hello: String!
  isoString(date: Date!): String!
}

#import 'Review.graphql'
#import 'User.graphql'
```

[`src/schema/Review.graphql`](https://github.com/GraphQLGuide/guide-api/compare/6_0.2.0...7_0.2.0)

```gql
type Review {
  id: ID!
  text: String!
  stars: Int
  fullReview: String!
  createdAt: Date!
  updatedAt: Date!
}

...
```

First we declare the new scalar type (`scalar Date`), and then we use it for a new `isoString` query as well as `createdAt` and `updatedAt` fields on `Review`. We make them non-nullable because all Review objects will have them.

> We can use the word `Date` for our type because we don’t have other types of dates or times in our app. If we also had a `Date` that had no time component, like a birthday, or a `Time` that had no date component, like 14:00 (2 p.m.), we could call our new scalar `DateTime`.

`isoString` takes a `Date` as an argument and returns the date formatted as a string in the [ISO format](https://en.wikipedia.org/wiki/ISO_8601):

[`src/resolvers/index.js`](https://github.com/GraphQLGuide/guide-api/compare/6_0.2.0...7_0.2.0)

```js
const resolvers = {
  Query: {
    hello: () => '🌍🌏🌎',
    isoString: (_, { date }) => date.toISOString()
  }
}
```

Next we add to our resolvers a `GraphQLScalarType`, which tells Apollo Server how to handle a custom scalar. It will look like this:

[`src/resolvers/Date.js`](https://github.com/GraphQLGuide/guide-api/blob/7_0.2.0/src/resolvers/Date.js)

```js
import { GraphQLScalarType } from 'graphql'

export default {
  Date: new GraphQLScalarType({
    name:
    description:
    parseValue(value) {}
    parseLiteral(ast) {}
    serialize(date) {}
  })
}
```

`GraphQLScalarType` takes five parameters:

- `name` matches the scalar name we added to the schema, so `'Date'`
- `description` is shown in the schema section of GraphiQL and Playground. It says what the scalar represents and how it appears in the JSON response from a server. The built-in description for `ID`, for instance, is:

> The `ID` scalar type represents a unique identifier, often used to refetch an object or as a key for a cache. The ID type appears in a JSON response as a String; however, it is not intended to be human-readable. When expected as an input type, any string (such as `"4"`) or integer (such as `4`) input value will be accepted as an ID.

- `parseValue(value)` is a function called when the server receives a query variable for a Date argument. The variable’s value is passed to `parseValue()`, and the function should return the value in our desired format—in this case, a JavaScript Date object. For example, if the client sends this query:

```gql
query ISOString($date: Date!) {
  isoString(date: $date)
}
```

with this as the variables JSON:

```json
{
  "date": 1442188800000
}
```

then `parseValue` is passed the integer `1442188800000` and should return a JS Date object, which Apollo Server will provide to our resolver, which calls `.toISOString()` on the JS Date object:

```
  isoString: (_, { date }) => date.toISOString()
```

![isoString query with a variable](../../img/isoString-with-variable.png)

- `parseLiteral(ast)` is called when the server receives a query with a literal argument—meaning the argument is written in the query document itself instead of being provided separately in JSON (as variables are). `ast` stands for abstract syntax tree, which is an object that Apollo Server uses to parse the query document. `ast.value` has the literal value, and is always a string. Similar to `parseValue()`, `parseLiteral()` should return the server’s internal representation of the scalar type. If the client sends this query document:

```gql
{
  isoString(date: 1442188800000)
}
```

Then `parseLiteral(ast)` will be called, and `ast.value` will be `"1442188800000"`.

- `serialize(date)` is called when the server is formatting a JSON response for the client. A resolver returns a JS Date object, then Apollo Server calls `serialize()` with that object, and `serialize()` returns the date in a format that can be put into the JSON response—which in our implementation of the `Date` scalar is an integer. For example, if the `Review.createdAt` resolver returns a JS Date, we would see an integer in the response:

![Query for Review.createdAt returning an integer](../../img/reviews-createdAt.png)

> If you're following along, this query won't work until we fill in `Date.js` and add it to `src/resolvers/index.js`.

Here’s a basic implementation of the above:

```js
import { GraphQLScalarType } from 'graphql'

export default {
  Date: new GraphQLScalarType({
    name: 'Date',
    description: `The \`Date\` scalar type represents a single moment in time. 
    It is serialized as an integer, equal to the number of milliseconds since 
    the Unix epoch.`,
    parseValue: value => new Date(value),
    parseLiteral: ast => new Date(parseInt(ast.value)),
    serialize: date => date.getTime()
  })
}
```

`parseValue()` takes the integer and creates a `Date`. `parseLiteral()` gets the `ast.value` string, converts it into an integer, and creates a `Date`. `serialize()` takes the date and returns the milliseconds since epoch.

One important aspect of defining a custom scalar that we’re missing is validation. If we check the values we’re getting and throw errors with descriptive messages, it will help people using our API. Let’s do that:

[`src/resolvers/Date.js`](https://github.com/GraphQLGuide/guide-api/blob/7_0.2.0/src/resolvers/Date.js)

```js
import { GraphQLScalarType } from 'graphql'
import { Kind } from 'graphql/language'

const isValid = date => !isNaN(date.getTime())

export default {
  Date: new GraphQLScalarType({
    name: 'Date',
    description:
      `The \`Date\` scalar type represents a single moment in time. It is serialized as an integer, equal to the number of milliseconds since the Unix epoch.',

    parseValue(value) {
      if (!Number.isInteger(value)) {
        throw new Error('Date values must be integers')
      }

      const date = new Date(value)
      if (!isValid(date)) {
        throw new Error('Invalid Date value')
      }

      return date
    },

    parseLiteral(ast) {
      if (ast.kind !== Kind.INT) {
        throw new Error('Date literals must be integers')
      }

      const date = new Date(parseInt(ast.value))
      if (!isValid) {
        throw new Error('Invalid Date literal')
      }

      return date
    },

    serialize(date) {
      if (!(date instanceof Date)) {
        throw new Error(
          'Resolvers for Date scalars must return JavaScript Date objects'
        )
      }

      if (!isValid(date)) {
        throw new Error('Invalid Date scalar')
      }

      return date.getTime()
    }
  })
}
```

In `parseValue()` and `parseLiteral()`, we check whether the client sent an integer, then we create a JS Date and check whether it’s valid. In `serialize()` we check that the value returned from a resolver is a JS Date object, then we check if it’s a valid date, and finally we return the milliseconds since epoch.

We add this file to our resolvers in `resolvers/index.js` by importing and adding to our `resolversByType` array:

[`src/resolvers/index.js`](https://github.com/GraphQLGuide/guide-api/compare/6_0.2.0...7_0.2.0)

```js
...

import Review from './Review'
import User from './User'
import Date from './Date'

export default [resolvers, Review, User, Date]
```

We saw our `isoString` query working above, but now if we make a mistake, we get a helpful error message:

![Error passing a string as a date literal](../../img/date-literal-error.png)

![Error passing a string as a date variable](../../img/date-variable-value-error.png)

The last part of our schema change for which we have to implement resolvers is `Review`’s `createdAt` and `updatedAt`. In MongoDB, the creation time is included in the default ID format, [ObjectId](https://docs.mongodb.com/manual/reference/method/ObjectId/). The first 4 bytes are the seconds since Unix epoch, so we can get the creation time from that. (And since it’s the first 4 bytes, we can also sort by an ObjectId to order by most/least recently created.) The `mongodb` node library provides a method `ObjectId.getTimestamp()` that extracts the date for us:

[`src/resolvers/Review.js`](https://github.com/GraphQLGuide/guide-api/compare/6_0.2.0...7_0.2.0)

```js
export default {
  Query: ...
  Review: {
    ...
    createdAt: review => review._id.getTimestamp()
  },
  Mutation: ...
}
```

`updatedAt` is a field that we’ll have to store in the database when reviews are created and update when reviews are modified. We don’t have a way of modifying reviews yet, so we’ll just add a line to our creation method:

[`src/data-sources/Reviews.js`](https://github.com/GraphQLGuide/guide-api/compare/6_0.2.0...7_0.2.0)

```js
import { MongoDataSource } from 'apollo-datasource-mongodb'

export default class Reviews extends MongoDataSource {
  ...

  create(review) {
    review.updatedAt = new Date()
    this.collection.insertOne(review)
    return review
  }
}
```

Now we can include `updatedAt` in our `reviews` query, but we get the error `Cannot return null for non-nullable field Review.updatedAt`:

![Error querying for Review.updatedAt](../../img/review-updatedAt-error.png)

Apollo Server is telling us that it can’t return `null` for `Review.updatedAt` to the client because the schema says it’s a non-nullable field. Why is it *trying* to return `null` for `Review.updatedAt`? It’s not—our resolver is. Our `reviews` resolver is returning reviews fetched from the database, but none of them have an `updatedAt` property because they were inserted before we updated our `Reviews.create()` data source method. We could fix our reviews in the database by adding an `updatedAt` field, but let’s just delete them and re-create. If you’d like a GUI (*Graphical User Interface*, i.e., a program that runs in its own window instead of in the command line) for interacting with MongoDB, we recommend [MongoDB Compass](https://www.mongodb.com/products/compass). Here’s how to delete all of our reviews using the `mongo` command-line shell:

```sh
$ mongo
MongoDB shell version v4.0.3
connecting to: mongodb://127.0.0.1:27017
...

> use guide
switched to db guide
> db.reviews.find({})
{ "_id" : ObjectId("5cdfb1946df8548efb438535"), "text" : "Passing", "stars" : 3 }
{ "_id" : ObjectId("5cdfb1e4a1cf288f4d86dced"), "text" : "Passing", "stars" : 3 }
{ "_id" : ObjectId("5cdfb28e48435b90119bd2c6"), "text" : "Passing", "stars" : 3 }
> db.reviews.remove({})
WriteResult({ "nRemoved" : 3 })
> db.reviews.find({})
> exit
bye
```

Our second call to `db.reviews.find({})` doesn’t show results because the collection is now empty. And when we do our `reviews` query, we get back an empty array. Now if we use Playground to send a `createReview` mutation, then we can do a `reviews` query with the `createdAt` and `updatedAt` fields:

![reviews query with createdAt and updatedAt in the selection set](../../img/reviews-with-updatedAt.png)

The last three digits of `createdAt` will always be `000` because the API returns milliseconds since Epoch, and all that’s stored in the ObjectId is *seconds* since Epoch.

An alternative to clearing the database collection would have been to add a resolver for `Review.updatedAt` that returns `Review.createdAt` when there’s no `updatedAt` property on the review object. In order to call another resolver, we’d need to name the resolver’s object and move `export default` to the end:

[`src/resolvers/Review.js`](https://github.com/GraphQLGuide/guide-api/compare/6_0.2.0...7_0.2.0)

```js
const resolvers = {
  Query: {
    reviews: ...
  },
  Review: {
    id: ...
    fullReview: ...
    createdAt: review => review._id.getTimestamp(),
    updatedAt: review => review.updatedAt || resolvers.Review.createdAt(review)
  },
  Mutation: {
    createReview: ...
  }
}

export default resolvers
```

Then we could reference another resolver function (`resolvers.Review.createdAt(review)`).

In this section we created a new `Date` scalar type, added `Query.isoString`, which has a `Date` argument, and `Review.createdAt` and `Review.updatedAt`, which resolve to `Date`s. We’ll continue to use the `Date` type in the rest of our app, for instance for `User.createdAt/updatedAt` in the next section.

