---
title: Querying a set of data
---

# Querying a set of data

If we want to expand our REST API to allow for querying all of the users in our database, we need to add a new endpoint:

[`rest-server.js`](https://github.com/GraphQLGuide/graphql-rest-api-demo/blob/master/rest-server.js):

```js
// Listen for all GET requests to /users
server.get('/users', (req, res) => {
  // Find all of the users in the database collection (we pass in
  // an empty collection as we aren't filtering the results)
  User.find({}, (err, users) => {
    if (err) {
      // The DB returned an error so we return a 500 error
      return res.status(500).end()
    }

    // Return the array of users to the client (automatically
    // serialized as a JSON string)
    res.send(users)
  })
})
```

Like before, we can do a GET request to the new `/users` endpoint to see the user data returned as an array of objects:

```sh
$ curl http://localhost:3000/users
[{"_id":"123","username":"jeresig"},{"_id":"456","username":"lorensr"}]
```

With our GraphQL endpoint, we can achieve a similar result by adding a `users` query to our schema:

```gql
type Query {
  user(id: String!): User
  users: [User]
}
```

And by adding an associated loader for that data, which is just a single function:

[`graphql-server.js`](https://github.com/GraphQLGuide/graphql-rest-api-demo/blob/master/graphql-server.js)

```js
// The query fields that we'll use to get the data for our
// main queries
rootValue: {
  user({ id }) { … },
  // Get an array of users and return them as a Promise
  users() {
    return User.find({})
  }
},
```

And that’s all we need! The query syntax changes ever so slightly to make this new `users` query, but the rest of it stays intact. We still ask for the fields on the `User` type that we want, but we do so with the same syntax, even though we’re operating against a set of users (rather than a single object). The query:

```gql
query {
  users {
    _id
    username
  }
}
```

This is one of the beauties of GraphQL: it’s designed to scale easily from a single object to multiple with little change in our code. The result is as we would expect—it’s just an array of user objects on the `"users"` attribute.

```json
{"data":{"users":[{"_id":"123","username":"jeresig"},{"_id":"456","username":"lorensr"}]}}
```

Now that we have the basics out of the way, let’s look at some of the advanced features of REST APIs that GraphQL makes trivial.

