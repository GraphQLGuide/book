---
title: Scalars
---

# Scalars

[Scalars](http://graphql.org/learn/schema/#scalar-types) are primitive values. There are five included scalar types:

- `Int`: Signed 32-bit non-fractional number. Maximum value around 2 billion (2,147,483,647).
- `Float`: Signed [double-precision](https://en.wikipedia.org/wiki/Double-precision_floating-point_format) (64-bit) fractional value.
- `String`: Sequence of [UTF-8](https://en.wikipedia.org/wiki/UTF-8) (8-bit Unicode) characters.
- `Boolean`: `true` or `false`.
- `ID`: Unique identifier, serialized as a string.

We can also define our own scalars, like `Url` and `DateTime`. In the description of our custom scalars, we write how they’re serialized so the frontend developer knows what value to provide for arguments. For instance, `DateTime` could be serialized as an integer (milliseconds since [Epoch](https://en.wikipedia.org/wiki/Epoch_(computing))) or as an ISO string:

```gql
# schema
type Mutation {
  dayOfTheWeek(when: DateTime): String
}
```

```gql
# if DateTime is serialized as an integer
mutation {
  dayOfTheWeek(when: 1591028749941)
}

# if DateTime is serialized as an ISO string
mutation {
  dayOfTheWeek(when: "2020-06-01T16:25:49.941Z")
}
```

The benefits to using custom scalars are clarity (`when: DateTime` is clearer than `when: Int`) and consistent validation (whatever value we pass is checked to make sure it’s a valid DateTime).

We define our [own custom scalar](../server/#custom-scalars) in Chapter 11.
