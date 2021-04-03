---
title: Variables
---

# Variables

We often don’t know argument values until our code is being run—for instance, we won’t always want to query for user #1. The user ID we want will depend on which profile page we’re displaying. While we could edit the document at runtime (like `{ user(id: ' + currentPageUserId + ') { name }}'`), we recommend instead using static strings and [*variables*](http://spec.graphql.org/draft/#sec-Language.Variables). Variables are declared in the document, and their values are provided separately, like this:

```gql
query UserName($id: Int!) { 
  user(id: $id) {
    name
  }
}
```

```json
{
  "id": 2
}
```

After the operation name, we declare `($id: Int!)`: the name of the variable with a `$` and the type of the variable. `Int` is an integer and `!` means non-null (required). Then, we use the variable name `$id` in an argument in place of the value: `user(id: 2) => user(id: $id)`. Finally, we send a JSON object with variable values along with the query document.

We can also give variables default values, for instance:

```gql
query UserName($id: Int = 1) { 
  user(id: $id) {
    name
  }
}
```

If `$id` isn’t provided, `1` will be used.

