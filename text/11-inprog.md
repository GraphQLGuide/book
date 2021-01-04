## Hasura

Background: [Databases](bg.md#databases), [SQL](bg.md#sql)

[Hasura](https://hasura.io/?ref=guide) is a GraphQL BaaS ([Backend as a Service](https://www.cloudflare.com/learning/serverless/glossary/backend-as-a-service-baas/)). In [Deployment > Options](#options) we covered IaaS, PaaS, and FaaS, which are different ways we can host our code. In BaaS, we don't have to write code—the server and database (PostgreSQL in the case of Hasura) are automatically set up based on our configuration.

> While it's true that we don't *have* to write code, many apps need at least a little custom logic, so there are various ways to write our own code or SQL statements and integrate them into our Hasura server's functioning. These ways—which we'll get to later in this section—include actions, triggers, functions, and remote schemas.

Here are the pros and cons of using Hasura instead of coding a server ourselves:

**Pros**

- Build faster: We trade writing a lot of code for learning simple configuration settings and a writing a little code here and there. As we can see by looking at this long Chapter 11 of the Guide, there is a *lot* of pieces that go into even a small production-ready GraphQL server, and Hasura does most of those for us.
- Performs better: If we write the whole server ourselves, we'd have bugs and performance issues. Hasura has a very performant design (more on that later), and most bugs have been found and worked out already by current users of the platform.
- No lock-in: We're not dependent on Hasura Inc., the company that created Hasura, to run our server—in fact, they don't even provide hosting! The code is open source, and can easily be deployed to Heroku or any cloud provider that supports Docker containers. This is a benefit over other closed-source provider-hosted BaaS's like Firebase and Parse.

**Cons**

- Less flexibility: While Hasura has many different features and ways to customize its behavior (which for the majority of applications are sufficient), there are some things we just wouldn't be able to do unless we learned Haskell and broke into the code of Hasura itself.
- Future uncertainty: While Hasura Inc. has a lot of funding and customers, it is a startup with an uncertain future. If it goes out of business, updates will fall to the open-source community, which would inevitably be less productive and proactive. And when we have problems, we'll no longer be able to go to the company's support channel of experts in the platform—we'll have to file an issue or post to Stack Overflow and hope the community responds, or dig into the platform code ourselves.

In this section, we'll use Hasura to create a GraphQL API similar to the Guide API we coded earlier. We'll start out with our users and reviews data in the format we used in the [SQL section](#sql), generate CRUD queries and mutations, and then go through modifications to match the Guide API. Through this process, we'll see how much less work it takes to build with Hasura than with code.

The first step is to deploy a Hasura server to Heroku. The "Deploy to Heroku" button on [this page](https://hasura.io/docs/1.0/graphql/manual/getting-started/heroku-simple.html) takes us to:

![Heroku Create New App page](img/hasura-heroku-create.png)

where we enter a name for our app and click "Deploy app." Once it's done, we get a deployment URL in the form of `[app name].herokuapp.com`, and when we visit `/console`, we see:

`https://guide-on-hasura.herokuapp.com/console`

![Hasura console on the GraphiQL tab](img/hasura-console.png)

The first tab is GraphiQL, pointed at our endpoint, `/v1/graphql`. We can click the "Secure your endpoint" link on the top right to create an admin secret key, which add as a request header named `x-hasura-admin-secret`:

![GraphiQL with added request header](img/hasura-admin-secret.png)

The second tab is our SQL table schemas. Currently we don't have any tables:

![Hasura console Data tab](img/hasura-data-console.png)

We can create tables in any of these ways:

- Through the web console's data tab, clicking "Create Table."
- Connecting to an existing PostgreSQL database and [selecting which tables](https://hasura.io/docs/1.0/graphql/manual/schema/using-existing-database.html) we want Hasura to use.
- Generating tables and importing data from a JSON file.

Let's do the third, taking the data from our SQLite database in the [SQL section](#sql):

`db.json`

```json
{
  "user": [
    {
      "id": 1,
      "first_name": "John",
      "last_name": "Resig",
      "username": "jeresig",
      "email": "john@graphql.guide",
      "auth_id": "github|1615"
    }
  ],
  "review": [
    {
      "id": 1,
      "text": "Passable",
      "stars": 3,
      "author_id": 1
    },
    {
      "id": 2,
      "text": "Breathtaking 😍",
      "stars": 5,
      "author_id": 1
    },
    {
      "id": 3,
      "text": "tldr",
      "stars": 1,
      "author_id": 1
    }
  ]
}
```

We use the [`json2graphql`](https://github.com/hasura/json2graphql) command-line tool to do the importing:

```sh
$ npm install -g json2graphql
$ json2graphql https://guide-on-hasura.herokuapp.com --db ./db.json 
```

When complete, we see six root Query fields in GraphiQL Explorer:

![review, review_aggregate, review_by_pk, and same for user](img/hasura-after-import.png)

- `review` returns a list of reviews that can be:
  - filtered with the [`where`](https://hasura.io/docs/1.0/graphql/manual/queries/query-filters.html) argument,
  - sorted with the [`order_by`](https://hasura.io/docs/1.0/graphql/manual/queries/sorting.html) argument, and
  - [paginated](https://hasura.io/docs/1.0/graphql/manual/queries/pagination.html) either with `limit` & `offset` or cursors.
- `review_aggregate` is for running [aggregation functions](https://hasura.io/docs/1.0/graphql/manual/queries/aggregation-queries.html) like count, sum, avg, max, min, etc.
- `review_by_pk` retrieves a single review by its primary key (in this case, `id`).

The other three queries do the same for users.

In the Data tab we see two SQL tables with columns and data matching our JSON:

![review table with four columns and three rows](img/hasura-review-table.png)

We're missing the `created_at` column—let's add it. We click the "Modify" tab and under "Add a new column," enter `created_at` as the column name, select `Timestamp` as the type, and select a Postgres function for the default value. We want `now()`, which returns the timestamp at the instant the row is inserted.

> Other possible default values for columns are [SQL functions](https://hasura.io/docs/1.0/graphql/manual/schema/default-values/sql-functions.html) (a.k.a. stored procedures) and [presets](https://hasura.io/docs/1.0/graphql/manual/schema/default-values/column-presets.html) based on the current user's role.

![review table > Modify > Add a new column form](img/hasura-add-created-at.png)

Now we have a `created_at` field:

![Data > review table](img/hasura-reviews-with-created-at.png)

All our rows have the same `created_at`—the time at which we added the column. But future rows will have the time of insertion. We can test it out with an `insert_review` mutation, which we can find in the GraphiQL Explorer by selecting "Add new Mutation" in the bottom-left and clicking the `+` button:

![Explorer with 12 mutations listed](img/hasura-admin-insert-review.png)

We also see the arguments, which are all the columns of a review. However, we don't want the client to decide `author_id` or `created_at`, so let's look at review permissions: Data tab, select review table, select Permissions tab. Right now, we have the `admin` role, but we can create a `user` role for all our users to have. We click the "x" in the insert column to edit insert permissions:

![Form for editing Role: user, Action: insert](img/hasura-add-insert-permission.png)

Under "Column insert permissions," we select `id`, `stars`, and `text`. (Normally `id` would be auto incrementing, but we took a shortcut with `json2graphql`, which doesn't generate auto incrementing ids.) We need to set the value of `author_id` to the current user's ID, which will be stored in the `X-Hasura-User-Id` session variable. We can set session variables by setting request headers in GraphiQL, and in production, they're decoded from the JWT or session ID.

After clicking "Save Permissions," we can add the user ID and role (via `x-hasura-role`) to our request headers and see our mutation list change: now `insert_review` is our only option. We can fill in all the arguments and run our mutation:

![insert_review mutation with successful response in GraphiQL](img/hasura-insert-review.png)

We can view our new review in the Data tab by changing our role to `admin` and making a `review` query:

![review query with all reviews included in the response](img/hasura-reviews.png)

We can see the `author_id` and `created_at` fields were set correctly 😊.

One issue we might be now noticing is that there's no `review.author` field, just a `review.author_id`. We can fix this by changing the `author_id` column to a foreign key and adding a "relationship." In the review table Modify tab, under Foreign Keys, we say that `author_id` references `id` in the `user` table:

![Add foreign key form](img/hasura-add-foreign-key.png)

Then in the Relationships tab, we click the "Add" button and name the field `author`:

![Relationships tab with suggested relationship](img/hasura-add-relationship.png)

Now we can select the `author` field:

![review query with author selected](img/hasura-review-author.png)

We can see that Hasura automatically translated the `first_name` SQL field to a `firstName` GraphQL field, and we can also [customize field names](https://hasura.io/docs/1.0/graphql/manual/schema/custom-field-names.html) as we wish. 

If we wanted to prevent users from selecting the `user.email` field, we would go to the Permissions tab of the `user` table, add a row for the `user` role, and edit the "select" cell.

The Guide API has a `searchUsers` query: 

```gql
type Query {
  searchUsers(term: String!): [UserResult!]!
}
```

We can do this with the `user` query and its [`where`](https://hasura.io/docs/1.0/graphql/manual/queries/query-filters.html) argument. If we expand it, we can see a list of [allowed operators](https://hasura.io/docs/1.0/graphql/manual/api-reference/graphql-api/query.html#operator). `_like` uses the Postgres `LIKE`, so we can use `'%term%'`:

![user query with one result](img/hasura-search-users.png)

`'%oh%'` matches John, so we get the user object in the response.

So far, we've just used the automatically generated queries and mutations, but we can also create our own with [actions](https://hasura.io/docs/1.0/graphql/manual/actions/index.html). We go to the Actions tab, click "Create", and:

- define a new Query or Mutation
- define any new types mentioned
- fill in the Handler URL
- click "Create"

![Create action page](img/hasura-create-action.png)

```gql
type Query {
  hello (
    input: HelloInput!
  ): HelloOutput!
}
```

```gql
input HelloInput {
  name : String!
  times : Int!
}

type HelloOutput {
  message : String!
  errors : [String!]
}
```

A handler is like a resolver: it's an HTTP endpoint that's given the arguments and returns the response object. When a client makes the `hello` query, Hasura makes a POST request to the handler with a body like this:

```js
{
  session_variables: { 'x-hasura-role': 'user', 'x-hasura-user-id': '1' },
  input: { input: { name: 'Loren', times: 3 } },
  action: { name: 'hello' }
}
```

Our code has to give a JSON response matching the `HelloOutput` type:

[hello.js](https://github.com/GraphQLGuide/hasura-fns/blob/master/api/hello.js)

```js
module.exports = (req, res) => {
  const {
    input: { name, times },
  } = req.body.input

  res.status(200).json({
    message: `Hello ${name.repeat(times)}`,
    errors: null,
  })
}
```

We can see it working in GraphiQL:

![hello query with expected response in GraphiQL](img/hasura-hello-query.png)

Here are some more Hasura features:

- [Validating](https://hasura.io/docs/1.0/graphql/manual/schema/data-validations.html) mutation arguments with one or more of these methods:
  - Postgres check constraints or triggers
  - Hasura permissions
  - Actions (when validation requires complex business logic or data from external sources)
- [Subscriptions](https://hasura.io/docs/1.0/graphql/manual/subscriptions/index.html) for either receiving changes to a field, or additions/alterations to a list
- [Triggers](https://hasura.io/docs/1.0/graphql/manual/event-triggers/index.html) that call HTTP endpoints whenever data in Postgres changes
- [Remote Schemas](https://hasura.io/docs/1.0/graphql/manual/remote-schemas/index.html): adding queries and mutations from other GraphQL APIs to our Hasura schema
- Request transactions: If multiple mutations are part of the same request, they are executed sequentially in a single transaction. If any mutation fails, all the executed mutations will be rolled back.
- [Many-to-many relationships](https://hasura.io/docs/1.0/graphql/manual/schema/relationships/index.html): Connections between object types that are based on a join table.
- [Views](https://hasura.io/docs/1.0/graphql/manual/schema/views.html): Postgres [views](https://www.postgresql.org/docs/current/sql-createview.html) exposing the results of a SQL query as a virtual table.
- [SQL functions](https://hasura.io/docs/1.0/graphql/manual/schema/custom-functions.html) that can be queried as GraphQL queries or subscriptions.

These are some of the reasons why Hasura performs so well: 

- Converts each operation into a single SQL statement with precise SELECTing and JOINs (similar to [Join Monster](#sql-performance))
- Transforms SQL statement results into GraphQL response data inside Postgres using JSON aggregation functions
- Uses prepared statements
- Uses Haskell and its [warp](https://www.stackage.org/package/warp) HTTP stack, which both have great performance
- Powers subscriptions with polling, which scales to [high write loads](https://github.com/hasura/graphql-engine/blob/master/architecture/live-queries.md)

[Hasura Pro](https://hasura.io/hasura-pro/) is a paid version of Hasura that includes:

- Analytics, which are helpful for finding slow queries and seeing errors in real time.
- Rate limiting. We can set limits based on:
  - Number of requests per minute
  - Query depth
- Allow-listing (safelisting): accept only a preset list of operations.
- Regression testing: automatically replay production traffic onto dev/staging.
