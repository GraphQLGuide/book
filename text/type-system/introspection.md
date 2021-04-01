# Introspection

GraphQL servers support [introspection](http://spec.graphql.org/draft/#sec-Introspection)—the ability to query for information about the server’s schema. There are three introspection entry fields:

- `__schema: __Schema!`
- `__type(name: String!): __Type`
- `__typename: String`

The first two are root query fields, and `__typename` is an implicit field on all objects, interfaces, and unions. We can use `__typename` in the search query from the [Interfaces section](interfaces.md):

```gql
query {
  search(term: "John") {
    __typename
    ... on User {
      name
    }
    ... on Post {
      text
    }
  }
}
```

And the response will include the name of the result object’s type:

```json
{
  "data": {
    "search": {
      "__typename": "Post",
      "text": "John Resig joins Khan Academy to provide free education to everyone."
    }
  }
}
```

With the introspection root query fields we can either get information about a single type (like the below query) or all types (via `query { __schema { types { ... } } }`).

```gql
query {
  __type(name: "User") {
    name
    fields {
      name
      type {
        name
      }
    }
  }
}
```

```json
{
  "__type": {
    "name": "User",
    "fields": [
      {
        "name": "id",
        "type": { "name": "ID" }
      },
      {
        "name": "name",
        "type": { "name": "String" }
      }
    ]
  }
}
```

As we can see, the response shows all the information in the schema about a `User`:

```gql
type User {
  id: ID
  email: String
}
```

Here is the full [introspection schema](http://spec.graphql.org/draft/#sec-Schema-Introspection):

```gql
extend type Query {
  __schema: __Schema!
  __type(name: String!): __Type  
}

type __Schema {
  description: String
  types: [__Type!]!
  queryType: __Type!
  mutationType: __Type
  subscriptionType: __Type
  directives: [__Directive!]!
}

type __Type {
  kind: __TypeKind!
  name: String
  description: String

  # should be non-null for OBJECT and INTERFACE only, must be null for the others
  fields(includeDeprecated: Boolean = false): [__Field!]

  # should be non-null for OBJECT and INTERFACE only, must be null for the others
  interfaces: [__Type!]

  # should be non-null for INTERFACE and UNION only, always null for the others
  possibleTypes: [__Type!]

  # should be non-null for ENUM only, must be null for the others
  enumValues(includeDeprecated: Boolean = false): [__EnumValue!]

  # should be non-null for INPUT_OBJECT only, must be null for the others
  inputFields: [__InputValue!]

  # should be non-null for NON_NULL and LIST only, must be null for the others
  ofType: __Type
}

type __Field {
  name: String!
  description: String
  args: [__InputValue!]!
  type: __Type!
  isDeprecated: Boolean!
  deprecationReason: String
}

type __InputValue {
  name: String!
  description: String
  type: __Type!
  defaultValue: String
}

type __EnumValue {
  name: String!
  description: String
  isDeprecated: Boolean!
  deprecationReason: String
}

enum __TypeKind {
  SCALAR
  OBJECT
  INTERFACE
  UNION
  ENUM
  INPUT_OBJECT
  LIST
  NON_NULL
}

type __Directive {
  name: String!
  description: String
  locations: [__DirectiveLocation!]!
  args: [__InputValue!]!
  isRepeatable: Boolean!
}

enum __DirectiveLocation {
  QUERY
  MUTATION
  SUBSCRIPTION
  FIELD
  FRAGMENT_DEFINITION
  FRAGMENT_SPREAD
  INLINE_FRAGMENT
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
}
```
