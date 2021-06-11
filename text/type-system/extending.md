---
title: Extending
description: A type that has been previously defined can be extended
---

# Extending

All named types can be [extended](http://spec.graphql.org/draft/#sec-Type-System-Extensions) in some way. We might extend types when we’re defining our schema across multiple files, or if we’re modifying a schema defined by someone else. Here are a couple examples: 

```gql
type Query { 
  messages: [String]
}

type Direction {
  NORTH
  EAST
  SOUTH
  WEST
}
```

```gql
extend type Query {
  lastMessage: String
}

extend enum Direction {
  SOUTHEAST
  SOUTHWEST
  NORTHEAST
  NORTHWEST
}
```

First we add a root query field, and then we add four more possible values for the `Direction` enum.

