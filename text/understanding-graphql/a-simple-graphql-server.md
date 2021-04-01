# A simple GraphQL server

What does our REST server look like in the world of GraphQL? GraphQL has the concept of a schema—it’s similar to those in Mongoose and other data model libraries, but a GraphQL schema is used differently. In Mongoose the schema is a representation of the data that’s stored in the MongoDB database, but that’s not necessarily the case for a GraphQL schema. A GraphQL schema doesn’t need to match the storage format and can represent data from more than one source. To represent our basic User:

```gql
type User {
  _id: String
  username: String
}
```

This tells GraphQL that we have a type named `User` with two fields: `_id` and `username`, both strings. This alone doesn’t really do anything, though. GraphQL doesn’t know how to fetch this data or what interface(s) to set up for the client to query. We’ll write a function for the former in a bit, and we can do the latter—define a simple query interface—using the same schema syntax as above:

```gql
type Query {
  user(id: String!): User
}
```

In this case, we’re saying that we want a single query field (named `user`) that accepts a single argument (a required string named `id`) and returns a `User` type. This tells GraphQL how we want the client to be able to interact with the data, but GraphQL still doesn’t know how to actually get that data out of our database. Thankfully, we can make good use of the Mongoose models that we built before. GraphQL just needs to know what to do when the client sends a `user(id)` query. The Node.js GraphQL implementation makes smart use of Promises—we only need to return a Promise that resolves to a User, like this:

```js
function user({ id }) {
  return User.findById(id)
}
```

Putting it all together, we end up with a full GraphQL server:

[`graphql-server.js`](https://github.com/GraphQLGuide/graphql-rest-api-demo/blob/master/graphql-server.js)
```js
const graphqlHTTP = require('express-graphql')
const { buildSchema } = require('graphql')
const express = require('express')
const server = express()

// Get the Mongoose models used for querying the database
const { User } = require('./models.js')

// Start up a GraphQL endpoint listening at /graphql
server.use(
  '/graphql',
  graphqlHTTP({
    // We construct our GraphQL schema which has two types:
    // The User type and the Query type (through which all
    // queries for data are defined)
    schema: buildSchema(`
        type User {
            _id: String
            username: String
        }

        type Query {
            user(id: String!): User
        }
    `),
    // The methods that we'll use to get the data for our
    // main queries
    rootValue: {
      // Get a user based on the ID and return it as a Promise
      user({ id }) {
        return User.findById(id)
      }
    },
    // Display the GraphiQL web interface (for easy usage!)
    graphiql: true
  })
)

// Start the application, listening on port 3000
server.listen(3000)
```

As before, this program creates an Express server, but instead of making a `'/users/:id'` endpoint, it sets up an endpoint at `'/graphql'` that, using the schema we provide, allows clients to make the `user(id)` query. 

We can see now how an API consumer makes their query:

```gql
query {
  user(id: "123") {
    _id
    username
  }
}
```

In addition to having a custom language for specifying the schema, GraphQL also has a language for specifying queries. This is more verbose than a REST API: with REST, the query is embedded in the URL itself; in GraphQL, we specify the endpoint that we’re calling (`user`) along with the argument (`id` with a value of `"123"`), and we also list every `User` field we want the server to return. This extra syntax is what makes GraphQL so flexible and explicit: it gives us an exact list of the data we are attempting to fetch.

We have a couple of options if we want to run this query and get the data back from the server. To start, let’s use the command line to show how a typical query might be executed:

```sh
$ curl -X POST -H "Content-Type:application/json" \
>     -d '{"query": "{user(id: \"123\"){_id username}}"}' \`
>     http://localhost:3000/graphql
{"data":{"user":{"_id":"123","username":"jeresig"}}}
```

We’re submitting our query as a POST request to the GraphQL endpoint and getting back a JSON response, like with the REST API. The response format is a bit different—our data is returned inside the `"data"` property, and the structure of the data matches our GraphQL query.

What happens when we attempt to query for a user that doesn’t exist? Does it return a 404 like with a REST API?

```sh
$ curl -X POST -H "Content-Type:application/json" \
>     -d '{"query": "{user(id: \"123\"){_id username}}"}' \
>     http://localhost:3000/graphql
{"data":{"user":null}}
```
No, in fact! Every time we query a GraphQL endpoint, we get a valid JSON response. In this case `"user"` is `null`, as its value wasn’t able to be determined. This becomes very useful when we handle permissions and errors, which we’ll get into [later](security-&-error-handling.md).

When we run our server (`node graphql-server.js`) and visit [localhost:3000/graphql](http://localhost:3000/graphql) in the browser, we see GraphiQL::

![GraphiQL web interface](../img/graphiql.jpg)
*The results returned from a query inside the GraphiQL web interface.*

> You can also try out a hosted version here: [ch1.graphql.guide/graphql](https://ch1.graphql.guide/graphql)

Seeing or using GraphiQL for the first time is often the moment that software engineers become GraphQL converts.  It offers an an intuitive interface to read the documentation for and query a GraphQL schema. We can write a query, see the results returned from the server, and explore the documentation on the right that’s been automatically generated from the schema. This is something that REST can’t replicate without a ton of extra work or an additional framework. GraphQL is only just starting to pay off, though—as the REST API becomes more and more complex, the complexity of the equivalent GraphQL API remains the same.

