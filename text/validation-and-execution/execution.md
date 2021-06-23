---
title: Execution
---

# Execution

Execution is the process by which a GraphQL server generates a response to a request. As with validation, [the spec](http://spec.graphql.org/draft/#sec-Execution) provides an algorithm for each part, and these algorithms are coded into GraphQL server libraries.

The server matches the request fields against fields in the schema and calls [resolvers](#resolvers) to generate the response data, which it then puts in the [response format](#response-format). While executing, any errors that occur [are collected](#errors) and included in the response.

* [Resolvers](#resolvers)
* [Response format](#response-format)
* [Errors](#errors)

## Resolvers

Backend developers write functions called *resolvers* for each field on each object and provide them to the server library, which contains the execution engine. During execution, the library calls the functions, providing four arguments: `object, arguments, context, info`. Let’s look at this query and the resolvers that get called during its execution:

```gql
query {
  user(id: "abc") {
    id
    hasLongName
  }
}
```

```js
const resolvers = {
  Query: {
    user(object, arguments, context, info) {
      return context.dataSources.users.findOneById(arguments.id)
    }
  },
  User: {
    id(object, arguments, context, info) {
      return object.id
    },
    hasLongName(object, arguments, context, info) {
      return object.name.length > 40
    }
  }
}
```

The server sees a root query field `user` and knows to call the `Query.user` resolver. It provides the four arguments:

- `object`: Not used for root fields. In general, it has the object returned by the parent resolver. For instance, when calling the `User.id` resolver, `object` will be the user object returned from `Query.user`.
- `arguments`: An object containing the current field’s arguments, if any. For `Query.user`, that’s `{ id: "abc" }`.
- `context`: An object set by the developer that is the same across all resolver calls in a single request. It can contain request information like the user (e.g., `context.currentUser`), as well as global things like data fetching classes (e.g., `context.dataSources`).
- `info`: An object with information about the current query and schema. It follows the below format.

```sh
type GraphQLResolveInfo = {
  fieldName: string,
  fieldNodes: Array<Field>,
  returnType: GraphQLOutputType,
  parentType: GraphQLCompositeType,
  schema: GraphQLSchema,
  fragments: { [fragmentName: string]: FragmentDefinition },
  rootValue: any,
  operation: OperationDefinition,
  variableValues: { [variableName: string]: any },
}
```

When the `Query.user` resolver returns an object, the execution engine provides that object as the first argument to the next set of resolvers—in this case, it knows that `Query.user` resolves to a `User`, and since `id` and `hasLongName` are selected, it calls resolvers `User.id` and `User.hasLongName`.

Our `User.id` resolver is simple—it just returns `object.id`. This type of resolver is often not needed, as most server libraries will automatically use `object.fieldName` when no resolver exists.

`User.id` and `User.hasLongName` are called at the same time, in parallel. After both have returned a value, the server can put together the response. 

Resolvers are normally called in parallel, but as we saw in [Chapter 2](../query-language/mutations.md), they’re called in series when there are multiple root fields in a mutation. Not only are the root resolvers called in series, but each root field’s selected subfields [are resolved](http://spec.graphql.org/draft/#sec-Normal-and-Serial-Execution) before the next root field is resolved.

## Response format

A GraphQL response is a map, and it’s usually serialized as JSON. It usually has a `data` key with an object containing the data returned from resolvers, but if the request failed prior to execution, `data` will not be present. 

If any errors occur before or during execution, the response will have an `errors` key with an array of objects representing each error.

Responses may also have an `extensions` object, which can be used by servers implementing features beyond the GraphQL spec.

```json
{
  "data": {
    ...
  },
  "errors": [
    {
      "message": ...,
    }
  ],
  "extensions": {
    ...
  }
}
```

## Errors

In the above example response, the error only has a single key, `message`. Often, there are more keys. The `locations` key points at the first character of the place in the document the error occurred:

> If an error can be associated to a particular point in the requested GraphQL document, it should contain an entry with the key `locations` and a list of locations, where each location is a map with the keys line and column, both positive numbers starting from 1 that describe the beginning of an associated syntax element.

The `path` key has the path to the field where the error occurred:

> If an error can be associated with a particular field in the GraphQL result, it must contain an entry with the key `path` that details the path of the response field which experienced the error. This allows clients to identify whether a null result is intentional or caused by a runtime error.

The `extensions` key is for adding fields beyond those in the spec. A common added field is `code`. That and `timestamp` are included in the below example:

```gql
{
  hero(episode: $episode) {
    name
    friends {
      id
      name
    }
  }
}
```

```json
{
  "errors": [
    {
      "message": "Name for character with ID 1002 could not be fetched.",
      "locations": [ { "line": 6, "column": 7 } ],
      "path": [ "hero", "friends", 1, "name" ],
      "extensions": {
        "code": "CAN_NOT_FETCH_BY_ID",
        "timestamp": "Fri Feb 9 14:33:09 UTC 2018"
      }      
    }
  ],
  "data": {
    "hero": {
      "name": "R2-D2",
      "friends": [
        {
          "id": "1000",
          "name": "Luke Skywalker"
        },
        {
          "id": "1002",
          "name": null
        },
        {
          "id": "1003",
          "name": "Leia Organa"
        }
      ]
    }
  }
}
```

The error location is `{ "line": 6, "column": 7 }` because the `name` field is on the 6th line of the operation, and the `n` is the 7th character on that line.

The path is `[ "hero", "friends", 1, "name" ]` because the error `name` field is in the second object in the array (it is zero-indexed, so the second object is object number 1) value of the `friends` attribute, which is a field on `hero`.

Let’s say `hero` resolves to a `Hero` object, and `Hero.friends` resolves to a list of `Hero` objects. In the above example, `Hero.name` is nullable, so when the error occurs during the resolution of `hero.friends.1.name`, the server returns null for the value. However, if `Hero.name` were non-null, then the server wouldn’t be able to return `"name": null`. Instead, it would have to return null for the `Hero`, like this:

```json
  "data": {
    "hero": {
      "name": "R2-D2",
      "friends": [
        {
          "id": "1000",
          "name": "Luke Skywalker"
        },
        null,
        {
          "id": "1003",
          "name": "Leia Organa"
        }
      ]
    }
  }
```

If `Hero.friends` resolved to `[Hero!]`, then the server couldn’t return null for the second friend, and would have to instead return null for the whole field:

```json
  "data": {
    "hero": {
      "name": "R2-D2",
      "friends": null
    }
  }
```

And if the list were also non-null (`[Hero!]!`), then the server would have to return null for the whole `Hero`:

```json
  "data": {
    "hero": null
    }
  }
```

And if `hero` was non-null:

```gql
type Query {
  hero: Hero!
}
```

Then the server would return null for the whole query, even if other root fields were selected:

```gql
query {
  hero(episode: $episode) {
    name
    friends {
      id
      name
    }
  }
  bestHero {
    name
  }
}
```

```json
  "data": null
```

The client doesn’t get `bestHero`, even if it resolved without error, because `hero` can’t be null. If we want to avoid the possibility of this happening, we can make sure each root Query and Mutation field is nullable.