# Enums
 
When a scalar field has a small set of possible values, it’s best to use an [enum](http://graphql.org/learn/schema/#enumeration-types) instead. The enum type declaration lists all the options:

```gql
enum Direction {
  NORTH
  EAST
  SOUTH
  WEST
}
```

Enums are usually serialized as strings (for example, `"NORTH"`). Here’s an example Query type, query operation, and response:

```gql
type Query {
  currentHeading(flightId: ID): Direction
}
```

```gql
query {
  currentHeading(flightId: "abc")
}
```

```json
{
  "data": {
    "currentHeading": "NORTH"
  }
}
```

