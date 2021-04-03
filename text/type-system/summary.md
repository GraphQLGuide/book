---
title: Summary
description: Summary of the Type System chapter
---

# Summary

To recap the GraphQL type system, the [schema](schema.md) defines the capabilities of a GraphQL server. It is made up of [type](types.md) and [directive](directives.md) definitions, which consist of values or fields and their types and [arguments](field-arguments.md). Types, fields, arguments, and enum values can all have [descriptions](descriptions.md)—strings provided to introspection queries. 

There are six named types:

* [Scalars](scalars.md) are primitive values.
* [Enums](enums.md) have a defined set of possible values.
* [Objects](objects.md) have a list of fields.
* [Input objects](field-arguments.md#input-objects) are objects that can be used as arguments.
* [Interfaces](interfaces.md) have a list of fields that all implementing objects must include.
* [Unions](unions.md) are a list of object types.

And there are two wrapping types:

- [Lists](lists.md) denote ordered lists.
- [Non-null](non-null.md) denote types that can’t resolve to null.

[Schema directives](directives.md) define directives that can be used in query documents. Types can be [extended](extending.md) after they’re defined. And GraphQL servers can have [introspection](introspection.md) turned on, which enables two specific root Query fields that return information about the schema.
