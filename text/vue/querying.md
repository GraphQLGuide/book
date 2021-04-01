## Querying

> If you’re jumping in here, `git checkout 1_1.0.0` (tag [1_1.0.0](https://github.com/GraphQLGuide/guide/tree/1_1.0.0)). Tag [`2_1.0.0`](https://github.com/GraphQLGuide/guide/tree/2_1.0.0) contains all the code written in this section.

Now that we’ve provided a client instance, we should be able to make GraphQL queries from any component. Let’s try one out in a `TableOfContents` component. 

[`src/components/TableOfContents.vue`](https://github.com/GraphQLGuide/guide-vue/blob/2_1.0.0/src/components/TableOfContents.vue)

```html
<template>
  ...
</template>

<script>
import { gql } from '@apollo/client/core'
import { useQuery, useResult } from '@vue/apollo-composable'

export default {
  name: 'TableOfContents',
  setup() {
    const { result, loading, error } = useQuery(gql`
      query ChapterList {
        chapters {
          id
          number
          title
        }
      }
    `)

    const chapters = useResult(result, [])

    return {
      loading,
      error,
      chapters
    }
  }
}
</script>
```

Here we’re using:

- `gql` template literal tag to define our operation.
- [`useQuery()`](https://v4.apollo.vuejs.org/guide-composable/query.html#usequery) to send the query. It returns [refs](https://composition-api.vuejs.org/api.html#ref) that hold the `result` data, `loading` boolean, and `error` object.
- [`useResult()`](https://v4.apollo.vuejs.org/guide-composable/query.html#useresult), which creates a new ref of the root query field data (or the default value `[]` if the result is null). In this case, that’s the `data.chapters` value of the GraphQL response. 

`useResult()` is a convenience function provided so that we don’t have to either: A. add logic to our template based on the contents of the `result` ref, or B. write a comparatively long [`computed()`](https://composition-api.vuejs.org/api.html#computed) function to create a `chapters` ref. 

At the end of `setup()`, we return the `loading`, `error`, and `chapters` refs so we can access them in the template:

[`src/components/TableOfContents.vue`](https://github.com/GraphQLGuide/guide-vue/blob/2_1.0.0/src/components/TableOfContents.vue)

```html
<template>
  <div v-if="loading">Loading...</div>

  <div v-else-if="error">Error: {{ error.message }}</div>

  <ul>
    <li v-for="chapter of chapters" :key="chapter.id">
      {{
        chapter.number ? `${chapter.number}. ${chapter.title}` : chapter.title
      }}
    </li>
  </ul>
</template>
```

If the `loading` ref is true, then we display `Loading...`. Else if `error` is truthy, we display the error message. Then we display a list of chapters, displaying the chapter numbers and titles. If we were operating on `result`, or if we didn’t have a default value for `chapters`, then we would probably want to use the `v-else` directive on `<ul>`. We could add it anyway if we thought it made the code clearer to read, or if we didn’t want an empty `<ul></ul>` in the HTML while in the loading and error states.

Finally, we need to add this component to our App component:

[`src/App.vue`](https://github.com/GraphQLGuide/guide-vue/blob/2_1.0.0/src/App.vue)

```html
<template>
  <img alt="Vue logo" src="./assets/logo.png" />
  <h1>The GraphQL Guide</h1>
  <TableOfContents />
</template>

<script>
import { ApolloClient, InMemoryCache } from '@apollo/client/core'
import { DefaultApolloClient } from '@vue/apollo-composable'
import { provide } from 'vue'

import TableOfContents from './components/TableOfContents.vue'

const client = new ApolloClient({ ... })

export default {
  name: 'App',
  components: {
    TableOfContents
  },
  setup() {
    provide(DefaultApolloClient, client)
  }
}
</script>
```

We import it, register it with the `components` option in the export object, and use it in the template. [`localhost:8080`](http://localhost:8080/) should now show the list of chapters:

![The same site as before, with a bulleted list of chapters at the bottom](../img/vue-chapters.png)

