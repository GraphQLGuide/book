---
title: Selection sets
---

# Selection sets

The content between a pair of curly braces is called a [*selection set*](http://spec.graphql.org/draft/#sec-Selection-Sets)—the list of data fields we’re requesting. For instance, the `StarsAndChapter` selection set lists the `githubStars` and `chapter` fields:

```gql
{
  githubStars
  chapter(id: 0) {
    title
  }
}
```

And `chapter` has its own selection set: `{ title }`.

