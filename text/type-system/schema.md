---
title: Schema
---

# Schema

The [schema](http://spec.graphql.org/draft/#sec-Schema) defines the capabilities of a GraphQL server. It defines the possible queries, mutations, subscriptions, and additional types and directives. While the schema can be written in a programming language, it is often written in SDL (the GraphQL Schema Definition Language). Here is the most basic schema, written in SDL:

```gql
schema {
  query: Query
}

type Query {
  hello: String
}
```

It has a single root query field, `hello`, of type String (when we send a `hello` query, the server will return a string value). We can omit the `schema` declaration when we use operation types named `Query`, `Mutation`, and `Subscription`, so the above is equivalent to:

```gql
type Query {
  hello: String
}
```

With this schema, the client can make the below query:

```gql
query {
  hello
}
```

and receive this response:

```json
{
  "data": {
    "hello": "world!"
  }
}
```

The root fields—those listed under `type Query { ... }`, `type Mutation { ... }`, and `type Subscription { ... }`—are the entry points to our schema. They’re the fields that can be selected by the client at the root level of an operation.

