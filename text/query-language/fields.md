---
title: Fields
---

# Fields

A [*field*](http://spec.graphql.org/draft/#sec-Language.Fields) is a piece of information that can be requested in a selection set. In the above query, `githubStars`, `chapter`, and `title` are all fields. The first two are top-level fields (in the outer selection set, at the first level of indentation), and they’re called *root query fields*. Similarly, `viewedSection` in the document below is a *root mutation field*:

```gql
mutation ViewedSectionTwo {
  viewedSection(id: "0-2") {
    ...sectionData
  }
}
```
