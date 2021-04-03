---
title: Unions
---

# Unions

A [union](http://spec.graphql.org/draft/#sec-Unions) type is defined as a list of object types:

```gql
union SearchResult = User | Post

type User {
  name: String
  profilePic: Url
}

type Post {
  text: String
  upvotes: Int
}
```

When a field is typed as a union, its value can be any of the objects listed in the union definition. So the below `search` query returns a list of `User` and `Post` objects.

```gql
type Query {
  search(term: String): SearchResult
}
```

```gql
query {
  search(term: "John") {
    ... on User {
      name
    }
    ... on Post {
      text
    }
  }
}
```

Since unions don’t guarantee any fields in common, any field we select has to be inside a fragment (which have a specific object type).

