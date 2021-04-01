## Schema validation

In this section we’ll go over schema validation and how to set it up using [Apollo Studio](https://www.apollographql.com/docs/graph-manager/). 

There are three places where our server is currently doing things that we might call schema validation: 

- `gql` parses our [SDL](https://www.apollographql.com/docs/apollo-server/schema/schema/#the-schema-definition-language) strings and throws errors when they’re invalid.
- On startup, `ApolloServer` checks the `typeDefs` it receives to see if our whole schema is valid, according to the GraphQL spec. 
- While running, `ApolloServer` validates queries against the schema.

However, usually the term *schema validation* refers to schema-change validation: i.e., ascertaining whether a *change* to a schema is valid. When we deploy a schema and clients use it, and we then change the schema and want to re-deploy, we can first use schema validation to check if the change is valid. “Valid” in this context can have different meanings. We could say it’s invalid if any of the changes are backward incompatible. However, sometimes we want to make backward-incompatible changes. So, often “valid” means the changes will work with X% of queries in the last N days. The default for Apollo Studio is 100% of queries in the last seven days. This way, backward-incompatible changes can be made as long as no clients have selected the changed field within the past week.

`graphql-inspector` is a command-line tool for [finding breaking or dangerous changes](https://graphql-inspector.com/docs/essentials/diff), and [GraphQL Doctor](https://github.com/cap-collectif/graphql-doctor) is a GitHub app that does the same for pull requests, comparing the PR’s schema against the schema in `master`. However, we recommend using Apollo Studio if you can (the validation feature requires a paid plan). Its method of validating against the query patterns of our clients is more broadly useful, and it’s easy to use from the command line, in continuous integration, and in GitHub PRs.

The first step to setting up Apollo Studio is setting the env var `APOLLO_KEY` to the API key we get from our [Apollo Studio account](https://studio.apollographql.com/). We already added it to our `.env` in the [Analytics](analytics.md) section. Having `APOLLO_KEY` configures the `apollo` command-line tool, which we use for schema registration and validation, and it enables metrics reporting (which we need for validation, because validation is based on clients’ queries, which are collected metrics).

The second step we also did in the Analytics section: Registering our schema with Apollo Studio. Let’s assume we have our app running in production at `api.graphql.guide`. We would register the production schema with:

```
$ npx apollo service:push --endpoint="https://api.graphql.guide/graphql" --tag=prod
```

We use `--tag` to denote the *variant*. Apollo Studio tracks variants of schemas, each with their own metrics and schema history. So the above command says to Apollo: “Introspect the schema at `api.graphql.guide` and save it as the latest version of our 'prod' schema variant.” 

> Registration has other uses beyond validation—it also powers the [Apollo VS Code extension](https://marketplace.visualstudio.com/items?itemName=apollographql.vscode-apollo) and Apollo Studio’s schema history and analytics.

Then, when we make changes to our schema, before we push to production, we check to see whether the change is valid by running `npm run dev` in one terminal and the following in another:

```
$ npx apollo service:check --endpoint="http://localhost:4000/graphql" --tag=prod
```

This says, “Introspect the schema of the server running on port 4000 of my machine and validate it against the latest production schema.” It will output either success or a list of which changes fail validation, like this:

```
$ npx apollo service:check ...
  ✔ Loading Apollo Project
  ✔ Validated local schema against tag prod on service engine
  ✔ Compared 8 schema changes against 110 operations over the last 7 days
  ✖ Found 2 breaking changes and 3 compatible changes
    → breaking changes found

FAIL    ARG_REMOVED                `Query.searchUsers` arg `term` was removed
FAIL    FIELD_REMOVED              `Review.stars` was removed

PASS    FIELD_ADDED                `Review.starCount` was added
PASS    ARG_ADDED                  `Query.searchUsers` arg `partialName` was added
PASS    TYPE_REMOVED               `ReviewComment` removed
PASS    FIELD_DEPRECATION_REMOVED  `Review.text` is no longer deprecated

View full details at: https://studio.apollographql.com/service/example-123/check/foo
```

Given the validation failure, we would know to not push to production. 

We can save ourselves time and the risk of forgetting to run the validation command by automating it—for instance, with the [Apollo Engine GitHub App](https://github.com/apps/apollo-engine) or with a continuous integration service like CircleCI:

`.circleci/config.yml`

```yaml
version: 2

jobs:
  validate_against_production:
    docker:
      - image: circleci/node:8

    steps:
      - checkout

      - run: npm install

      - run:
          name: Starting server
          command: npm start
          background: true

      # Wait for server to start up
      - run: sleep 5

      - run: npx apollo service:check --endpoint="http://localhost/graphql" --serviceName=users --tag=prod
```

Validating Apollo federation services is similar, and we’ll see how in the [Managed federation](../federation/managed-federation.md) section.

