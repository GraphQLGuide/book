---
title: Objects
---

# Objects

An [object](http://graphql.org/learn/schema/#object-types-and-fields) is a list of fields, each of which have a name and a type. The below schema defines two object types, `Post` and `User`:

```gql
type Post {
  id: ID
  text: String
  author: User
}

type User {
  id: ID
  name: String
}
```

A field’s type can be anything but an input object. In the `Post` type, the `id` and `text` fields are scalars, while `author` is an object type. 

When selecting a field that has an object type, at least one of that object’s fields must be selected. For instance, in the below schema, `post` field is of type `Post`:

```gql
type Query {
  post(id: ID): Post
}
```

Since `Post` is an object type, at least one `Post` field must be selected in query A below—in this case, `text`. And in query B, `post.author` is of type `User`, so at least one `User` field must be selected.

```gql
query A {
  post(id: "abc") {
    text
  }
}

query B {
  post(id: "abc") {
    author {
      name
    }
  }
}
```

In other words, we have to keep adding selection sets until we only have leaves (scalars and enums) left. Objects are the branches on the way to the leaves.

