## GraphQL

If there’s a GraphQL API that we want to use data from, we have a few options:

- If we want to include parts of the API’s schema in our schema:
  - If it supports [federation](../apollo-federation.md), we should use that. For example, FaunaDB is [working on support](https://fauna.com/blog/fauna-engineering-looking-back-at-2019), and some third-party services we use might have a GraphQL API that supports federation. And if we have control over the API (e.g., if it’s one of our services), we can add support for federation.
  - We can use [schema stitching](https://www.apollographql.com/docs/graphql-tools/schema-stitching/) if the API doesn’t support federation. But unless we want a significant part of the API’s schema, it may be easier to use one of the below methods instead.
- If we just want to use data from the API in our resolvers:
  - Use `GraphQLDataSource` from [`apollo-datasource-graphql`](https://github.com/poetic/apollo-datasource-graphql#readme) to create a data source class. Similarly to `RESTDataSource`, we can define a `willSendRequest` method that adds an authorization header to all requests. But in our data fetching methods, instead of `this.get('path')`, we use `this.query(QUERY_DOCUMENT)`.
  - Use `graphql-request` in our resolvers to fetch data from the data source (similar to our [`githubStars`](../building/subscriptions.md#githubstars) subscription where we fetch data from GitHub’s GraphQL API). While `graphql-request` is nice for extremely simple uses like `githubStars`, usually `GraphQLDataSource` is a better choice, as it’s a data source class.

