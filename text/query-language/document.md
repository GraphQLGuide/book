# Document

Similar to how we call a JSON file or string a JSON document, a GraphQL file or string is called a GraphQL [*document*](http://spec.graphql.org/draft/#sec-Document). There are two types of GraphQL documents—*executable documents* and *schema documents*. In this chapter, we’ll mainly be discussing executable documents, and we’ll cover schema documents in [Chapter 3](../type-system/index.md). An executable document is a list of one or more operations or [fragments](fragments.md). Here’s a document with a query operation:

```gql
query {
  githubStars
}
```

Our operation has a single root [field](fields.md), `githubStars`. In this type of document—a single `query` operation without [variables](variables.md) or [directives](directives.md)—we can omit `query`, so the above document is equivalent to:

```gql
{
  githubStars
}
```

A more complex document could be:

```gql
query StarsAndChapter {
  githubStars
  chapter(id: 0) {
    title
  }
}

mutation ViewedSectionOne {
  viewedSection(id: "0-1") {
    ...sectionData
  }
}

mutation ViewedSectionTwo {
  viewedSection(id: "0-2") {
    ...sectionData
  }
}

fragment sectionData on Section {
  id
  title
}

subscription StarsSubscription {
  githubStars
}
```

It has all the operation types as well as a fragment. Note that when we have more than one operation, we need to give each a name—in this case, `StarsAndChapter`, `ViewedSection*`, and `StarsSubscription`. 

