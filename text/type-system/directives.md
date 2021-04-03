---
title: Directives
description: Schema directives define the directives that can be used in query documents
---

# Directives

We talked about the query side of [directives](http://spec.graphql.org/draft/#sec-Type-System.Directives) in [Chapter 2: Directives](../query-language/#directives). Directives are declared in the schema. A directive definition includes its name, any arguments, on what types of locations it can be used, and whether it’s repeatable (used multiple times on the same location):

```gql
directive @authoredBy(name: String!) repeatable on OBJECT

type Book @authoredBy(name: "pageCount") @authoredBy(name: "author") {
  id: ID!
}
```

The locations can either be in [executable documents](../query-language/#document) or [schema documents](../query-language/#document).

```gql
# Executable locations
QUERY
MUTATION
SUBSCRIPTION
FIELD
FRAGMENT_DEFINITION
FRAGMENT_SPREAD
INLINE_FRAGMENT
VARIABLE_DEFINITION

# Schema locations
SCHEMA
SCALAR
OBJECT
FIELD_DEFINITION
ARGUMENT_DEFINITION
INTERFACE
UNION
ENUM
ENUM_VALUE
INPUT_OBJECT
INPUT_FIELD_DEFINITION
```

Directives can work on multiple locations, like `@deprecated`:

```
directive @deprecated(
  reason: String = "No longer supported"
) on FIELD_DEFINITION | ENUM_VALUE

type Direction {
  NORTHWEST @deprecated
  NORTH
  EAST
  SOUTH
  WEST
}

type User {
  id: Int!
  name: String
  fullName: String @deprecated("Use `name` instead")
}
```

