---
title: Custom schema directives
description: How to create your own GraphQL directives
---

## Custom schema directives

Background: [Directives](../query-language/#directives)

> If you’re jumping in here, `git checkout 25_0.1.0` (tag [25_0.1.0](https://github.com/GraphQLGuide/guide-api/tree/25_0.1.0), or compare [25...directives](https://github.com/GraphQLGuide/guide-api/compare/25_0.1.0...directives_0.1.0))

Apollo Server includes the [default directives](../query-language/#directives) `@deprecated`, `@skip`, and  `@include`. `@skip` and `@include` are *query directives*, so they don’t appear in our schema; instead, they’re included in query documents and can be used on any field. `@deprecated` is a *schema directive*, and when we add it after a field or enum value in our schema, the directive will be included in responses to introspection queries. 

We can make our own schema directives in Apollo Server. When we add them to specific places in our schema, those parts of the schema are modified or evaluated differently when resolving requests. Three examples we’ll code are `@tshirt`, which modifies an enum value’s description; `@upper`, which takes the result of a field resolver and returns the uppercase version instead; and `@auth`, which throws an error if the user isn’t authorized to view that object or field.

- [@tshirt](#@tshirt)
- [@upper](#@upper)
- [@auth](#@auth)

### @tshirt

Schema directives are implemented by subclassing `SchemaDirectiveVisitor` and overriding one or more methods of the format `visitFoo()`, where `Foo` is the part of the schema to which the directive is applied. Possible parts of the schema are:

- Whole schema
- Scalar
- Object
- Field definition
- Argument definition
- Interface
- Union
- Enum
- Enum value
- Input object
- Input field definition

For example, if it were applied to an enum value:

[`src/schema/schema.graphql`](https://github.com/GraphQLGuide/guide-api/compare/25_0.2.0...directives_0.2.0)

```gql
directive @tshirt on ENUM_VALUE

enum Package {
  BASIC
  PRO 
  FULL @tshirt
  TRAINING @tshirt

  # Group license.
  TEAM @tshirt
}
```

Then our subclass would override `visitEnumValue()`:

[`src/directives/TshirtDirective.js`](https://github.com/GraphQLGuide/guide-api/blob/directives_0.2.0/src/directives/TshirtDirective.js)

```js
import { SchemaDirectiveVisitor } from 'apollo-server'

class TshirtDirective extends SchemaDirectiveVisitor {
  visitEnumValue(value) {
    ...
    return value
  }
}
```

To determine the structure of `value`, we can either use `console.log()` or look up the type definition of an enum value in the `graphql-js` library. All type definitions are in [`src/type/definition.js`](https://github.com/graphql/graphql-js/blob/688f93c9153c1b69d522c130200373e75d0cfc7e/src/type/definition.js#L1419-L1427), where we can find:

```js
export type GraphQLEnumValue /* <T> */ = {|
  name: string,
  description: ?string,
  value: any /* T */,
  isDeprecated: boolean,
  deprecationReason: ?string,
  extensions: ?ReadOnlyObjMap<mixed>,
  astNode: ?EnumValueDefinitionNode,
|};
```

> `isDeprecated` and `deprecationReason` are the fields that are used by the `@deprecated` directive.

It has an optional `description` field, to which we can add a note about T-shirts 😄:

[`src/directives/TshirtDirective.js`](https://github.com/GraphQLGuide/guide-api/blob/directives_0.2.0/src/directives/TshirtDirective.js)

```js
import { SchemaDirectiveVisitor } from 'apollo-server'

export default class TshirtDirective extends SchemaDirectiveVisitor {
  visitEnumValue(value) {
    value.description += ' Includes a T-shirt.'
    return value
  }
}
```

Then we need to get it to `ApolloServer()`:

[`src/directives/index.js`](https://github.com/GraphQLGuide/guide-api/blob/directives_0.2.0/src/directives/index.js)

```js
import TshirtDirective from './TshirtDirective'

export default {
  tshirt: TshirtDirective
}
```

[`src/index.js`](https://github.com/GraphQLGuide/guide-api/compare/25_0.2.0...directives_0.2.0)

```js
import schemaDirectives from './directives'

const server = new ApolloServer({
  typeDefs,
  schemaDirectives,
  resolvers,
  dataSources,
  context,
  formatError
})
```

Now we can check the description by using the search box inside Playground’s docs tab:

![Package enum with “Includes a T-shirt” descriptions](../img/tshirt-directive.png)

### @upper

When we’re making a directive to use on fields, oftentimes what we want to do is call the resolver and modify the result, like this:

```js
import { SchemaDirectiveVisitor } from 'apollo-server'
import { defaultFieldResolver } from 'graphql'

class MyDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const { resolve = defaultFieldResolver } = field
    field.resolve = async function(...args) {
      const result = await resolve.apply(null, args)
      // modify result
      // ...
      return result
    }
  }
}
```

Here we override the `visitFieldDefinition()` function, which receives a `field` object that [has a `resolve` property](https://github.com/graphql/graphql-js/blob/688f93c9153c1b69d522c130200373e75d0cfc7e/src/type/definition.js#L959-L974):

```js
export type GraphQLField<
  TSource,
  TContext,
  TArgs = { [argument: string]: any, ... },
> = {|
  name: string,
  description: ?string,
  type: GraphQLOutputType,
  args: Array<GraphQLArgument>,
  resolve?: GraphQLFieldResolver<TSource, TContext, TArgs>,
  subscribe?: GraphQLFieldResolver<TSource, TContext, TArgs>,
  isDeprecated: boolean,
  deprecationReason: ?string,
  extensions: ?ReadOnlyObjMap<mixed>,
  astNode: ?FieldDefinitionNode,
|};
```

We redefine `field.resolve`, calling the original resolve or the `defaultFieldResolver`, which resolves the field as a property on the parent object when there is no resolver function (e.g., `User: { firstName: (user, _, context) => user.firstName }`). Then we modify and return the result. 

Let’s use this format to implement an `@upper` resolver, which transforms the result to uppercase:

[`src/schema/schema.graphql`](https://github.com/GraphQLGuide/guide-api/compare/25_0.2.0...directives_0.2.0)

```gql
directive @upper on FIELD_DEFINITION

type Query {
  hello(date: Date): String! @upper
  isoString(date: Date!): String!
}
```

And now, since we can’t convert an emoji to uppercase, we need `Query.hello` to return lowercase ASCII:

[`src/resolvers/index.js`](https://github.com/GraphQLGuide/guide-api/compare/25_0.2.0...directives_0.2.0)

```js
const resolvers = {
  Query: {
    hello: () => 'world ',
    ...
  }
}
```

As above, we redefine the field’s `resolve` function, calling the original. This time we check if the result is a string and call `.toUpperCase()`:

[`src/directives/UppercaseDirective.js`](https://github.com/GraphQLGuide/guide-api/blob/directives_0.2.0/src/directives/UppercaseDirective.js)

```js
import { SchemaDirectiveVisitor } from 'apollo-server'
import { defaultFieldResolver } from 'graphql'

export default class UppercaseDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const { resolve = defaultFieldResolver } = field
    field.resolve = async function(...args) {
      const result = await resolve.apply(this, args)
      if (typeof result === 'string') {
        return result.toUpperCase()
      }
      return result
    }
  }
}
```

We include the directive class by adding it to this object, where the key corresponds with the directive name `@upper`:

[`src/directives/index.js`](https://github.com/GraphQLGuide/guide-api/blob/directives_0.2.0/src/directives/index.js)

```js
import TshirtDirective from './TshirtDirective'
import UppercaseDirective from './UppercaseDirective'

export default {
  tshirt: TshirtDirective,
  upper: UppercaseDirective
}
```

![hello query with “WORLD 🌍🌏🌎” result](../img/upper-directive.png)

### @auth

Directives can also take arguments, which can be scalars, enums, or input object types. `@deprecated`, for instance, takes a `reason` argument of type `String`:

```gql
type User {
  firstName
  first_name: String @deprecated(reason: "Use `firstName`.")
}
```

We’ll be implementing a directive that takes an enum argument:

[`src/schema/schema.graphql`](https://github.com/GraphQLGuide/guide-api/compare/25_0.2.0...directives_0.2.0)

```gql
directive @auth(
  requires: Role = ADMIN,
) on OBJECT | FIELD_DEFINITION

enum Role {
  USER
  MODERATOR
  ADMIN
}
```

Our `@auth` directive is for specifying which objects or fields (`on OBJECT | FIELD_DEFINITION`) require a `Role`. If the `requires` argument isn’t used, then the default `ADMIN` is used.

Our `AuthDirective` class is similar to `UppercaseDirective` in that we’re wrapping the `field.resolve()` function in a new function. However, instead of modifying the result, our wrapping function throws an error if the current user’s role doesn’t match the required role:

[`src/directives/AuthDirective.js`](https://github.com/GraphQLGuide/guide-api/blob/directives_0.2.0/src/directives/AuthDirective.js)

```js
import { SchemaDirectiveVisitor, ForbiddenError } from 'apollo-server'
import { defaultFieldResolver } from 'graphql'

export default class AuthDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const { resolve = defaultFieldResolver } = field
    field.resolve = (...resolverArgs) => {
      const requiredRole = this.args.requires
      const context = resolverArgs[2]

      if (!context.user.roles.includes(requiredRole)) {
        throw new ForbiddenError(`You don't have permission to view this data.`)
      }

      return resolve.apply(null, resolverArgs)
    }
  }
}
```

The directive’s arguments are available at `this.args.*`. `resolverArgs[2]`, the third argument passed to resolvers, is always the context where we put the user doc. We assume that the user’s roles are stored in the user doc as an array of strings (like `roles: ['USER']` or `roles: ['USER', 'ADMIN']`).

Since `@auth` works `on OBJECT | FIELD_DEFINITION`, we also need to implement the `visitObject()` method. It needs to go through each field in the object and wrap the `resolve()` function. We also need to mark if a field has been wrapped, so that we don’t double-wrap (if we use `@auth` on both the object and field `foo` in the object, `visitObject()` will wrap all fields, and then `visitFieldDefinition()` will wrap `foo`, which has already been wrapped).

```js
import { SchemaDirectiveVisitor } from 'apollo-server'
import { defaultFieldResolver } from 'graphql'

export default class AuthDirective extends SchemaDirectiveVisitor {
  visitObject(objectType) {
    objectType._requiredRole = this.args.requires

    const fields = objectType.getFields()
    Object.keys(fields).forEach(fieldName => {
      const field = fields[fieldName]
      this._wrapResolveFn(field, objectType)
    })

    objectType._wrappedResolveFn = true
  }

  visitFieldDefinition(field, { objectType }) {
    field._requiredRole = this.args.requires

    const alreadyWrapped = objectType._wrappedResolveFn
    if (!alreadyWrapped) {
      this._wrapResolveFn(field, objectType)
    }
  }

  _wrapResolveFn(field, objectType) {
    const { resolve = defaultFieldResolver } = field

    field.resolve = (...args) => {
      const requiredRole = field._requiredRole || objectType._requiredRole
      const context = args[2]

      if (!context.user.roles.includes(requiredRole)) {
        throw new Error('not authorized')
      }

      return resolve.apply(null, args)
    }
  }
}
```

We save the required role on the field and the object so that inside the wrapper, we can determine which to use (preferencing a role saved on the field over one saved on the object):

```js
const requiredRole = field._requiredRole || objectType._requiredRole
```

We use underscores for data we save (`._requiredRole` and `._wrappedResolveFn`) and for the method we define (`._wrapResolveFn()`) to indicate they’re private (not meant to be used / called by code outside this class).

Note that `visitFieldDefinition()` receives a second argument with that field’s object type. Here are [all the methods](https://github.com/apollographql/graphql-tools/blob/87f32f57f014715d6a311793e3929d39205e2578/src/schemaVisitor.ts#L91-L130) that have second arguments: 

- `visitFieldDefinition(field, { objectType })`
- `visitArgumentDefinition(argument, { field, objectType })`
- `visitEnumValue(value, { enumType })`
- `visitInputFieldDefinition(field, { objectType })`
- `visitSchema(schema, visitorSelector)` (see [explanation of `visitorSelector`](https://github.com/apollographql/graphql-tools/blob/87f32f57f014715d6a311793e3929d39205e2578/src/schemaVisitor.ts#L111-L130))

Finally, let’s add our new directive class to our server:

[`src/directives/index.js`](https://github.com/GraphQLGuide/guide-api/blob/directives_0.2.0/src/directives/index.js)

```js
import TshirtDirective from './TshirtDirective'
import UppercaseDirective from './UppercaseDirective'
import AuthDirective from './AuthDirective'

export default {
  tshirt: TshirtDirective,
  upper: UppercaseDirective,
  auth: AuthDirective
}
```

Now we can test out the directive:

[`src/schema/User.graphql`](https://github.com/GraphQLGuide/guide-api/compare/25_0.2.0...directives_0.2.0)

```gql
type User @auth(requires: USER) {
  id: ID!
  firstName: String!
  lastName: String!
  username: String!
  email: String @auth(requires: ADMIN)
  photo: String!
  createdAt: Date!
  updatedAt: Date!
}
```

Without a `roles` field on our user doc, we get an error and null data:

![user query with error response](../img/auth-directive-without-roles.png)

With `"roles": ["USER"]`, we get data and an error:

![user query with firstName and error for email](../img/auth-directive-user.png)

With `"roles": ["USER", "ADMIN"]`, we get all the data:

![user query with firstName and email in response](../img/auth-directive-admin.png)

