---
title: Prefetching
---

## Prefetching

Background: [browser performance](../../background/browser-performance.md)

Section contents:

* [On mouseover](#on-mouseover)
* [Cache redirects](#cache-redirects)

Prefetching is fetching data from the server before we need it so that when we do need it, we already have it on the client and can use it right away. This is great for UX because the user doesn’t have to look at a loading screen waiting for data to load. It’s a common pattern—both [Gatsby](https://www.gatsbyjs.org/docs/gatsby-link/) and [Next.js](https://nextjs.org/docs/#prefetching-pages) prefetch entire webpages with their `<Link>` components.

The most useful thing to prefetch in our app is the section content! We can prefetch just by making a query with the Apollo client:

```js
client.query({
  query: ...
})
```

This will place the results in the cache, so that when we render a `<Section>` and it makes a query for section data, it will immediately find the data in the cache. We could prefetch all the sections using the `sections` root query field:

```js
import React, { useEffect } from 'react'
import { gql, useApolloClient } from '@apollo/client'

const ALL_SECTIONS = gql`
  query AllSections {
    sections {
      id
      content
      views
    }
  }
`

function App() {
  const client = useApolloClient()
  
  useEffect(
    () =>
      requestIdleCallback(() =>
        client.query({
          query: ALL_SECTIONS,
        })
      ),
    [client]
  )

  return <div className="App">...</div>
}
```

For the query selection set, we check the queries in `Section.js` and see that it needs the `content` and `views`. We use `useApolloClient()` to get access to the client instance, and we use `requestIdleCallback()` (which calls the callback when the browser isn’t busy) so that we don’t delay any of the work involved with the initial app render. When the `AllSections` query response arrives, the data is put in the cache, and any future render of `<Section>` is immediate, without need to talk to the server.

### On mouseover

> If you’re jumping in here, `git checkout 22_1.0.0` (tag [`22_1.0.0`](https://github.com/GraphQLGuide/guide/tree/22_1.0.0)). Tag [`23_1.0.0`](https://github.com/GraphQLGuide/guide/tree/23_1.0.0) contains all the code written in this section.

The potential issue with the above approach is how much data we’re prefetching—the entire content of the book. The more data we fetch, the more work the server has to do, and the more work the client has to do—first to receive and cache it, and then later to interact with the larger cache. The client’s workload is more likely to become an issue because Apollo runs in the main thread (it interacts with React, which interacts with the DOM, which is in the main thread), and things it does might delay user interaction or freeze animations (see [Background > Browser performance](../../background/browser-performance.md) for more info). It takes longer for Apollo to query and update the cache when there’s more data in the cache.

So usually instead of prefetching all of the data we could possibly need, we selectively prefetch some of it. One common way to do this is prefetching when the user mouses over something clickable. We might know that we’ll need certain data if they click that particular link or button, in which case we can fetch the data when the mouseover happens instead of waiting for the click. It’s possible that they won’t click, in which case we’ll have extra data that we don’t need, but this usually isn’t a problem.

For the Guide, when a user hovers over a link in the table of contents, we know what data we’ll need—that section’s contents. We can export the query for section contents from `Section.js` and use it in `TableOfContents.js` to make the query  inside the `onMouseOver` function:

[`src/components/TableOfContents.js`](https://github.com/GraphQLGuide/guide/blob/23_1.0.0/src/components/TableOfContents.js)

```js
import { useApolloClient } from '@apollo/client'

import { SECTION_BY_ID_QUERY } from './Section'

export default () => {
  const { data: { chapters } = {}, loading } = useQuery(CHAPTER_QUERY)
  const client = useApolloClient()

  return (
    <nav className="TableOfContents">
      ...
        <NavLink
          to={{
            pathname: slugify(chapter),
            state: { chapter, section: chapter.sections[0] },
          }}
          className="TableOfContents-chapter-link"
          activeClassName="active"
          isActive={(_, location) => {
            const rootPath = location.pathname.split('/')[1]
            return rootPath.includes(withHyphens(chapter.title))
          }}
          onMouseOver={() => 
            client.query({
              query: SECTION_BY_ID_QUERY,
              variables: {
                id: chapter.sections[0].id,
              },
            })
          }
        >
          ...
        </NavLink>
          ...
            <NavLink
              to={{
                pathname: slugify(chapter, section),
                state: { chapter, section },
              }}
              className="TableOfContents-section-link"
              activeClassName="active"
              onMouseOver={() =>
                client.query({
                  query: SECTION_BY_ID_QUERY,
                  variables: {
                    id: section.id,
                  },
                })
              }              
            >
              {section.title}
            </NavLink>
```

We have two `onMouseOver`s: When mousing over a chapter link, we query for the first section of that chapter. When mousing over a section link, we query for that section. 

We also need to add the export:

[`src/components/Section.js`](https://github.com/GraphQLGuide/guide/blob/23_1.0.0/src/components/Section.js)

```js
export const SECTION_BY_ID_QUERY = gql`
  query SectionContent($id: String!) {
    section(id: $id) {
      id
      content
      views
      scrollY @client
    }
  }
`
```

And now it works! When the user hovers over a link, the query is made. Then, when the link is clicked, `<Section>` calls `useQuery()` for the section data, and `useQuery()` instantly returns that data, because it’s already in the cache. We can check this in two ways:

- Opening the devtools Network tab and watching when the `SectionContent` query is sent to the server.
- Seeing whether the loading skeleton appears when we hover over a new link for a second before clicking, versus immediately clicking it. If we want to see the difference more clearly, we can slow down the connection to “Fast 3G” in the devtools Network tab.

Depending on how long we hover, we may still see the loading skeleton: for example, if it takes three seconds to load when we immediately click, and then we hover on the next link for two seconds before clicking, we will still see the skeleton for one second.

One issue to consider is whether we’re making a lot of extra queries, because users may mouse over sections that we’ve already loaded. But the default Apollo client fetch policy is [`cache-first`](https://www.apollographql.com/docs/react/data/queries/#configuring-fetch-logic), which means that if Apollo finds the query results in the cache, it won’t send the query to the server. We’re using the default, so we don’t need to do anything, but if we had set a different default in the [`ApolloClient` constructor](https://www.apollographql.com/docs/react/api/apollo-client.html#apollo-client) like this:

`src/lib/apollo.js`

```js
export const apollo = new ApolloClient({ 
  link, 
  cache,
  defaultOptions: {
    query: {
      fetchPolicy: 'cache-and-network'
    }
  }
})
```

> `cache-and-network` immediately returns any results available in the cache *and also* queries the server

then we could set a different fetch policy just for our prefetching:

```js
onMouseOver={() =>
  client.query({
    query: SECTION_BY_ID_QUERY,
    variables: {
      id: section.id,
    },
    fetchPolicy: 'cache-first',
  })
}
```

### Cache redirects

> If you’re jumping in here, `git checkout 23_1.0.0` (tag [`23_1.0.0`](https://github.com/GraphQLGuide/guide/tree/23_1.0.0)). Tag [`24_1.0.0`](https://github.com/GraphQLGuide/guide/tree/24_1.0.0) contains all the code written in this section.

There are often more ways than just mouseovers to intelligently prefetch certain data. What the ways are depends on the type of app. We have to think about how the user uses the app, and what they might do next. In our app, one common action will probably be to read the next section. So a simple thing we can do is whenever we show a section, we prefetch the next section:

[`src/components/Section.js`](https://github.com/GraphQLGuide/guide/blob/24_1.0.0/src/components/Section.js)

```js
import { useApolloClient } from '@apollo/client'

export default () => {
  ...
  
  const id = get(section, 'id')
  
  const client = useApolloClient()

  useEffect(() => {
    client.query({
      query: ...
      variables: {
        id: ...
      },
    }),
  }, [id, client])
}
```

But what query do we make? We could take the current section ID, eg `1_3` (chapter 1, section 3) and try the next section number, eg `1-4`, and if that failed (because it was the end of the chapter), we could go to the next chapter with `2_1`. That would look something like:

```js
useEffect(() => {
  async function prefetchSectionData() {
    const nextSectionId = ...
    const { data } = await client.query({
      query: SECTION_BY_ID_QUERY,
      variables: {
        id: nextSectionId,
      },
    })

    if (!data.section) {
      const nextChapterId = ...
      client.query({
        query: SECTION_BY_ID_QUERY,
        variables: {
          id: `${nextChapterId}_1`,
        },
      })
    }
  }

  prefetchSectionData()
}, [id, client])
```

[`client.query()`](https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.query) returns a Promise, which we can `await`, and our API resolves the `section` query to `null` when there is no such section. So when `data.section` is null, we query for the next chapter. (Alternatively, if our API instead returned a “No such section” error, we could use a `try...catch` statement.)

However, there’s a way to get the next section in a single query—the `Section` type has a field `next` of type `Section`! Let’s write a query for that:

[`src/components/Section.js`](https://github.com/GraphQLGuide/guide/blob/24_1.0.0/src/components/Section.js)

```js
const NEXT_SECTION_QUERY = gql`
  query NextSection($id: String!) {
    section(id: $id) {
      id
      next {
        id
        content
        views
        scrollY @client
      }
    }
  }
`

...

useEffect(() => {
  if (!id) {
    return
  }

  client.query({
    query: NEXT_SECTION_QUERY,
    variables: { id },
  })
}, [id, client])
```

For the `next` selection set, we copy the fields from the other queries in `Section.js`, since those are the fields that will be needed if the user navigates to the next section. It now seems like we’re done, and if we look at the Network tab, we see that the prefetch query is made. We can also see in Apollo devtools that the Section object with the next section ID is in the cache. However, when we navigate to the next section, the `SectionContent` query is still being made!

```gql
query SectionContent($id: String!) {
  section(id: $id) {
    id
    content
    views
    scrollY @client
  }
}
```

The problem is that Apollo doesn’t have a way of knowing that the server will respond to a `section` query that has an `id` argument with the `Section` object matching that ID. We can inform Apollo of this using a field policy `read` function that checks the cache:

[`src/lib/apollo.js`](https://github.com/GraphQLGuide/guide/blob/24_1.0.0/src/lib/apollo.js)

```js
export const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        reviews: ...
        section: (_, { args: { id }, toReference }) => 
          toReference({
            __typename: 'Section',
            id,
          }),
      },
    },
  },
})
```

Now when we query the `section` root query field, Apollo will call the `Query.fields.section` read function, which will return a reference to a `Section` object in the cache. If the object is present and contains all the fields selected in the query, Apollo will return it. Otherwise, Apollo will send the query to the server.

And it works! If we turn on Slow 3G in the Network tab and click on the next section, it will render immediately, because it was prefetched when the previous section rendered 😊.

