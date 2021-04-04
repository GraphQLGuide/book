---
title: Async data loading
---

# Async data loading

The data-loading code we’ve written so far has a simplistic structure: all of the data is held directly by the model. That’s easy to manage in a REST API, but it gets harder when we want to return subobjects. For example, if each user were in a group, and we wanted that group’s object to be returned along with the user, the code would become much more complex. Let’s see what that would look like.

We need to update the `users` collection with a new `groupId` field:

![users collection with groupIds in MongoDB](../img/users-groupid-mongo.jpg)
*The updated user models with a new `groupId` field in the MongoDB database.*

`groupId` refers to a group in the `groups` collection. A group has `_id` and `name` fields:

![groups collection in MongoDB](../img/groups-mongo.jpg)
*The new group models in the MongoDB database.*

We’d like to have the group object available as a property on the User model instead of the `groupId`:

```sh
$ curl http://localhost:3000/users/123
{"_id":"123","username":"jeresig","group":{"_id":"dev","name":"Developers"}}
```

Our first coding step is creating a Group model (which we’ll use for both the REST and GraphQL implementations) to hold the Group details, and then we’ll add a method to the User model for retrieving its associated Group (returning a Promise that resolves to that group).

[`models.js`](https://github.com/GraphQLGuide/graphql-rest-api-demo/blob/master/models.js):

```js
// Create a Group schema to be stored in the MongoDB database
const GroupSchema = new mongoose.Schema({
  _id: String,
  name: String
})

// Turn that schema into a model that we can query
const Group = mongoose.model('Group', GroupSchema)

// Create a User schema to be stored in the MongoDB database
const UserSchema = new mongoose.Schema({
  _id: String,
  username: String,
  groupId: String
})

// Retrieve the group associated with the user
UserSchema.methods.group = function() {
  // Use .exec() to ensure a true Promise is returned
  return Group.findById(this.groupId).exec()
}

// Turn that schema into a model that we can query
const User = mongoose.model('User', UserSchema)

module.exports = { User, Group }
```

We don’t want to ever return the `groupId` field—instead we just want to return the group object (which can only be obtained by resolving the Promise returned from the `.group()` method). We’ll need to update our application code in a number of ways to handle all of this asynchronous data loading. To start, we can update `filterFields()` to work asynchronously and resolve the Promises if they exist:

[`rest-server.js`](https://github.com/GraphQLGuide/graphql-rest-api-demo/blob/master/rest-server.js)

```js
// A list of the fields that are allowed to be accessed
const defaultFields = ['_id', 'username', 'group']

// Filter a user object based on the requested fields
const filterFields = async function(req, user) {
  // We assume the fields are a comma-separated list of field
  // names, if none is specified then we return all fields.
  const fieldKeys = req.query.fields
    ? req.query.fields.split(',')
    : defaultFields

  // Generate a new object that contains only those fields.
  const filteredUser = {}
  for (const field of fieldKeys) {
    // If the field is a function then we expect it to return
    // a Promise which we will immediately resolve.
    if (typeof user[field] === 'function') {
      filteredUser[field] = await user[field]()
    } else {
      filteredUser[field] = user[field]
    }
  }
  return filteredUser
}
```

We have to add a list of `defaultFields`, as we want to ensure that `group` is included and `groupId` is excluded. Now we can use our new asynchronous function in our API endpoints. For the first, we just make the `findById` callback `async` and `await filterFields()` before sending the response. For the second, we have to use `Promise.all()`:

```js
// Listen for all GET requests to /users/:id URL (where the
// ID is the ID of the user account)
server.get('/users/:id', (req, res) => {
    // Try to find the user by their id (_id field), using the ID
    // parameter from the URL.
    User.findById(req.params.id, async (err, user) => {
        if (err) {
            // The DB returned an error so we return a 500 error
            return res.status(500).end()
        }

        if (!user) {
            // No user was found so we return a 404 error
            return res.status(404).end()
        }

        // Return the user to the client (automatically serialized
        // as a JSON string). We need to wait for all of the fields
        // to load before we can return the results.
        res.send(await filterFields(req, user))
    })
})

// Listen for all GET requests to /users
server.get('/users', (req, res) => {
  // Find all of the users in the database collection (we pass in
  // an empty collection as we aren't filtering the results)
  User.find({}, async (err, users) => {
    if (err) {
      // The DB returned an error so we return a 500 error
      return res.status(500).end()
    }

    // Return the array of users to the client (automatically
    // serialized as a JSON string) We need to wait for all
    // of the Promises to resolve for all of the users.
    res.send(await Promise.all(users.map(user => filterFields(req, user))))
  })
})
```

This solution works exactly as we expect it to, returning a group object along with the other fields:

```sh
$ curl http://localhost:3000/users/123
{"_id":"123","username":"jeresig","group":{"_id":"dev","name":"Developers"}}

$ curl http://localhost:3000/users/123?fields=username,group
{"username":"jeresig","group":{"_id":"dev","name":"Developers"}}

$ curl http://localhost:3000/users
[{"_id":"123","username":"jeresig","group":{"_id":"dev","name":"Developers"}},{"_id":"456","username":"lorensr","group":{"_id":"author","name":"Authors"}}]

$ curl http://localhost:3000/users?fields=username,group
[{"username":"jeresig","group":{"_id":"dev","name":"Developers"},{"username":"lorensr","group":{"_id":"author","name":"Authors"}}]
```

The code has become harder to follow and understand—there’s no longer a clean one-to-one relationship between the data on the model and what we want to return, and handling asynchronous functions ramped up the complexity.

Let’s compare this solution with how it would work in GraphQL. We already have the changes to the Mongoose models, so we start out by updating the GraphQL schema to represent the new Group type:

```gql
type Group {
  _id: String
  name: String
}

type User {
  _id: String
  username: String
  group: Group
}
```

And… that’s it. That’s all the work that we need to do (beyond the minor changes that were made to the Mongoose models). We can open GraphiQL to try out our new field and see that it works immediately:

![Users with their groups in GraphiQL](../img/users-with-groups.jpg)
*The results for all users and their groups inside the GraphiQL web interface.*

GraphQL automatically handles values that are returned as Promises. The GraphQL server attempted to resolve the `group` field by executing the User model’s `.group` method and waiting until the Promise resolved before including the value.

Notice that because GraphQL requires filtering fields by specifying their names, we also have field filtering on the group submodel. We don’t have this in our REST API implementation.

It’s also important to note that GraphQL follows a best practice: it doesn’t query for any data that it doesn’t need. If the user never explicitly requests the `group` field, then the server won’t perform the database query to retrieve it. Following GraphQL’s patterns will result in an API that’s designed correctly—and optimally—from the get-go.

As the complexity of our data model starts to increase, so does the complexity of the implementation of our REST API (which is, due to all the features we’ve added to it, arguably already approaching unmaintainable levels of complexity). In contrast, GraphQL scales very gracefully: multiple models are no more challenging than one, and asynchronous data is just as easy as synchronous.

