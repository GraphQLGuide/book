# Directives

[Directives](http://spec.graphql.org/draft/#sec-Language.Directives) can be added after various parts of a document to change how that part is [validated or executed](../validation-and-execution/index.md) by the server. They begin with an `@` symbol and can have arguments. There are three included directives, `@skip`, `@include`, and `@deprecated`, and servers can define custom directives (as we do in [Chapter 11: Custom schema directives](../server/#custom-schema-directives)).

* [@skip](#@skip)
* [@include](#@include)
* [@deprecated](#@deprecated)

## @skip

[`@skip(if: Boolean!)`](http://spec.graphql.org/draft/#sec--skip) is applied to a field or fragment spread. The server will omit the field/spread from the response when the `if` argument is true.

```gql
query UserDeets($id: Int!, $textOnly: Boolean!) {
  user(id: $id) {
    id
    name
    profilePic @skip(if: $textOnly)
  }
}
```

```json
{
  "id": 1,
  "textOnly": true
}
```

Sending the above document and variables would result in the below response:

```json
{
  "data":  {
    "user": {
      "id": 1,
      "name": "John Resig"
    }
  }
}
```

> While the spec doesn’t dictate using JSON to format responses, it is the most common format.

## @include

[`@include(if: Boolean!)`](http://spec.graphql.org/draft/#sec--include) is the opposite of `@skip`, only including the field/spread in the response when `if` argument is true.

```gql
query UserDeets($id: Int!, $adminMode: Boolean!) {
  user(id: $id) {
    id
    name
    email @include(if: $adminMode)
    groups @include(if: $adminMode)
  }
}
```

```json
{
  "id": 1,
  "adminMode": false
}
```

Sending the above document and variables would result in the below response:

```json
{
  "data":  {
    "user": {
      "id": 1,
      "name": "John Resig"
    }
  }
}
```

Sending the above document and variables would result in the below response:

```json
{
  "data":  {
    "user": {
      "id": 1,
      "name": "John Resig"
    }
  }
}
```

## @deprecated

Unlike `@skip` and `@include`, which are used in executable documents, [`@deprecated`](http://spec.graphql.org/draft/#sec--deprecated) is used in schema documents. It is placed after a field definition or enum value to communicate that the field/value is deprecated and why—it has an optional `reason` String argument that defaults to “No longer supported.”

```gql
type User {
  id: Int!
  name: String
  fullName: String @deprecated("Use `name` instead")
}
```

