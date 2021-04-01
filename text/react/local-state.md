## Local state

Section contents:

* [Reactive variables](#reactive-variables)
* [In cache](#in-cache)

In most of the apps we build, the majority of our *state* (the data that backs our UI) is *remote state*—it comes from a server and is saved in a database. But some of our state doesn’t come from the server and isn’t stored in a database—it originates locally on the client and stays there. This type of data is called our *local state*. One example of local state is a user setting that for whatever reason we didn’t want to send to the server to persist. Another example is data from a device API: if we were making a navigation app, we would want to display the device’s location and speed. A simple solution would be to put the state in a variable, for instance `window.gps`:

```js
navigator.geolocation.watchPosition(position => {
  window.gps = position.coords
}
```

And then we’d reference that variable when we needed it. However, there are a couple of issues with this solution. One is that we’d like to be able to trigger view updates when the data changes. We could move it to a component’s `this.state`, but A) when the component is unmounted, we lose the data, and B) if we need the data in different places in the app, we’d have to pass it around as a prop a lot or use Context. The other issue is the lack of structure—with a large app and many developers, it gets hard to know what state is out there in variables scattered around the codebase, the data format of each variable, and how each should be modified. A popular solution that addresses both of these issues is [Redux](https://redux.js.org/), a library for maintaining global state. 

> *Global state* means state accessible from anywhere in your app, as opposed to *component state*, which is accessible as `this.state` inside the component in which it’s created, or as a prop if the data is passed to children. **Global vs component** state is tangential to **local vs remote** state. The former is about where on the client the state is kept, and the latter is about whether or not the data is stored on the server.

Redux provides a structure for reading and modifying data, and it re-renders components when the data changes. While Redux is great, Apollo has its own solution to local state which addresses the same issues. Choosing the system we’re already using for local state will make it simpler to implement and result in more understandable, concise code.

There are three ways to store local state with Apollo, and different ways to read it. We can store it in:

* [Reactive variables](#reactive-variables)
* [The Apollo cache](#in-cache)
* Anywhere else (for example `window` or `LocalStorage`)

Reactive variables can be read just by importing the variable into our code. The cache can be read with the cache methods [`cache.readQuery()`](https://www.apollographql.com/docs/react/caching/cache-interaction/#readquery) and [`cache.readFragment()`](https://www.apollographql.com/docs/react/caching/cache-interaction/#readfragment) or `useQuery()` by adding the `@client` [*directive*](../query-language/#directives) to our query:

```gql
query LocationQuery {
  gps @client {
    lat
    lng
  }
}
```

We can also use a field policy `read` function to supply `readyQuery/readFragment/useQuery` with any combination of data: reactive variables, cache data, LocalStorage, etc.

```js
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        amalgam: {
          read: (amalgam) => myReactiveVar() + localStorage.getItem('myString') + amalgam
        },
      },
    },
  },
})

const myReactiveVar = makeVar('Amal')
localStorage.setItem('myString', 'ga')
cache.modify({
  fields: { amalgam: () => 'don' },
})

const { data } = useQuery(gql`
  query ExampleLocalQuery { 
    amalgam @client 
  }
`)

console.log(data)
// { amalgam: 'Amalgadon' }
```

Our read function combines 3 strings: a Reactive variable, a LocalStorage value, and a string stored in the cache. Whenever the `amalgam` query is made with the `@client` directive, the function is run to produce the result, and no request is sent to the server.

### Reactive variables

> If you’re jumping in here, `git checkout 18_1.0.0` (tag [`18_1.0.0`](https://github.com/GraphQLGuide/guide/tree/18_1.0.0)). Tag [`19_1.0.0`](https://github.com/GraphQLGuide/guide/tree/19_1.0.0) contains all the code written in this section.

A [reactive variable](https://www.apollographql.com/docs/react/local-state/reactive-variables/) can store any type of data, and when we change its value, any code that depends on it *reacts* to the change: 

- Any `useQuery` hook that selects a field with a `read` function that uses a reactive var (like the example just before this section) will provide a new `data` object to the React component, which gets re-rendered.
- The `useReactiveVar` hook that we’ll use in this section also provides a new value to the component.

We create a reactive var with `makeVar(initialValue)`:

```js
import { makeVar } from '@apollo/client'

const lastRouteVar = makeVar('home')
```

`makeVar()` returns a function that we call without arguments to get the value, and we call with an argument to change the value:

```js
console.log(lastRouteVar())
// home

lastRouteVar('profile')
console.log(lastRouteVar())
// profile
```

A place in our app where a simple piece of local state would be useful is during login. Right now, our `useUser()` hook provides a `loggingIn` boolean that’s true when the `currentUser` query is `loading`. But it would be more accurate if `loggingIn` were true as soon as the user clicks the “Sign in” button. If we had a piece of state that was true while the user went through the Auth0 login process, then we could update `loggingIn` to be `loading || loginInProgress`. Let’s create a reactive variable for it:

[`src/lib/auth.js`](https://github.com/GraphQLGuide/guide/blob/19_1.0.0/src/lib/auth.js)

```js
import { makeVar } from '@apollo/client'

export const loginInProgressVar = makeVar(false)
```

And let’s set it to `true` during login:

```js
export const login = () => {
  loginInProgressVar(true)

  auth0Login({
    onCompleted: (e) => {
      loginInProgressVar(false)
      if (e) {
        console.error(e)
        return
      }

      apollo.reFetchObservableQueries()
    },
  })
}
```

Now we can use it in our `useUser()` hook:

[`src/lib/useUser.js`](https://github.com/GraphQLGuide/guide/blob/19_1.0.0/src/lib/useUser.js)

```js
import { useReactiveVar } from '@apollo/client'

import { loginInProgressVar } from './auth'

export function useUser() {
  const { data, loading } = useQuery(USER_QUERY)

  const loginInProgress = useReactiveVar(loginInProgressVar)

  return {
    user: data && data.currentUser,
    loggingIn: loading || loginInProgress,
  }
}
```

If we did `loggingIn: loading || loginInProgressVar()`, then the function wouldn’t be rerun when the var changed. So we use the `useReactiveVar()` hook instead.

Now it’s working—when we click the “Sign in” button, we can see the spinner while the Auth0 popup is open and before our `USER_QUERY` is sent 😊.

### In cache

> If you’re jumping in here, `git checkout 19_1.0.0` (tag [`19_1.0.0`](https://github.com/GraphQLGuide/guide/tree/19_1.0.0)). Tag [`20_1.0.0`](https://github.com/GraphQLGuide/guide/tree/20_1.0.0) contains all the code written in this section.

We can also store local state in the cache: we can add client-side root query fields, new objects, or new fields to existing objects. In this section, we’ll add a field to existing objects (`Section` objects) that were fetched from the server.

Currently, whenever we switch between sections, one of two things happens to our scroll position:

- If we don’t have the section content on the client, `scrollY` is set to 0 when the loading skeleton is displayed.
- If we do have the section content on the client, `scrollY` remains the same.

It would be nice for the user if, when switching back to a section they were previously reading, the scroll position updates to where they were. So let’s save their last position for each section in local state! While we could use [reactive variables](#reactive-variables), it will be easier to manage if the position is co-located with the section data. We can add a `scrollY` field to each `Section` object that’s been read. We write the field using [`writeFragment()`](https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.writeFragment):

```js
cache.writeFragment({
  id: `Section:${id}`,
  fragment: gql`
    fragment SectionScrollBy on Section {
      scrollY
    }
  `,
  data: {
    scrollY: 100,
  },
})
```

And we read it by adding the `scrollY` field to our queries:

[`src/components/Section.js`](https://github.com/GraphQLGuide/guide/blob/20_1.0.0/src/components/Section.js)

```js
const SECTION_BY_ID_QUERY = gql`
  query SectionContent($id: String!) {
    section(id: $id) {
      id
      content
      views
      scrollY @client
    }
  }
`

const SECTION_BY_CHAPTER_TITLE_QUERY = gql`
  query SectionByChapterTitle($title: String!) {
    chapterByTitle(title: $title) {
      title
      section(number: 1) {
        id
        content
        views
        scrollY @client
      }
    }
  }
`

const SECTION_BY_NUMBER_QUERY = gql`
  query SectionByNumber($chapterNumber: Int!, $sectionNumber: Int!) {
    chapterByNumber(number: $chapterNumber) {
      number
      section(number: $sectionNumber) {
        id
        number
        title
        content
        views
        scrollY @client
      }
    }
  }
`
```

We use the field in `useLayoutEffect()` to set the window’s scroll position to the saved position:

```js
const { data, loading } = useQuery(query, { variables })

const section = ...

const currentScrollY = get(section, 'scrollY')
useLayoutEffect(() => {
  if (currentScrollY === undefined || currentScrollY === window.scrollY) {
    return
  }

  window.scrollTo(0, currentScrollY)
}, [currentScrollY])
```

Lastly, we need to decide when to call `cache.writeFragment()` and save the scroll position. Let’s do it a second after the user stops scrolling (using [debounce()](https://lodash.com/docs/4.17.15#debounce)), provided they haven’t switched sections:

[`src/components/Section.js`](https://github.com/GraphQLGuide/guide/blob/20_1.0.0/src/components/Section.js)

```js
import debounce from 'lodash/debounce'

import { cache } from '../lib/apollo'

const updateScrollY = debounce((scrollY) => {
  const scrollHasChangedSinceLastEvent = scrollY !== window.scrollY
  const scrollNeedsToBeUpdated = scrollY !== section.scrollY

  if (scrollHasChangedSinceLastEvent || !scrollNeedsToBeUpdated) {
    return
  }

  cache.writeFragment({
    id: `Section:${id}`,
    fragment: gql`
      fragment SectionScrollBy on Section {
        scrollY
      }
    `,
    data: {
      scrollY,
    },
  })
}, 1000)

useLayoutEffect(() => {
  const onScroll = () => updateScrollY(window.scrollY)

  window.addEventListener('scroll', onScroll)
  return () => window.removeEventListener('scroll', onScroll)
}, [updateScrollY])
```

When the component mounts, we add the scroll listener, and on unmount, we remove the listener. For performance, we [debounce](https://css-tricks.com/the-difference-between-throttling-and-debouncing/) the listener (we prevent it from being called continuously, waiting until the user has stopped scrolling for a second). Then inside the listener, we call the mutation (first checking to make sure the `scrollY` has changed).

When we test it out, we get the message: `TypeError: Cannot read property 'toLocaleString' of undefined` referring to this line of `<Section>`:

```js
footerContent = `Viewed ${section.views.toLocaleString()} times`
```

`section` is undefined because the `data` returned from `useQuery()` is undefined. Apollo returns undefined `data` when it can’t read an `@client` field. So we need to provide a default value:

[`src/lib/apollo.js`](https://github.com/GraphQLGuide/guide/blob/20_1.0.0/src/lib/apollo.js)

```js
export const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        reviews: { ... }
      },
    },
    Section: {
      fields: {
        scrollY: (scrollY) => scrollY || 0,
      },
    },
  },
})
```

It now works! When we scroll, wait a second, go to another section, and go back, our scroll position is restored. And we can see the new `scrollY` property in the devtools cache:

![Section:preface in the cache with a scrollY field](../img/scrollY-in-cache.png)

If we want to document our new ability to query `Section.scrollY` (for our teammates or forgetful future selves 🤗), we can add a client-side schema:

[`src/lib/apollo.js`](https://github.com/GraphQLGuide/guide/blob/20_1.0.0/src/lib/apollo.js)

```js
import { gql } from '@apollo/client'

const typeDefs = gql`
  extend type Section {
    scrollY: Int
  }
`

export const apollo = new ApolloClient({ link, cache, typeDefs })
```

Now `scrollY` is included in devtools GraphiQL schema Docs:

![scrollY added to the devtools GraphiQL Docs](../img/apollo-devtools-docs-scrollY.png)

