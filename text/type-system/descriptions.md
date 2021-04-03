---
title: Descriptions
---

# Descriptions

We can add a [description](http://spec.graphql.org/draft/#sec-Descriptions) before any definition in our schema using `#`, `"`, or `"""`. Descriptions are included in [introspection](introspection.md) and displayed by tools like GraphiQL.

```gql
type Query {
  # have the server say hello to whomever you want!
  hello(
    "person to say hello to"
    name: String!
  ): String
}

"""
multiline comment
describing 
the User type
"""
type User {
  id: Int
  email: String
}
```
