# Arguments

On the server, a field is like a function that returns a value. Fields can have [*arguments*](http://spec.graphql.org/draft/#sec-Language.Arguments): named values that are provided to the field function and change how it behaves. In this example, the `user` field has an `id` argument, and `profilePic` has `width` and `height` arguments:

```gql
{
  user(id: 1) {
    name
    profilePic(width: 100, height: 50)
  }
}
```

Arguments can appear in any order.
