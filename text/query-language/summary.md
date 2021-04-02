# Summary

To recap the GraphQL query language, we can send one or more [operations](operations.md) in a GraphQL [document](document.md). Each operation has a (possibly nested) [selection set](selection-sets.md), which is a set of [fields](fields.md), each of which may have [arguments](arguments.md). We can also:

- Declare [variables](variables.md) after the operation name.
- [Alias](field-aliases.md) fields to give them different names in the response object.
- Create [named fragments](fragments.md) to reuse fields and add [type conditions](fragments.md#type-conditions) to conditionally select fields from interfaces and unions.
- Add [directives](directives.md) to modify how the server handles a part of a document.
- Use [mutations](mutations.md) to alter data.
- Use [subscriptions](subscriptions.md) to receive events from the server.