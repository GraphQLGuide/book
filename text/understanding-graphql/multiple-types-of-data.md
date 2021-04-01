# Multiple types of data

Thus far we’ve been retrieving data in a way that is stylistically similar to the REST API endpoint: we request a single user, or a list of users, and that’s it. Retrieving data in this way aligns well with the expectations of a normal, well-designed REST API. However, fundamentally, a REST API is not designed for the data requirements of a modern application. Modern applications need to access many different types of data simultaneously in order to successfully render a result. An app might need to show not just a User but also their Posts and the Comments.

The client should be in control of requesting the data they want from the server. Ideally, this should be done in a single HTTP request. With REST, we can either make multiple HTTP requests to get the different types of data we need for a page, or we can design a custom REST endpoint that returns everything all at once. GraphQL employs a different strategy: a GraphQL endpoint can return many types and execute many queries, not just one. This gives the caller the power of being able to fetch any and all data needed in a single request.

If we want to request multiple types of data with a basic REST API—one in which each endpoint deals with a single type—our client code might look something like this:

```js
const getUserWithGroup = user =>
  fetch(`http://localhost:3000/groups/${user.groupId}`)
    .then(response => response.json())
    .then(group => ({
      ...user,
      group
    }))

fetch('http://localhost:3000/users')
  .then(response => response.json())
  .then(users => Promise.all(users.map(getUserWithGroup)))
  .then(usersWithGroups => {
    console.log(usersWithGroups)
  })
```

First we request the users from the server, and once they’ve been returned, we request each user’s group. Once all the groups are returned, we have an array of full user objects to use. Here is the equivalent code using our GraphQL API:

```js
import { request } from 'graphql-request'

const query = `{ 
  users { 
    username 
    group { 
      name 
    } 
  } 
}`

request('http://localhost:3000/graphql', query).then(({ users }) => {
  console.log(users)
})
```

We don’t have to wait for two round-trip requests to the server, and we don’t have to write code to manage the Promises or combine the data in the response objects. 

As the complexity of a query scales, the conciseness of GraphQL becomes increasingly compelling. Let’s say we wanted to get the current `User`, their `Post`s, and each posts’s `Comment`s:


```js
import { request } from 'graphql-request'

const query = `{ 
  currentUser { 
    username 
    posts {
      title
      comments {
        text
        createdAt
      }
    }
  } 
}`

request('http://localhost:3000/graphql', query).then(({ currentUser }) => {
  console.log(currentUser)
})
```

We get back a user object that has a list of posts, and each post has a list of comments. The equivalent REST logic is even more complicated than our `usersWithGroups` example, the latency would increase to three round trips (first for the user, then for their posts, and then once we have the posts, for the posts’ comments), and the total number of requests would be very high. For example, if the user had 5 posts, each of which had 4 comments, we’d be sending 26 requests: 1 to get the user, 5 to get the posts, and 5 * 4 = 20 to get all the comments.

We could simplify the REST client code and reduce latency by adding more complexity to our REST API. Instead of our endpoints dealing with a single type, we could have them return multiple types, as we did for the user’s `group` field in the last section. We could also get all the current user’s post and comment data with `http://localhost:3000/currentUser?fields=posts,posts_comments`, but it would require more complex logic for filtering nested fields.

We’ve looked at the differences between using a REST API and a GraphQL API to fetch a single type that has fields of other types, but what about fetching multiple different top-level types? If we’re implementing an app’s homepage, we might want the current user’s name and photo, a list of their recent notifications, and a list of the most recent posts. We could fetch that in three requests with `/currentUser`, `/notifications`, and `/posts`, but if we wanted to fetch all the data in a single request, we would need a view-specific endpoint, for example `/homepage`. There are a few issues with building and maintaining view-specific endpoints. Between all our client platforms—for example, web, iOS, and Android—we could have a lot of views, which means a lot of endpoints to code. Even if the endpoints are all using the same model layer for database access, there’s still the logic of putting together the response object and supporting any query parameters we might want. When we remove a part of a view—for instance, the recent posts from the homepage—the client is overfetching (getting more data than it needs) until we update the `/homepage` endpoint. And when we want to add new parts to views, we need to wait for the backend team to add the required data to the endpoint. Add versioning to all these changing endpoints in order to keep supporting older native clients (or older developer integrations, in the case of public APIs), and we’ve got a huge mess.

Fetching multiple top-level types from a GraphQL API doesn’t require that much new code. Let’s say we wanted to get a list of all of the Users and Groups in our database in a single request. We have to add in the new access points to get the Group data, like we did for the User:

[`graphql-server.js`](https://github.com/GraphQLGuide/graphql-rest-api-demo/blob/master/graphql-server.js):

```js
// Get the Mongoose models used for querying the database
const {User, Group} = require('./models.js')

// Start up a GraphQL endpoint listening at /graphql
server.use(
  '/graphql',
  graphqlHTTP({
    schema: buildSchema(`
        …

        type Query {
            user(id: String!): User
            users: [User]
            group(id: String!): Group
            groups: [Group]
        }
    `),
    // The query fields that we'll use to get the data for our
    // main queries
    rootValue: {
      user({id}) { … },
      users() { … },

      // Get a group based on the ID and return it as a Promise
      group({id}) {
        return Group.findById(id)
      },
      // Get an array of groups and return them as a Promise
      groups() {
        return Group.find({})
      }
    }
  })
)
```

And now it works! If we load up our GraphiQL web interface, we can see that we not only have access to the existing `user` and `users` query fields, but also to the new `group` and `groups` fields. More importantly, we can include multiple query fields in a single request:

![One query for both users and groups in GraphiQL](../img/users-and-groups.jpg)
*The results for all users and all groups inside the GraphiQL web interface.*

Here, we’ve retrieved a list of all the users along with the group they’re in. Additionally, we’ve retrieved a complete list of all the groups in the database, and all of this information was retrieved in parallel.

What’s especially nice is that we don’t have to limit ourselves to just lists of data—we can mix in any number of query fields, like the `group` query field:

![One query for users, groups, and a group in GraphiQL](../img/users-groups-and-group.jpg)
*The results for all users, groups, and a single group inside the GraphiQL web interface.*

In this case, we’re requesting three query fields simultaneously (getting a list of all users, a list of all groups, and also a specific group) and returning all the data in a single request. This represents a level of customization and flexibility that is quite challenging to implement with a traditional REST API. 

In summary, the advantages of using GraphQL for fetching multiple data types are:

- **The client retains control over its data requirements:** Instead of the REST endpoint dictating the queries being run and the data returned, the client can specify the queries and the desired data and get it all back in a single request.
- **Simpler server:** The server doesn’t have to attempt to permute all of the possible desired endpoints. This helps reduce the cost and surface area for the API. We don’t have to know about all the use cases or platforms that the data will eventually appear in, so the implementation becomes much simpler and easier to maintain.
- **Fewer requests:** It reduces the number of distinct requests for data, and thus the burden on both the client and the server. If we were to request three different pieces of data from a REST API, it could potentially require three different endpoints and three distinct HTTP requests. With GraphQL, we’re guaranteed to have a single request and the same unchanged implementation.
- **Faster:** It reduces the latency in the overall request by allowing most of the data loading to be done on the server rather than the client (which has to wait for the current HTTP request to complete before initiating any other requests that depend on the current request’s response).

