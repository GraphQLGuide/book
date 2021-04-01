# Field arguments

Any field can accept a named, unordered list of [arguments]. Arguments can be scalars, enums, or *input objects*. An argument can be non-null to indicate it is required. Optional arguments can have a default value, like `name` below.

```gql
type User {
  # no arguments
  name

  # an optional scalar argument with a default value
  profilePic(width: Int = 100): Url
}

type Mutation {
  # a non-null enum argument
  pokemonGo(direction: Direction!): Boolean

  # three non-null scalar arguments
  createPost(authorId: ID!, title: String!, body: String!): Post
}
```

## Input objects

[Input objects](http://spec.graphql.org/draft/#sec-Input-Objects) are objects that are only used as arguments. An input object is often the sole argument to mutations (see [Chapter 11: Schema design > Mutations > Arguments](../server/#arguments)). 

An input object is a list of input fields—scalars, enums, and other input objects.

```gql
type Mutation {
  createPost(input: CreatePostInput!): Post
}

input CreatePostInput {
  authorId: ID!
  title: String = "Untitled"
  body: String!
}
```

Note that:

- Input object fields can have default values.
- The declaration keyword is `input`, not the `type` keyword that is used for output objects.

