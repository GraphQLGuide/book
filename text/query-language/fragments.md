---
title: Fragments
---

# Fragments

- [Named fragments](#named-fragments)
  - [Type conditions](#type-conditions)
- [Inline fragments](#inline-fragments)

## Named fragments

[*Fragments*](http://spec.graphql.org/draft/#sec-Language.Fragments) group together fields for reuse. Instead of this:

```gql
{
  user(id: 1) {
    friends {
      id
      name
      profilePic
    }
    mutualFriends {
      id
      name
      profilePic
    }
  }
}
```

we can combine fields with a fragment that we name `userFields`:

```gql
query {
  user(id: 1) {
    friends {
      ...userFields
    }
    mutualFriends {
      ...userFields
    }
  }
}

fragment userFields on User {
  id
  name
  profilePic
}
```

### Type conditions

Fragments are defined on a type. The type can be an [object](../type-system/objects.md), [interface](../type-system/interfaces.md), or [union](../type-system/unions.md). When we’re selecting fields from an interface or union, we can conditionally select certain fields based on which object type the result winds up being. We do this with fragments. For instance, if the `user` field had type `User`, and `User` was an interface implemented by `ActiveUser` and `SuspendedUser`, then our query could be:

```gql
query {
  user(id: 1) {
    id
    name
    ...activeFields
    ...suspendedFields
  }
}

fragment activeFields on ActiveUser {
  profilePic
  isOnline
}

fragment suspendedFields on SuspendedUser {
  suspensionReason
  reactivateOn
}
```

Then, the server will use the fragment that fits the type returned. If an `ActiveUser` object is returned for user 1, the client will receive the `profilePic` and `isOnline` fields. 

## Inline fragments

[Inline fragments](http://spec.graphql.org/draft/#sec-Inline-Fragments) don’t have a name and are defined *inline*—inside the selection set, like this:

```gql
query {
  user(id: 1) {
    id
    name
    ... on ActiveUser {
      profilePic
      isOnline
    }
    ... on SuspendedUser {
      suspensionReason
      reactivateOn
    }
  }
}
```


