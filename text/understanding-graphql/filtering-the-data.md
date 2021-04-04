---
title: Filtering the data
---

# Filtering the data

In most REST APIs we are implicitly asking the endpoint to return all data, completely unfiltered. This could result in a potentially large request being sent back to the user along with a number of time- or resource-intensive sub-queries being executed to load particular fields or child data. All together that means a slow response time, especially on mobile. Many large REST APIs will end up adding a process for filtering the fields returned. For example, if we pass in a query string to our REST API that was something like `?fields=username` then we’d expect that the returned object(s) would only include the `username` field. We can achieve this by writing a function to filter the fields:

[`rest-server.js`](https://github.com/GraphQLGuide/graphql-rest-api-demo/blob/master/rest-server.js)

```js
// Filter a user object based on the requested fields
const filterFields = (req, user) => {
  const { fields } = req.query

  // If no fields were specified we return all of them
  if (!fields) {
    return user
  }

  // Otherwise we assume the fields are a comma-separated
  // list of field names, and we generate a new object that
  // contains only those fields.
  const filteredUser = {}
  for (const field of fields.split(',')) {
    filteredUser[field] = user[field]
  }
  return filteredUser
}
```

And then we need to ensure that every time we send a user object, we filter it to only contain the fields requested by the client. Note the altered `res.send()` lines at the end of each endpoint’s handler function:

```js
// Listen for all GET requests to /users/:id URL (where the
// ID is the ID of the user account)
server.get('/users/:id', (req, res) => {
  // Try to find the user by their id (_id field), using the ID
  // parameter from the URL.
  User.findById(req.params.id, (err, user) => {
    if (err) {
      // The DB returned an error so we return a 500 error
      return res.status(500).end()
    }

    if (!user) {
      // No user was found so we return a 404 error
      return res.status(404).end()
    }

    // Return the user to the client (automatically serialized
    // as a JSON string)
    res.send(filterFields(req, user))
  })
})

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
    res.send(users.map(user => filterFields(req, user)))
  })
})
```

We can test to ensure it’s working when querying a single user:

```sh
$ curl http://localhost:3000/users/123
{"_id":"123","username":"jeresig"}

$ curl http://localhost:3000/users/123?fields=username
{"username":"jeresig"}

$ curl http://localhost:3000/users/123?fields=_id,username
{"_id":"123","username":"jeresig"}
```

And also when querying all users:

```sh
$ curl http://localhost:3000/users
[{"_id":"123","username":"jeresig"},{"_id":"456","username":"lorensr"}]

$ curl http://localhost:3000/users?fields=username
[{"username":"jeresig"},{"username":"lorensr"}]

$ curl http://localhost:3000/users?fields=_id,username
[{"_id":"123","username":"jeresig"},{"_id":"456","username":"lorensr"}]
```

With GraphQL, filtering is available by default. Remember how we had to specify which user fields we wished returned? GraphQL effectively requires that we specify a “fields” filter for every object. If we wanted to just fetch the `username` fields with GraphQL, the query would look like this:

```gql
query {
  users {
    username
  }
}
```

And the response would only include the fields that were specified:

```json
{"data":{"users":[{"username":"jeresig"},{"username":"lorensr"}]}}
```

Our field-filtering example is trivial: an object without any child objects. What would happen if the user object had a child object that also had fields we wished to include or exclude? What if some excluded fields took extra time to fetch from the database, and instead of just filtering them out, we wanted to avoid fetching them in the first place? The implementation of these things in the REST API sounds quite intimidating, so we’ll leave that as an exercise to the reader 😁. With GraphQL, it’s just a matter of specifying the fields we wish to include in our query. Having a standard method of field specification means that it’s easier for the server to avoid loading or querying unnecessary data from the database, and we can track precisely which fields are being used and which aren’t. This is exciting, as we can use the field usage information to improve our database or help with migrating to a new schema. All of these benefits will be discussed in depth in this book.

