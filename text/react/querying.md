---
title: Querying
---

# Querying

Section contents:

* [First query](#first-query)
* [Loading](#loading)
* [Polling](#polling)
* [Subscriptions](#subscriptions)
* [Lists](#lists)
* [Query variables](#query-variables)
* [Variable query](#variable-query)

## First query

One of the fields we can query for is `githubStars`, the number of stars the
Guide’s [github repo](https://github.com/GraphQLGuide/guide) has. Let’s look at
how we can make that query and display the results. We’ll start out by adding a
component to display the star count:

[`src/components/StarCount.js`](https://github.com/GraphQLGuide/guide/blob/1_1.0.0/src/components/StarCount.js)

```js
import React from 'react'

export default () => {
  return (
    <a className="StarCount" href="https://github.com/GraphQLGuide/guide">
      {count}
    </a>
  )
}
```

But how do we get the `count` number? First we write the query, which is
pretty simple, since it’s a top-level
[scalar](../type-system/scalars.md) query field:

```js
import { gql } from '@apollo/client'

const STARS_QUERY = gql`
  query StarsQuery {
    githubStars
  }
`
```

We name it `STARS_QUERY` because convention is to use all caps for query
constants. We use an
[operation name](http://graphql.org/learn/queries/#operation-name)
(`StarsQuery`) so that it’s easier to find and debug. `gql` is a
[template literal tag](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_template_literals)
that parses our [query document](../query-language/document.md) string, converting it into a structured object
that we can pass to Apollo—now we can give it to Apollo’s `useQuery` hook:

```js
import { gql, useQuery } from '@apollo/client'

const STARS_QUERY = gql`
  query StarsQuery {
    githubStars
  }
`

export default () => {
  const { data } = useQuery(STARS_QUERY)

  return (
    <a
      className="StarCount"
      href="https://github.com/GraphQLGuide/guide"
      target="_blank"
      rel="noopener noreferrer"
    >
      {data && data.githubStars}
    </a>
  )
}
```

`useQuery` returns an object with [many properties](https://www.apollographql.com/docs/react/api/react/hooks/#result). For now, we’re just using `data`, the `"data"` attribute in the JSON response from the server. When the page is loaded and the component is created, Apollo will send the query to the server, during which `data` will be undefined. When the response arrives from the server, our function is re-run with `data` defined.

Now we can add the component to our app:

[`src/components/App.js`](https://github.com/GraphQLGuide/guide/blob/1_1.0.0/src/components/App.js)

```js
import StarCount from './StarCount'
...
<header className="App-header">
  <StarCount />
  <img src={logo} className="App-logo" alt="logo" />
  <h1 className="App-title">The GraphQL Guide</h1>
</header>
```

And we have a working GraphQL-backed app!

![GitHub stars in header](../img/stars.png)

🙌👊

## Loading

> If you’re jumping in here, `git checkout 1_1.0.0` (tag [`1_1.0.0`](https://github.com/GraphQLGuide/guide/tree/1_1.0.0)). Tag [2_1.0.0](https://github.com/GraphQLGuide/guide/tree/2_1.0.0) contains all the code written in this section.

`loading` is another property returned by `useQuery()`. It’s `true` when a network request is in flight. 

When we reload the app, we see a flash of “⭐️ stars” before the number appears,
pushing `stars` to the right. When `<StarCount>` is rendered the first time, it
doesn’t have the number of stars yet. Let’s log `data` and `loading` to see it happening:

[`src/components/StarCount.js`](https://github.com/GraphQLGuide/guide/blob/1_1.0.0/src/components/StarCount.js)

```js
export default () => {
  const { data, loading } = useQuery(STARS_QUERY)

  console.log('rendering StarCount', data, loading)
```

```
rendering StarCount undefined true
rendering StarCount {githubStars: 102} false
```

We see that it’s rendered twice—first `loading` is `true` and `data` is
`undefined`, and then later, once the query has finished, `loading` is `false`
and `data` is an object.

`⭐️ stars` without a number doesn’t make sense, and `stars` jumping to the
right when the number appears doesn’t look nice, so let’s hide
everything until the number has arrived by adding the modifier CSS class
`'loading'` when the `loading` prop is `true`:

```js
import classNames from 'classnames'

export default () => {
  const { data, loading } = useQuery(STARS_QUERY)

  return (
    <a
      className={classNames('StarCount', { loading })}
```

> `classNames` takes strings or objects as arguments and combines them into a
> React `className` string. For objects, it includes the key if the value is
> true. For example, `classNames('a', { b: false, c: true }, 'd')` returns `'a c
> d'`.

When `loading` becomes `false`, the CSS class `'loading'` is removed, and the
component fades in.

## Polling

Right now our star count is static—once it’s fetched, the number remains on the
page until the page is refreshed. If the actual number of stars on the
repository changes, we won’t know until we refresh. If we want to keep the
number (and any other GraphQL data) up to date, we can do so in two different
ways: polling and [subscriptions](../query-language/subscriptions.md). Polling is much easier to
implement, so let’s do that first. We can add a [`pollInterval`](https://www.apollographql.com/docs/react/api/react/hooks/#params) option to our query in `StarCount.js`:

[`src/components/StarCount.js`](https://github.com/GraphQLGuide/guide/blob/2_1.0.0/src/components/StarCount.js)

```js
export default () => {
  const { data, loading } = useQuery(STARS_QUERY, {
    pollInterval: 5 * 1000,
  })
```

Now every five seconds, Apollo
will resend our `STARS_QUERY`. If the response has a different value for
`githubStars`, Apollo will pass us the new prop, which will trigger a
component re-render, and the new count will be displayed on the page.

Depending on what type of data we’re keeping up to date, we may want to use some
kind of visual cue or animation when it changes. There are a few possible
motivations for this:

1. Calling attention to the change to make the user aware that it
   happened—a common example in this category is the brief yellow background glow.
   Another example is in Google Docs—the colored cursor labeled with a name that
   follows someone’s live edits. However, sometimes a user doesn’t need to know
   that a piece of data has changed, and calling attention to it would
   needlessly distract them from what they were paying attention to.
2. Making the change visually smoother. If a change in the data triggers some
   node on the page to change in size, and there are other nodes on the page
   around it, the other nodes might jump to a new location when the browser
   reflows—for example, if the data is a paragraph of text, and the updated
   paragraph is twice as long, everything below that paragraph will be pushed
   down. We can make this change look nicer by animating the data container to
   its new size and animating the displaced components to their new locations.
   This also gives time for the user to notice which part of the page changed,
   which is helpful for situations in which the user doesn’t realize why things on
   the page jumped around.
3. For fun 😄. Animations can be fun, and sometimes we add them just because we like how it feels.

The data change that happens in our app is a number that is usually just going
up by 1. This type of change is well-suited to an odometer animation, where each
digit is on a number wheel that rotates up or down to reveal the next number.
The benefit of this animation is #3, and the downside is #1—the odometer
changing draws more attention to the change than a non-animated change does, but
the user doesn’t need to know when the star count changes (they’re just trying
to read the book!). So we might not add this animation to a serious app, but
let’s add it to our app for fun 😊. It’s easy with the
[`react-odometerjs`](https://www.npmjs.com/package/react-odometerjs) component:

[`src/components/StarCount.js`](https://github.com/GraphQLGuide/guide/blob/2_1.0.0/src/components/StarCount.js)

```js
import Odometer from 'react-odometerjs'

...

    <a
      className={classNames('StarCount', { loading })}
      href="https://github.com/GraphQLGuide/guide"
      target="_blank"
      rel="noopener noreferrer"
    >
      {data && <Odometer value={data.githubStars} />}
    </a>
```

Now when the polling `STARS_QUERY` results in a new `githubStars` value, we pass
the new number to the `<Odometer>` component, which does the animation.

We can test it out by starring and un-starring
the [repository on GitHub](https://github.com/GraphQLGuide/guide) and watching the number
in our app update.

## Subscriptions

Background: [webhooks](../background/webhooks.md)

> If you’re jumping in here, `git checkout 2_1.0.0` (tag [`2_1.0.0`](https://github.com/GraphQLGuide/guide/tree/2_1.0.0)). Tag [3_1.0.0](https://github.com/GraphQLGuide/guide/tree/3_1.0.0) contains all the code written in this section.

When we poll for new data every 5 seconds, it takes 2.5 seconds on average (as
little as 0, and as much as 5) for a change to show up, plus a little time for
the server to talk to GitHub and get the response back to us. For certain types
of apps, like a chat app or multiplayer games, it’s important to receive updates
in less than 2.5 seconds. One thing we can do is reduce the poll interval—for
instance, a 500 ms interval would mean an average update speed of 250 ms (plus
server response time). This would be fast enough for a chat app but not fast
enough for some games. And it comes at a certain cost in server workload (it now
has to respond to 10 times as many requests) and browser workload (sending
requests takes up main-thread JavaScript time, perhaps during one of the
[10ms windows](https://developers.google.com/web/fundamentals/performance/rail)
in which the thread needs to quickly calculate a 60 fps animation). So
while polling is often the best choice given its simplicity to implement (we
just added that single [`pollInterval` option](#polling)), sometimes we want
something more efficient and real-time.

In these cases we can use GraphQL
[subscriptions](https://dev-blog.apollodata.com/graphql-subscriptions-in-apollo-client-9a2457f015fb),
in which our server will send us updates to our data as they occur. The main
drawback to subscriptions is that it takes extra work to implement on the
server. (In the last chapter we’ll learn how to
[add subscription support](../server/building/subscriptions.md).) Another possible drawback is
that if the subscription data changes frequently, it can hurt client performance
by taking up time receiving, updating the cache, and re-rendering the page.

While GraphQL servers can support different methods of transporting subscription
updates to clients (the GraphQL spec is transport-agnostic), the usual method is
over WebSockets. 

> *WebSocket* is a format for sending messages over the internet (like [HTTP](../background/http.md)). It allows for very fast two-way communication by keeping a connection open and allowing the server to initiate messages to the client.

We could replace our HTTP link with a [WebSocket
link](https://www.apollographql.com/docs/react/api/link/apollo-link-ws/) in `index.js`:


```js
import { WebSocketLink } from '@apollo/client/link/ws'

const link = new WebSocketLink({
  uri: `wss://api.graphql.guide/subscriptions`,
  options: {
    reconnect: true
  }
})
```

This would establish a WebSocket connection that remains open for the duration of the client session, and all GraphQL communication
(queries, mutations, and subscriptions) would be sent over the connection. However, authentication over the WebSocket is a little involved, so we’ll go with a hybrid transport solution: we’ll send queries and mutations over an HTTP link (which we’ll add auth to later), and we’ll send subscriptions over the unauthenticated WebSocket link. We can do this because all of the data used in the Guide’s real-time features (for example `StarCount`, and later on, reviews) is public. 

[`src/index.js`](https://github.com/GraphQLGuide/guide/blob/3_1.0.0/src/index.js)

```js
import { split } from '@apollo/client'
import { WebSocketLink } from '@apollo/client/link/ws'
import { getMainDefinition } from '@apollo/client/utilities'

const httpLink = new HttpLink({
  uri: 'https://api.graphql.guide/graphql'
})

const wsLink = new WebSocketLink({
  uri: `wss://api.graphql.guide/subscriptions`,
  options: {
    reconnect: true
  }
})

const link = split(
  ({ query }) => {
    const { kind, operation } = getMainDefinition(query)
    return kind === 'OperationDefinition' && operation === 'subscription'
  },
  wsLink,
  httpLink
)
```

The `ApolloClient` constructor options object takes a single link, so we need to compose our two links together. We can use the [`split()` function](https://www.apollographql.com/docs/link/composition/#directional-composition), which takes a function and two links. The function is given the current query, and if it returns true, the first link is used for the query; otherwise, the second is used. In our `split()` function we look up the query operation and return true if it’s a subscription query, which directs the query to the WebSocket link `wsLink`.

Now we can subscribe to updates to the star count with this simple subscription:

[`src/components/StarCount.js`](https://github.com/GraphQLGuide/guide/blob/3_1.0.0/src/components/StarCount.js)

```js
const STARS_SUBSCRIPTION = gql`
  subscription StarsSubscription {
    githubStars
  }
`
```

To start the subscription, we use a function
[`subscribeToMore`](https://www.apollographql.com/docs/react/features/subscriptions.html#subscribe-to-more)
that `useQuery()` returns:

[`src/components/StarCount.js`](https://github.com/GraphQLGuide/guide/blob/3_1.0.0/src/components/StarCount.js)

```js
import { useEffect } from 'react'

export default () => {
  const { data, loading, subscribeToMore } = useQuery(STARS_QUERY, {
    pollInterval: 5 * 1000,
  })

  useEffect(
    () =>
      subscribeToMore({
        document: STARS_SUBSCRIPTION,
        updateQuery: (
          _,
          {
            subscriptionData: {
              data: { githubStars },
            },
          }
        ) => ({ githubStars }),
      }),
    [subscribeToMore]
  )

  return (
    <a
      className={classNames('StarCount', { loading })}
      href="https://github.com/GraphQLGuide/guide"
      target="_blank"
      rel="noopener noreferrer"
    >
      {data && <Odometer value={data.githubStars} />}
    </a>
  )
}
```

We want to start the subscription when the component is initialized, so we use [`useEffect()`](https://reactjs.org/docs/hooks-effect.html). While the `subscribeToMore` won’t be changing, we include it in the dependency array (instead of passing an empty array) because it’s required by our linting.

`subscribeToMore` takes the GraphQL document specifying our subscription and an
`updateQuery` function. `updateQuery` is called each time the client receives
new subscription data from the server. The first argument `updateQuery` is given is the result of the previous query (`{ githubStars: 102 }` in our case), and the second is the subscription event data. It returns an updated query result, which is used to provide new props to the component. In this example, we’re just replacing the old result with the GitHub star count received
in the `subscriptionData`. But if GitHub never lets us un-star repos, and the
star count only ever increased, then we might use a `justGotStarred`
subscription that published `{ newStar: true }` to the client. Then our
`updateQuery` would look like:

```js
  subscribeToMore({
    document: JUST_GOT_STARRED_SUBSCRIPTION,
    updateQuery: previousResult => ({ 
      githubStars: previousResult + 1
    }),
  }),
```

The last thing we need to do is test whether our `STARS_SUBSCRIPTION` is working:
we stop polling by removing the `pollInterval` option from our `useQuery()`:

```js
export default () => {
  const { data, loading, subscribeToMore } = useQuery(STARS_QUERY)
```

Now we can star and unstar the
[Guide repo](https://github.com/GraphQLGuide/guide) and see the count quickly
change in our app. We might notice a slight delay sometimes, and that’s because
the server is polling the GitHub API once a second for updates, so the
subscription data reaching the client could be as old as 1 second plus network
time. We could improve this by reducing the polling interval on the server or by
setting up a [webhook](../background/webhooks.md)—the most efficient and lowest-latency solution,
in which the only delay would be network time. With a webhook, GitHub would immediately notify
our server of the change, and the server would immediately send the subscription
update over the WebSocket to the client.

## Lists

> If you’re jumping in here, `git checkout 3_1.0.0` (tag [`3_1.0.0`](https://github.com/GraphQLGuide/guide/tree/3_1.0.0)). Tag [`4_1.0.0`](https://github.com/GraphQLGuide/guide/tree/4_1.0.0) contains all the code written in this section.

> See the [Listing reviews](mutating.md#listing-reviews) section for another example of querying a list of data.

Next let’s get to the heart of our app—the stuff below the header! We’ll want to
reserve most of the space for the book content, since there’s a lot of it, and
reading it is the purpose of the app 😜. But let’s put a thin sidebar on the left
for the table of contents so that readers can easily navigate between sections.

To begin, we replace the `<p>` in `<App>` with the two new sections of the page:

[`src/components/App.js`](https://github.com/GraphQLGuide/guide/blob/4_1.0.0/src/components/App.js)

```js
import TableOfContents from './TableOfContents'
import Section from './Section'

...

<div className="App">
  <header className="App-header">
    <StarCount />
    <img src={logo} className="App-logo" alt="logo" />
    <h1 className="App-title">The GraphQL Guide</h1>
  </header>
  <TableOfContents />
  <Section />
</div>
```

We call the second component `Section` because it will display a single section
of a chapter at a time. Let’s think about the loading state first—we’ll be
fetching the table of contents and the section content from the API. We could do
a loading spinner, but a nicer alternative when we’re waiting for text to load
is a loading skeleton—an animated gray bar placed where the text will appear.
Let’s put a few bars in both components:

[`src/components/Section.js`](https://github.com/GraphQLGuide/guide/blob/4_1.0.0/src/components/Section.js)

```js
import React from 'react'
import Skeleton from 'react-loading-skeleton'

export default () => {
  const loading = true

  return (
    <section className="Section">
      <div className="Section-header-wrapper">
        <header className="Section-header">
          <h1>Title</h1>
          <h2>Subtitle</h2>
        </header>
      </div>
      <div className="Section-content">{loading && <Skeleton count={7} />}</div>
    </section>
  )
}
```

`count={7}` will give us 7 gray bars, representing 7 lines of text. Now for the
sidebar:

[`src/components/TableOfContents.js`](https://github.com/GraphQLGuide/guide/blob/4_1.0.0/src/components/TableOfContents.js)

```js
import React from 'react'
import Skeleton from 'react-loading-skeleton'

export default () => {
  const loading = true

  return (
    <nav className="TableOfContents">
      {loading ? (
        <div>
          <h1>
            <Skeleton />
          </h1>
          <Skeleton count={4} />
        </div>
      ) : null}
    </nav>
  )
}
```

`<Skeleton>` picks up the surrounding font size, so we’ll see a larger gray line
(in place of a chapter title) and then 4 smaller lines (in place of section
titles):

![Loading skeleton](../img/loading-skeleton.png)

Now let’s construct the query for the data we need to display in
`TableOfContents`. We can explore the Guide API’s schema in GraphQL Playground, an IDE for writing GraphQL queries. Its playground is located at [api.graphql.guide/play](https://api.graphql.guide/play). In the below screenshot, we’re querying for `{ githubStars }`. On the left side we have the GraphQL document, and when we click the play button (or `command-return`), we see the response on the right:

![Playground: query { githubStars }](../img/play-githubStars.png)

<!-- [Playground: `query { githubStars }`](https://www.graphqlbin.com/qj7PuX) -->

Now let’s delete `githubStars`, and with our cursor in between the `query` braces, we hit `control-space` to bring up query suggestions:

![Playground with query suggestions](../img/play-suggestions.png)

The one we want is `chapters`. Now we can add an inner set of braces (the
[selection set](../query-language/selection-sets.md) on `chapters`), move our cursor inside, and hit `control-space` again to see the available fields of a `Chapter` (which is the type that `chapters` returns):

```gql
query {
  chapters {

  }
}
```

We’ll want to display the `title` and the `sections`, and we do the same to see
which fields of a `Section` we want.

```gql
query {
  chapters {
    title
    sections {

    }
  }
}
```

And we see `title`, which we will want for each section. 

![Playground Section field suggestions](../img/play-section-suggestions.png)

We will also want to display the chapter and section numbers, so let’s add those as well. Our whole query is:

```gql
query {
  chapters {
    number
    title
    sections {
      number
      title
    }
  }
}
```

We can see what the data looks like by hitting the play button or
`command-return`. 

![Playground chapters query response](../img/play-chapters.png)

To use our query in our component, we give it a name,
`ChapterQuery`, put it inside a `gql` template string, and use `useQuery()`:

[`src/components/TableOfContents.js`](https://github.com/GraphQLGuide/guide/blob/4_1.0.0/src/components/TableOfContents.js)

```js
import { gql, useQuery } from '@apollo/client'

const CHAPTER_QUERY = gql`
  query ChapterQuery {
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
`

export default () => {
  const { data: { chapters } = {}, loading } = useQuery(CHAPTER_QUERY)

  return ( ... )
```

Now we can use `chapters` in our JSX. For each chapter we display a
list of links to each section:

[`src/components/TableOfContents.js`](https://github.com/GraphQLGuide/guide/blob/4_1.0.0/src/components/TableOfContents.js)

```js
import { NavLink } from 'react-router-dom'
import classNames from 'classnames'

import { slugify, withHyphens } from '../lib/helpers'

const LoadingSkeleton = () => (
  <div>
    <h1>
      <Skeleton />
    </h1>
    <Skeleton count={4} />
  </div>
)

export default () => {
  const { data: { chapters } = {}, loading } = useQuery(CHAPTER_QUERY)

  return (
    <nav className="TableOfContents">
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <ul className="TableOfContents-chapters">
          {chapters.map(chapter => {
            const chapterIsNumbered = chapter.number !== null
            return (
              <li
                className={classNames({ numbered: chapterIsNumbered })}
                key={chapter.id}
              >
                <NavLink
                  to={{
                    pathname: slugify(chapter),
                    state: { chapter, section: chapter.sections[0] }
                  }}
                  className="TableOfContents-chapter-link"
                  activeClassName="active"
                  isActive={(match, location) => {
                    const rootPath = location.pathname.split('/')[1]
                    return rootPath.includes(withHyphens(chapter.title))
                  }}
                >
                  {chapterIsNumbered && (
                    <span className="TableOfContents-chapter-number">
                      {chapter.number}
                    </span>
                  )}
                  {chapter.title}
                </NavLink>
                {chapterIsNumbered && (
                  <ul className="TableOfContents-sections">
                    {chapter.sections.map(section => (
                      <li key={section.number}>
                        <NavLink
                          to={{
                            pathname: slugify(chapter, section),
                            state: { chapter, section }
                          }}
                          className="TableOfContents-section-link"
                          activeClassName="active"
                        >
                          {section.title}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </nav>
  )
}
```

Okay, so that was a lot of code 😁. We’ve got an outer list of chapters, and for each chapter we have an inner list of sections. We’ve got React Router `<NavLink>`s that add an `"active"` class when the URL matches the link path. And we use the `slugify()` helper to generate paths.

[`src/lib/helpers.js`](https://github.com/GraphQLGuide/guide/blob/4_1.0.0/src/lib/helpers.js)

```js
export const withHyphens = (string) => string.replace(/ /g, '-')

// generate paths of the form:
// `/Forward`
// `/Preface`
// `/1-Understanding-GraphQL-through-REST/1-Introduction`
export const slugify = (chapter, section) => {
  if (!section) {
    if (chapter.sections.length) {
      // default to the first section
      section = chapter.sections[0]
    } else {
      return '/' + withHyphens(chapter.title)
    }
  }

  const chapterSlug = chapter.number + '-' + withHyphens(chapter.title)
  const sectionSlug = section.number + '-' + withHyphens(section.title)
  return `/${chapterSlug}/${sectionSlug}`
}
```

Also, to get React Router working, we need to wrap our app in `<BrowserRouter>`:

[`src/index.js`](https://github.com/GraphQLGuide/guide/blob/4_1.0.0/src/index.js)

```js
import { BrowserRouter } from 'react-router-dom'

render(
  <BrowserRouter>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </BrowserRouter>,
  document.getElementById('root')
)
```

With all this JSX code, we’re starting to feel the best thing about GraphQL on the client side—that most of the coding is in the view instead of in data fetching. We don’t have a bunch of code for REST endpoint fetching and parsing and caching and passing; instead, we attach simple query strings to the components that need them, and we get the data in the props.

Now we should see the table of contents on the left side of the page, and we can click between sections and see the active links and path changing:

![Table of contents](../img/table-of-contents.png)

## Query variables

> If you’re jumping in here, `git checkout 4_1.0.0` (tag [`4_1.0.0`](https://github.com/GraphQLGuide/guide/tree/4_1.0.0)). Tag [`5_1.0.0`](https://github.com/GraphQLGuide/guide/tree/5_1.0.0) contains all the code written in this section.

Let’s fill in the book content next! Say we have a section ID, like `'intro'`—how do we get the content? Let’s look in [Playground](https://api.graphql.guide/play) to find the right query to make:

![Playground SCHEMA tab](../img/section-query-schema.png)
 
There’s a `section(id: String!)` query that returns a `Section` object, which has a `content` field. So let’s try it out:

![section query with results](../img/section-query-playground.png)
<!-- [Playground: `query { section(id: "intro") { content }}`](https://graphqlbin.com/pg8rs -->

Next we add the query to our component:

[`src/components/Section.js`](https://github.com/GraphQLGuide/guide/blob/5_1.0.0/src/components/Section.js)

```js
import { gql, useQuery } from '@apollo/client'

const SECTION_QUERY = gql`
  query SectionContent {
    section(id: "intro") {
      content
    }
  }
`

export default () => {
  const { data, loading } = useQuery(SECTION_QUERY)

  ...
```

Now `data.section` will have the same `content` string that we saw returned in Playground, and we can display it:

[`src/components/Section.js`](https://github.com/GraphQLGuide/guide/blob/5_1.0.0/src/components/Section.js)

```js
import get from 'lodash/get'

export default () => {
  const { data, loading } = useQuery(SECTION_QUERY)

  return (
    <section className="Section">
      <div className="Section-header-wrapper">
        <header className="Section-header">
          <h1>Title</h1>
          <h2>Subtitle</h2>
        </header>
      </div>
      <div className="Section-content">
        {loading ? <Skeleton count={7} /> : get(data, 'section.content')}
      </div>
    </section>
  )
}
```

We can read the book! 📖 But we’ve got a hard-coded section ID—let’s turn our `section(id: "intro")` argument into a variable:

[`src/components/Section.js`](https://github.com/GraphQLGuide/guide/blob/5_1.0.0/src/components/Section.js)

```js
const SECTION_QUERY = gql`
  query SectionContent($id: String!) {
    section(id: $id) {
      content
    }
  }
`

export default () => {
  const { data, loading } = useQuery(SECTION_QUERY, {
    variables: { id: 'intro' },
  })

  ...
```

- `query SectionContent($id: String!) {`: We declare at the top that the `SectionContent` query takes a variable `$id`, a required `String`.
- `section(id: $id) {`: We replace our string literal `"intro"` with the variable `$id`.
- `{ variables: { id: 'intro' } }`: We tell `useQuery()` to pass an `id` variable to the query.

Now passing the variable to the query is working, but we still have `'intro'` hard-coded. Where do we get the section ID from? Back in `TableOfContents`, we gave a `to` prop to our `NavLinks`:

```js
<NavLink
  to={{
    pathname: slugify(chapter, section),
    state: { chapter, section }
  }}
```

The `pathname` is the equivalent of an anchor tag’s `href` attribute, but `state` is part of the HTML5 [session history management](https://developer.mozilla.org/en-US/docs/Web/API/History_API#The_pushState()_method). We can access it at `window.location.state`, but we also want our components to react to changes, so we want it as a prop. The best way to use browser history state with `react-router` is with the [`useLocation` hook](https://reactrouter.com/web/api/Hooks/uselocation), which returns the `location` object, which has a `.state` property:

[`src/components/Section.js`](https://github.com/GraphQLGuide/guide/blob/5_1.0.0/src/components/Section.js)

```js
import { useLocation } from 'react-router'

export default () => {
  const {
    state: { section, chapter },
  } = useLocation()

  const { data, loading } = useQuery(SECTION_QUERY, {
    variables: { id: section.id },
  })

  ...
```

> If you get `TypeError: Cannot read property 'section' of undefined`, look ahead to the next section to see the solution.

Let’s fill in our component with our newly available data:

[`src/components/Section.js`](https://github.com/GraphQLGuide/guide/blob/5_1.0.0/src/components/Section.js)

```js
export default () => {
  const {
    state: { section, chapter },
  } = useLocation()

  const { data, loading } = useQuery(SECTION_QUERY, {
    variables: { id: section.id },
  })

  return (
    <section className="Section">
      <div className="Section-header-wrapper">
        <header className="Section-header">
          {chapter.number !== null ? (
            <div>
              <h1>{section.title}</h1>
              <h2>
                {'Chapter ' + chapter.number}
                <span className="Section-number-divider" />
                {'Section ' + section.number}
              </h2>
            </div>
          ) : (
            <h1>{chapter.title}</h1>
          )}
        </header>
      </div>
      <div className="Section-content">
        {loading ? <Skeleton count={7} /> : get(data, 'section.content')}
      </div>
    </section>
  )
}
```

We can see this working by clicking a different section in the table of contents. The path will change and a new `state` will be set, which `useLocation` will provide to the component, which provides a new `id` to `useQuery`, triggering a new query sent to the server, which will return the new section content, which triggers a re-render, during which the book content on the right updates. 

![Section content](../img/section-content.png)

## Variable query

> If you’re jumping in here, `git checkout 5_1.0.0` (tag [`5_1.0.0`](https://github.com/GraphQLGuide/guide/tree/5_1.0.0)). Tag [`6_1.0.0`](https://github.com/GraphQLGuide/guide/tree/6_1.0.0) contains all the code written in this section.

If you’ve kept your development browser tab open during this section, then everything has worked smoothly for you. But when we open a [new tab](http://localhost:3000/introduction), we find a bug:

`TypeError: Cannot read property 'section' of undefined`
```js
export default () => {
  const {
    state: { section, chapter },
  } = useLocation()
```

It looks like `location.state` is undefined! 🐞 Which makes sense, because in a new tab, we haven’t yet clicked a `<NavLink>`, so the state hasn’t been set. If we don’t have the state, how do we get the section ID so that we can query for the right content? The only information we have on first page load is the path, so we have to parse it. [`location.pathname`](https://reacttraining.com/react-router/web/api/location) will always be defined, so we can `deslugify()` it:

[`src/lib/helpers.js`](https://github.com/GraphQLGuide/guide/blob/6_1.0.0/src/lib/helpers.js)

```js
// parse a path:
// /Introduction
// -> { chapterTitle: 'Introduction' }
//
// /1-Understanding-GraphQL-through-REST/1-Introduction
// -> { chapterNumber: 1, sectionNumber: 1 }
export const deslugify = (path) => {
  const [, chapterSlug, sectionSlug] = path.split('/')
  const chapterIsNumbered = !!sectionSlug

  return chapterIsNumbered
    ? {
        chapterNumber: parseInt(chapterSlug.split('-')[0], 10),
        sectionNumber: parseInt(sectionSlug.split('-')[0], 10),
      }
    : { chapterTitle: chapterSlug }
}
```

Now let’s look at Playground to figure out which two queries we can use, given either the chapter title or the chapter and section numbers:

![chapterByTitle and Chapter.section(number: Int!)](../img/chapterByTitle-schema.png)

We can use the `chapterByTitle` and `chapterByNumber` root query fields along with a `Chapter`’s `section` field with a `number: Int!` argument. (Any field, not just root fields, can have arguments.)

[`src/components/Section.js`](https://github.com/GraphQLGuide/guide/blob/6_1.0.0/src/components/Section.js)

```js
const SECTION_BY_ID_QUERY = gql`
  query SectionContent($id: String!) {
    section(id: $id) {
      content
    }
  }
`

const SECTION_BY_CHAPTER_TITLE_QUERY = gql`
  query SectionByChapterTitle($title: String!) {
    chapterByTitle(title: $title) {
      title
      section(number: 1) {
        content
      }
    }
  }
`

const SECTION_BY_NUMBER_QUERY = gql`
  query SectionByChapterTitle($chapterNumber: Int!, $sectionNumber: Int!) {
    chapterByNumber(number: $chapterNumber) {
      number
      section(number: $sectionNumber) {
        number
        title
        content
      }
    }
  }
`
```

For `chapterByTitle`, all the non-numbered chapters only have a single section that is title-less. For `chapterByNumber`, we need the section title in addition to the contents, because we display it at the top of the component. 

In our component, we need to decide which query to use, depending on which scenario we’re in:

```js
export default () => {
  const { state, pathname } = useLocation()

  const page = deslugify(pathname)

  let query, variables

  if (state) {
    query = SECTION_BY_ID_QUERY
  } else if (page.chapterTitle) {
    query = SECTION_BY_CHAPTER_TITLE_QUERY
  } else {
    query = SECTION_BY_NUMBER_QUERY
  }

  const { data, loading } = useQuery(query, { variables })

  ...
```

If we have state, we can use the query we were using before, `SECTION_BY_ID_QUERY`. If we received a chapter title from `deslugify()`, we can use `SECTION_BY_CHAPTER_TITLE_QUERY`. Otherwise, we should have `page.chapterNumber` and `page.sectionNumber`, and we can use `SECTION_BY_NUMBER_QUERY`. 

Each of these queries takes different variables, so we decide those inside the if-statement: 

```js
export default () => {
  const { state, pathname } = useLocation()

  const page = deslugify(pathname)

  let query, variables

  if (state) {
    query = SECTION_BY_ID_QUERY 
    variables = { id: state.section.id }    
  } else if (page.chapterTitle) {
    query = SECTION_BY_CHAPTER_TITLE_QUERY
    variables = { title: page.chapterTitle }
  } else {
    query = SECTION_BY_NUMBER_QUERY
    variables = pick(page, 'chapterNumber', 'sectionNumber')
  }

  const { data, loading } = useQuery(query, { variables })

  ...
```

Now we have the correct `variables` for each query. However, the `data` we get back from each query is also different. So we construct `section` and `chapter` objects to use in our JSX:

```js
  const { data, loading } = useQuery(query, { variables })

  let section, chapter

  // eslint-disable-next-line default-case
  switch (query) {
    case SECTION_BY_ID_QUERY:
      section = {
        ...state.section,
        content: get(data, 'section.content'),
      }
      chapter = state.chapter
      break
    case SECTION_BY_CHAPTER_TITLE_QUERY:
      section = get(data, 'chapterByTitle.section')
      chapter = {
        ...get(data, 'chapterByTitle'),
        number: null,
      }
      break
    case SECTION_BY_NUMBER_QUERY:
      section = get(data, 'chapterByNumber.section')
      chapter = get(data, 'chapterByNumber')
      break
  }
```

`data` will have either a `section`, `chapterByTitle`, or `chapterByNumber` property, depending on which query was used. We disable the eslint rule requiring a default case because we know from our previous if-statement that there are only 3 possibilities. 

Now we can use `section` and `chapter` in our JSX:

```js
  let headerContent = null,
    sectionContent = null

  if (loading) {
    headerContent = (
      <h1>
        <Skeleton />
      </h1>
    )
    sectionContent = <Skeleton count={7} />
  } else if (!section) {
    headerContent = (
      <h1>
        <span role="img" aria-label="magnifying glass">
          🔍
        </span>{' '}
        404 page not found
      </h1>
    )
  } else {
    if (chapter.number !== null) {
      headerContent = (
        <div>
          <h1>{section.title}</h1>
          <h2>
            {'Chapter ' + chapter.number}
            <span className="Section-number-divider" />
            {'Section ' + section.number}
          </h2>
        </div>
      )
    } else {
      headerContent = <h1>{chapter.title}</h1>
    }

    sectionContent = section.content
  }

  return (
    <section className="Section">
      <div className="Section-header-wrapper">
        <header className="Section-header">{headerContent}</header>
      </div>
      <div className="Section-content">{sectionContent}</div>
    </section>
  )
```

All together, that’s:

[`src/components/Section.js`](https://github.com/GraphQLGuide/guide/blob/6_1.0.0/src/components/Section.js)

```js
import React from 'react'
import Skeleton from 'react-loading-skeleton'
import { gql, useQuery } from '@apollo/client'
import { useLocation } from 'react-router'
import get from 'lodash/get'
import pick from 'lodash/pick'

import { deslugify } from '../lib/helpers'

const SECTION_BY_ID_QUERY = gql`
  query SectionContent($id: String!) {
    section(id: $id) {
      content
    }
  }
`

const SECTION_BY_CHAPTER_TITLE_QUERY = gql`
  query SectionByChapterTitle($title: String!) {
    chapterByTitle(title: $title) {
      title
      section(number: 1) {
        content
      }
    }
  }
`

const SECTION_BY_NUMBER_QUERY = gql`
  query SectionByNumber($chapterNumber: Int!, $sectionNumber: Int!) {
    chapterByNumber(number: $chapterNumber) {
      number
      section(number: $sectionNumber) {
        number
        title
        content
      }
    }
  }
`

export default () => {
  const { state, pathname } = useLocation()

  const page = deslugify(pathname)

  let query, variables

  if (state) {
    query = SECTION_BY_ID_QUERY
    variables = { id: state.section.id }
  } else if (page.chapterTitle) {
    query = SECTION_BY_CHAPTER_TITLE_QUERY
    variables = { title: page.chapterTitle }
  } else {
    query = SECTION_BY_NUMBER_QUERY
    variables = pick(page, 'chapterNumber', 'sectionNumber')
  }

  const { data, loading } = useQuery(query, { variables })

  let section, chapter

  // eslint-disable-next-line default-case
  switch (query) {
    case SECTION_BY_ID_QUERY:
      section = {
        ...state.section,
        content: get(data, 'section.content'),
      }
      chapter = state.chapter
      break
    case SECTION_BY_CHAPTER_TITLE_QUERY:
      section = get(data, 'chapterByTitle.section')
      chapter = {
        ...get(data, 'chapterByTitle'),
        number: null,
      }
      break
    case SECTION_BY_NUMBER_QUERY:
      section = get(data, 'chapterByNumber.section')
      chapter = get(data, 'chapterByNumber')
      break
  }

  let headerContent = null,
    sectionContent = null

  if (loading) {
    headerContent = (
      <h1>
        <Skeleton />
      </h1>
    )
    sectionContent = <Skeleton count={7} />
  } else if (!section) {
    headerContent = (
      <h1>
        <span role="img" aria-label="magnifying glass">
          🔍
        </span>{' '}
        404 page not found
      </h1>
    )
  } else {
    if (chapter.number !== null) {
      headerContent = (
        <div>
          <h1>{section.title}</h1>
          <h2>
            {'Chapter ' + chapter.number}
            <span className="Section-number-divider" />
            {'Section ' + section.number}
          </h2>
        </div>
      )
    } else {
      headerContent = <h1>{chapter.title}</h1>
    }

    sectionContent = section.content
  }

  return (
    <section className="Section">
      <div className="Section-header-wrapper">
        <header className="Section-header">{headerContent}</header>
      </div>
      <div className="Section-content">{sectionContent}</div>
    </section>
  )
}
```

Now when we open [/introduction](http://localhost:3000/introduction) or [/1-Understanding-GraphQL-through-REST/1-Introduction](http://localhost:3000/1-Understanding-GraphQL-through-REST/1-Introduction) in new tabs, we get the right section content instead of an error! 🐞✅ 

In [Apollo devtools](../client/client-libraries.md#devtools), we can look at the active queries on the page, which will let us see which of our three section queries is being used:

![SectionContent](../img/SectionContent.png)

![SectionByNumber](../img/SectionByNumber.png)

The first image is from a tab in which we’ve been navigating with the table of contents, and it uses the `SectionContent` query. The second image is from a newly opened tab, and it uses `SectionByNumber`.

Lastly, let’s redirect from the root, which currently shows 404 and prints a GraphQL error to the console (we didn’t provide the `$chapterNumber` variable because there’s nothing in the URL to deslugify).

![404 page not found](../img/404-root.png)

So far, we haven’t defined any routes—`Section` just changes what data it shows based on the path. We can create a root route that redirects to `/Preface`:

[`src/components/App.js`](https://github.com/GraphQLGuide/guide/blob/6_1.0.0/src/components/App.js)

```js
import { Switch, Route, Redirect } from 'react-router'

const Book = () => (
  <div>
    <TableOfContents />
    <Section />
  </div>
)

export default () => (
  <div className="App">
    <header className="App-header">
      <StarCount />
      <img src={logo} className="App-logo" alt="logo" />
      <h1 className="App-title">The GraphQL Guide</h1>
    </header>
    <Switch>
      <Route exact path="/" render={() => <Redirect to="/Preface" />} />
      <Route component={Book} />
    </Switch>
  </div>
)
```

Assuming we always want to keep our header on the page regardless of which route we’re on, we put the `<Route>`s below the header in lieu of `<TableOfContents />` and `<Section />`, which we move to a new `Book` component. `<Switch>` renders the first `<Route>` that matches. The first route matches only `/` and redirects, and the second route matches everything else and displays `Book`. 

Now loading [`localhost:3000/`](http://localhost:3000/) redirects to `localhost:3000/Preface`, and the GraphQL error is gone from the console. 🐞✅

