---
title: Mutations
---

# Mutations

[Mutations](http://spec.graphql.org/draft/#sec-Mutation), unlike queries, have side effects—i.e., alter data. The REST equivalent of a query is a GET request, whereas the equivalent of a mutation is a POST, PUT, DELETE, or PATCH. Often, when the client sends a mutation, it selects the data that will be altered so that it can update the client-side state.

```gql
mutation {
  upvotePost(id: 1) {
    id
    upvotes
  }
}
```

In this example, the `upvotes` field will change, so the client *selects* it (i.e., includes it in the selection set).

While not enforced by the specification, the intention and convention is that only root mutation fields like `upvotePost` alter data—not subfields like `id` or `upvotes`, and not Query or Subscription fields.

We can include multiple root fields in a mutation, but they are executed in series, not in parallel. (All fields in a mutation below the top level and all query fields are executed in parallel.) This way, assuming the code resolving the first root mutation field waits for all of the side effects to complete before returning, we can trust that the second root mutation field is operating on the altered data. If the client *wants* the root fields to be executed in parallel, they can be sent in separate operations.

While technically “mutation” is an operation type, the root mutation fields are often called “mutations.”

