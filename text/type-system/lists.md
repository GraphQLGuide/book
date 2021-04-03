---
title: Lists
description: A List is a wrapper type that denotes an ordered list
---

# Lists

[List](http://spec.graphql.org/draft/#sec-Type-System.List) is a *wrapper type*. It wraps another type and signifies an ordered list in which each item is of the wrapped type.

```gql
type User {
  names: [String]
}
```

The `User.names` field could be any of these values:

```json
null
[]
[null]
["Loren"]
["Loren", null, "L", "Lolo"]
```

We can also nest lists, like `Spreadsheet.cells`:

```gql
type Spreadsheet {
  columns: [String]
  rows: [String]
  cells: [[Int]]
}
```

For example:

```json
{
  "columns": ["Revenue", "Expenses"],
  "rows": ["Jan", "Feb", "March"],
  "cells": [[100, 110], [200, 100], [300, 50]]
}
```

