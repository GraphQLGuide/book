---
title: Types
description: A list of the eight built-in types in GraphQL
---

# Types

There are six *named types* and two *wrapping types*. The named types are:

* [Scalar](scalars.md)
* [Enum](enums.md)
* [Object](objects.md)
* [Input object](field-arguments.md#input-objects)
* [Interface](interfaces.md)
* [Union](unions.md)

If you think of a GraphQL query as a tree, starting at the root field and branching out, the leaves are either scalars or enums. They’re the fields without selection sets of their own.

The two wrapping types are:

- [List](lists.md)
- [Non-null](non-null.md)

When the named types appear by themselves, they are singular and nullable—i.e., when the client requests a field, the server will return either one item or `null`. Using a wrapping type changes this default behavior.

