## Querying with variables

> If you’re jumping in here, `git checkout 2_1.0.0` (tag [2_1.0.0](https://github.com/GraphQLGuide/guide/tree/2_1.0.0)). Tag [`3_1.0.0`](https://github.com/GraphQLGuide/guide/tree/3_1.0.0) contains all the code written in this section.

Let’s make a second query—this time with a variable. If we want to display the sections in a chapter, the simplest way would be to select sections in the `ChapterList` query:

```js
export default {
  name: 'TableOfContents',
  setup() {
    const { result, loading, error } = useQuery(gql`
      query ChapterList {
        chapters {
          id
          number
          title
          sections {
            id
            number
            title
          }
        }
      }
    `)
```

Then when a chapter is selected, we display a list of `chapter.sections`. We might not want to do it this way, however, if the query would return too much data. We also might not be able to, if the schema didn’t have a `Chapter.sections` field. 

In this section, we’ll use a separate query, just so that we can see what it would look like. Let’s create a `<SectionList>` component that takes the chapter `id` as a prop and queries for that chapter’s sections:

[`src/components/SectionList.vue`](https://github.com/GraphQLGuide/guide-vue/blob/3_1.0.0/src/components/SectionList.vue)

```html
<template>
  ...
</template>

<script>
import { useQuery } from '@vue/apollo-composable'
import { gql } from '@apollo/client/core'

export default {
  name: 'SectionList',
  props: {
    id: {
      type: Number,
      required: true
    }
  },
  setup(props) {
    const { result, loading, error } = useQuery(
      gql`
        query SectionList($id: Int!) {
          chapter(id: $id) {
            sections {
              id
              number
              title
            }
          }
        }
      `,
      props
    )

    ...
  }
}
</script>
```

The second argument to `useQuery()` is the variables. The format of our variables object (`{ id: '[chapter-id]' }`) matches our `props` object, so we just pass that. And since the `props` object is reactive, when a new `id` prop is passed, Apollo will notice the change and send a new query to the server (or read from the cache when the result is available, since the default Apollo Client network policy is `cache-first`).

If our props didn’t happen to line up with the variables format—for instance, if we had multiple props, or the prop name was something more descriptive like `chapterId`—then we could use another reactive variable (like a `ref` or a `reactive` object) or a function, like this:

```js
export default {
  name: 'SectionList',
  props: {
    chapterId: {
      type: Number,
      required: true
    }
  },
  setup(props) {
    const { result, loading, error } = useQuery(
      gql`
        query SectionList($id: Int!) {
          chapter(id: $id) {
            sections {
              id
              number
              title
            }
          }
        }
      `,
      () => ({
        id: props.chapterId
      })
    )
```

We can also pass a non-reactive variables object and then change it later with the `variables` ref that `useQuery()` returns:

```js
setup(props) {
  const { result, variables } = useQuery(
    gql`
      query SectionList($id: Int!) {
        chapter(id: $id) {
          sections {
            id
            number
            title
          }
        }
      }
    `,
    { id: 1 }
  )

  function selectChapter (id) {
    variables.value = {
      id,
    }
  }
```

Going back to our original `setup` function, after we get the `result`, we want to extract the `sections`:

```js
import { useResult } from '@vue/apollo-composable'
import { computed } from 'vue'

export default {
  name: 'SectionList',
  props: {
    id: {
      type: Number,
      required: true
    }
  },
  setup(props) {
    const { result, loading, error } = useQuery(
      gql`
        query SectionList($id: Int!) {
          chapter(id: $id) {
            sections {
              id
              number
              title
            }
          }
        }
      `,
      props
    )

    const sections = useResult(result, [], data => data.chapter.sections)

    return {
      loading,
      error,
      sections,
      noSections: computed(() => sections.value.length === 1)
    }
  }
}
```

In `TableOfContents.vue`, we only passed two arguments to `useResult()`, relying on the default behavior of extracting the root query field. However, the root query field here is `chapter`, which we don’t want. So we pass a third argument: a function that tells `useResult()` how to extract the data. Note that we don’t need to guard against `data` or `data.chapter` being null, as `useResult()` catches errors from this function. 

When the API returns a single section in a chapter, it means the chapter consists of a single unnamed section, so we can’t display a section list. It will be helpful in the template to have a `noSections` boolean. We create it using `computed()` so that it’s reactive, updating when the `sections` ref changes (which in turn changes when the props change and `useQuery()` returns a different `result`).

Now we’re ready to use our reactive variables `loading`, `error`, `sections`, and `noSections` in the template:

```html
<template>
  <h2>Sections</h2>

  <div v-if="loading">Loading...</div>

  <div v-else-if="error">Error: {{ error.message }}</div>

  <div v-else-if="noSections">This chapter has no sections</div>

  <ul v-else>
    <li v-for="section of sections" :key="section.id">
      {{ section.number }}. {{ section.title }}
    </li>
  </ul>
</template>

<script>
...
</script>
```

As before, we use a `v-if` to cover all the different states and `v-for` to go through the section list.

Lastly, we need to include `SectionList` in `TableOfContents` and pass the `id` prop like `<SectionList id="1">`. But we want the `id` to change when we click a different chapter, so we pass a ref like `<SectionList :id="currentSection">`. Here’s the full implementation, with an `updateCurrentSection()` function for updating the ref:

[`src/components/TableOfContents.vue`](https://github.com/GraphQLGuide/guide-vue/blob/3_1.0.0/src/components/TableOfContents.vue)

```html
<template>
  <div v-if="loading">Loading...</div>

  <div v-else-if="error">Error: {{ error.message }}</div>

  <ul>
    <li v-for="chapter of chapters" :key="chapter.id">
      <a @click="updateCurrentSection(chapter.id)">
        {{
          chapter.number ? `${chapter.number}. ${chapter.title}` : chapter.title
        }}
      </a>
    </li>
  </ul>

  <SectionList :id="currentSection" />
</template>

<script>
import { useQuery, useResult } from '@vue/apollo-composable'
import { gql } from '@apollo/client/core'
import { ref } from 'vue'

import SectionList from './SectionList.vue'

const PREFACE_ID = -2

export default {
  name: 'TableOfContents',
  components: {
    SectionList
  },
  setup() {
    const currentSection = ref(PREFACE_ID)

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
      chapters,
      currentSection,
      updateCurrentSection: newSection => (currentSection.value = newSection)
    }
  }
}
</script>
```

We call `updateCurrentSection()` when a chapter title is clicked. We can test it out by clicking different chapter titles in the browser and see that it works! 💃 

![](../img/vue-sections.png)

> When we click `Chapter 6: React`, that chapter’s sections appear below.

We can also notice that when we click on a new chapter, we see “Loading…” flash before the sections appear, and when we click on a chapter we’ve clicked on previously, the sections appear immediately, as Apollo Client loaded the data from the cache instead of querying the server.

