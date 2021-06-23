---
title: Validation
---

# Validation

GraphQL servers [validate](http://spec.graphql.org/draft/#sec-Validation) requests against the schema. They usually validate all requests before the [execution step](execution.md); however, the server can skip validation if:

- it recognizes that an identical request has been previously validated, or
- the requests were validated during development.

One example of a validation error is selecting a field that doesn't exist. If we send this query:

```gql
query {
  user(id: "abc") {
    nonExistent
  }
}
```

the server’s validation step will fail, so it won’t execute the query. Instead, it will respond with:

```json
{
  "errors": [
    {
      "message": "Cannot query field \"nonExistent\" on type \"User\".",
      "locations": [
        {
          "line": 3,
          "column": 5
        }
      ]
    }
  ]
}
```

There are many possible ways in which a request might not be valid. Frontend developers will run into them while developing their queries, and most servers will return a clear, specific error message like the above. Most backend developers use a GraphQL server library that takes care of validation for them, but for those creating their own server library, the spec has algorithms for checking each piece of validation:

- [5.1: Documents](http://spec.graphql.org/draft/#sec-Documents)
- [5.2: Operations](http://spec.graphql.org/draft/#sec-Validation.Operations)
- [5.3: Fields](http://spec.graphql.org/draft/#sec-Validation.Fields)
- [5.4: Arguments](http://spec.graphql.org/draft/#sec-Validation.Arguments)
- [5.5: Fragments](http://spec.graphql.org/draft/#sec-Validation.Fragments)
- [5.6: Values](http://spec.graphql.org/draft/#sec-Values)
- [5.7: Directives](http://spec.graphql.org/draft/#sec-Validation.Directives)
- [5.8: Variables](http://spec.graphql.org/draft/#sec-Validation.Variables)

