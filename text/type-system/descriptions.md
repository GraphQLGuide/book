---
title: Descriptions
---

# Descriptions

We can add a [description](http://spec.graphql.org/draft/#sec-Descriptions) before any definition in our schema using `"` or `"""`. Descriptions are included in [introspection](introspection.md) and displayed by tools like GraphiQL. Some libraries (like [`graphql-tools`](https://www.graphql-tools.com/)) also treat comments-lines that start with `#`-as descriptions, even though according to the spec they’re supposed to be ignored.

```gql
type Query {
  "have the server say hello to whomever you want!"
  hello(
    "person to say hello to"
    name: String!
  ): String
}

"""
multiline description
of the User type
"""
type User {
  id: Int
  email: String
}
```
