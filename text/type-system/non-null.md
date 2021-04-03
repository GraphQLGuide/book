---
title: Non-null
---

# Non-null

[Non-null](http://graphql.org/learn/schema/#lists-and-non-null) is a *wrapper type*. It wraps any other type and signifies that type can’t be null.

```gql
type User {
  name: String!
}
```

If we select `User.name` in a query:

```gql
query {
  user(id: "abc") {
    name
  }
}
```

then we will never get this response:

```json
{
  "data": {
    "user": {
      "name": null
    }
  }
}
```

These two responses are valid:

```json
{
  "data": {
    "user": {
      "name": "Loren"
    }
  }
}
```

```json
{
  "data": {
    "user": null
  }
}
```

When there are multiple levels of non-null, the null propagates upward. We’ll see an example of this in [Chapter 4: Errors](../validation-and-execution/#errors).

