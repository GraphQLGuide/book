---
title: Operations
---

# Operations

GraphQL is a specification for communicating with the server. We communicate with it—asking for data and telling it to do things—by sending [*operations*](http://spec.graphql.org/draft/#sec-Language.Operations). There are three types of operations:

- `query` fetches data
- [`mutation`](mutations.md) changes and fetches data
- [`subscription`](subscriptions.md) tells the server to send data whenever a certain event occurs

Operations can have names, like `AllTheStars` in this query operation:

```
query AllTheStars {
  githubStars
}
```
