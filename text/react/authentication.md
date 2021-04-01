# Authentication

Section contents:

* [Logging in](#logging-in)
* [Resetting](#resetting)

## Logging in

Background: [Authentication](../background/authentication.md)

> If you’re jumping in here, `git checkout 6_1.0.0` (tag [`6_1.0.0`](https://github.com/GraphQLGuide/guide/tree/6_1.0.0)). Tag [`7_1.0.0`](https://github.com/GraphQLGuide/guide/tree/7_1.0.0) contains all the code written in this section.

We’ll have noticed by now that we’re not getting the entire section content from the Guide API, and that’s because we’re not logged in. When we bought the book, we created a user account that was associated with our purchase. In order to see the full content, we need to log in with that account.

Authentication is important and complex enough that we rarely want to code it ourselves—we probably should use a library or service. For node backends, the most common library is [passport](http://www.passportjs.org/). We’ll instead use a service—[Auth0](https://auth0.com/)—for ease of integration. There are pros and cons to [signed tokens vs. sessions](../background/authentication.md#tokens-vs-sessions) and [localStorage vs. cookies](../background/authentication.md#localstorage-vs-cookies), but we’ll go with the most straightforward option for Auth0 integration: tokens stored in localStorage. They have a number of authentication methods (called "Connections" in Auth0 or "strategies" in Passport), including email/password, [passwordless](https://auth0.com/passwordless) (SMS one-time codes, email magic login links, and/or TouchID), and Social OAuth providers. While Auth0 makes it easy to provide multiple options, for simplicity’s sake, we’ll just provide GitHub OAuth—all of our users are developers, and they’re likely already logged into their GitHub account on most of their browsers, so the login process should be really easy. If we were building for a different market, we might prefer passwordless instead.

A common login sequence is this: the user clicks a login button, which redirects them to the GitHub OAuth page, and after they do GitHub login (if needed), they authorize our app and are redirected back to our site. One UX drawback of this sequence is that at the end, the user has to wait for our site to load, and without some work, they won’t be taken to the exact page and scroll position they were at before. A good alternative is to open a popup (or a new tab on mobile) where the user can do the GitHub steps. When they’re done authorizing, the popup closes and returns the signed token to the app. Then we’ll include that token in our requests to the server so the server will know who the user is.

Let’s think about what UI elements we want related to the login and the user. We can put a login link on the right side of the header, which will open the GitHub popup. Once the user is logged in, we can show their GitHub profile photo and name in place of the login link, and if they click their name, we can take them to a new `/me` route that shows them their profile. For all of this, we’ll need some data and functions—the user data, whether the user data is loading, and login and logout functions. We need it in a couple of different places in the app—in the header and in a route. There are a few different ways to get information to any place in the app—one is to render an `<AppContainer>` instead of `<App>` in `index.js`:

```js
render(
  <BrowserRouter>
    <ApolloProvider client={client}>
      <AppContainer />
    </ApolloProvider>
  </BrowserRouter>,
  document.getElementById('root')
)
```

And then the `<AppContainer>` fetches the current user object from the server and passes it to `<App>` along with login/logout functions and a `loggingIn` prop that indicates whether the app is in the process of logging the user in:

```js
const AppContainer = () => {
  ...

  return (
    <App
      user={user}
      login={this.login}
      logout={this.logout}
      loggingIn={loading}
    />
  )
}
```

Then `<App>` in turn passes the props down the component tree to children and grandchildren who need them. The main benefit to this method is that it’s easy to test, because it’s simple to mock out props. However, in all but the smallest apps, it results in a lot of *prop drilling* (passing props down to a component’s children’s children’s ... children). That can get tiresome and clutter our JSX. Instead, let’s export `login()` and `logout()` from a helper file and create a custom hook that provides `user` and `loggingIn`. Then, inside components that deal with the user, we can import and use `login()`, `logout()`, and `useUser()`.

Let’s add the current user’s name and photo to our header, and let’s add a route for a profile page:

[`src/components/App.js`](https://github.com/GraphQLGuide/guide/blob/7_1.0.0/src/components/App.js)

```js
import { Link } from 'react-router-dom'

import CurrentUser from './CurrentUser'
import Profile from './Profile'

export default () => (
  <div className="App">
    <header className="App-header">
      <StarCount />
      <Link className="App-home-link" to="/">
        <img src={logo} className="App-logo" alt="logo" />
        <h1 className="App-title">The GraphQL Guide</h1>
      </Link>
      <CurrentUser />
    </header>
    <Switch>
      <Route exact path="/" render={() => <Redirect to="/Preface" />} />
      <Route exact path="/me" component={Profile} />
      <Route component={Book} />
    </Switch>
  </div>
)
```

We call the header component `<CurrentUser>` because that’s what it will usually be displaying (it will sometimes instead have a "Sign in" button or a spinner). We need a way for the user to navigate from `/me` to the rest of the app, so we wrap the header image and title in a `<Link>` to the root `/`. Later we’ll get to the hook (`lib/useUser.js`) and the login/logout functions (`lib/auth.js`), but, for now, let’s assume they work and write `<CurrentUser>`:

[`src/components/CurrentUser.js`](https://github.com/GraphQLGuide/guide/blob/7_1.0.0/src/components/CurrentUser.js)

```js
import React from 'react'
import { Link } from 'react-router-dom'

import { useUser } from '../lib/useUser'
import { login } from '../lib/auth'

export default () => {
  const { user, loggingIn } = useUser()

  let content

  if (loggingIn) {
    content = <div className="Spinner" />
  } else if (!user) {
    content = <button onClick={login}>Sign in</button>
  } else {
    content = (
      <Link to="/me" className="User">
        <img src={user.photo} alt={user.firstName} />
        {user.firstName}
      </Link>
    )
  }

  return <div className="CurrentUser">{content}</div>
}
```

This one is straightforward to read. If there’s no user and the user isn’t being loaded, then we have a “Sign in” button that calls `login()`.

Similarly, in `<Profile>`, we might show a loading spinner or a login button. Otherwise, we show the user’s details and a “Sign out” button:

[`src/components/Profile.js`](https://github.com/GraphQLGuide/guide/blob/7_1.0.0/src/components/Profile.js)

```js
import React from 'react'

import { useUser } from '../lib/useUser'
import { login, logout } from '../lib/auth'

export default () => {
  const { user, loggingIn } = useUser()

  if (loggingIn) {
    return (
      <main className="Profile">
        <div className="Spinner" />
      </main>
    )
  } else if (!user) {
    return (
      <main className="Profile">
        <button onClick={login} className="Profile-login">
          Sign in
        </button>
      </main>
    )
  } else {
    return (
      <main className="Profile">
        <div className="Profile-header-wrapper">
          <header className="Profile-header">
            <h1>{user.name}</h1>
          </header>
        </div>
        <div className="Profile-content">
          <dl>
            <dt>Email</dt>
            <dd>
              <code>{user.email}</code>
            </dd>

            <dt>Membership level</dt>
            <dd>
              <code>{user.hasPurchased || 'GUEST'}</code>
            </dd>

            <dt>OAuth Github account</dt>
            <dd>
              <a
                href="https://github.com/settings/applications"
                target="_blank"
                rel="noopener noreferrer"
              >
                <code>{user.username}</code>
              </a>
            </dd>
          </dl>

          <button className="Profile-logout" onClick={logout}>
            Sign out
          </button>
        </div>
      </main>
    )
  }
}
```

And now to write our authentication logic! First, we need to set up the Auth0 client:

[`src/lib/auth.js`](https://github.com/GraphQLGuide/guide/blob/7_1.0.0/src/lib/auth.js)

```js
import auth0 from 'auth0-js'
import {
  initAuthHelpers,
  login as auth0Login,
  logout as auth0Logout,
} from 'auth0-helpers'

const client = new auth0.WebAuth({
  domain: 'graphql.auth0.com',
  clientID: '8fErnZoF3hbzQ2AbMYu5xcS0aVNzQ0PC',
  responseType: 'token',
  audience: 'https://api.graphql.guide',
  scope: 'openid profile guide',
})

initAuthHelpers({
  client,
  usePopup: true,
  authOptions: {
    connection: 'github',
    owp: true,
    popupOptions: { height: 623 }, // make tall enough for content
  },
  checkSessionOptions: {
    redirect_uri: window.location.origin,
  },
  onError: (e) => console.error(e),
})
```

Here we’re just following the docs for [`auth0-js`](https://www.npmjs.com/package/auth0-js) and [`auth0-helpers`](https://www.npmjs.com/package/auth0-helpers). Now `auth0Login()` and `auth0Logout()` should be configured to work with the Guide’s Auth0 account system, and we can use them:

[`src/lib/auth.js`](https://github.com/GraphQLGuide/guide/blob/7_1.0.0/src/lib/auth.js)

```js
export const login = () => {
  auth0Login({
    onCompleted: (e) => {
      if (e) {
        console.error(e)
        return
      }
    },
  })
}

export const logout = () => {
  auth0Logout()
}
```

You might be wondering, "But what do the login and logout functions actually do?" `auth0Login()` opens the GitHub auth popup, and saves the resulting token in localStorage. `auth0Logout()` removes the token from localStorage and ends our session with the Auth0 server. The next step is actually using the token—whenever we communicate with the server, we need to provide it. There’s an Apollo Link called [`setContext`](https://www.apollographql.com/docs/link/links/context/) that lets us set headers on HTTP requests, and we’ll use it to add an `authorization` header with the token. While we’re at it, let’s move our Apollo client creation out to another file:

[`src/index.js`](https://github.com/GraphQLGuide/guide/blob/7_1.0.0/src/index.js)

```js
import { apollo } from './lib/apollo'

render(
  <BrowserRouter>
    <ApolloProvider client={apollo}>
      <App />
    </ApolloProvider>
  </BrowserRouter>,
  document.getElementById('root')
)
```

[`src/lib/apollo.js`](https://github.com/GraphQLGuide/guide/blob/7_1.0.0/src/lib/apollo.js)

```js
import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client'
import { WebSocketLink } from '@apollo/client/link/ws'
import { setContext } from '@apollo/client/link/context'
import { getMainDefinition } from '@apollo/client/utilities'
import { getAuthToken } from 'auth0-helpers'

const httpLink = new HttpLink({
  uri: 'https://api.graphql.guide/graphql',
})

const authLink = setContext(async (_, { headers }) => {
  const token = await getAuthToken({
    doLoginIfTokenExpired: true,
  })

  if (token) {
    return {
      headers: {
        ...headers,
        authorization: `Bearer ${token}`,
      },
    }
  } else {
    return { headers }
  }
})

const authedHttpLink = authLink.concat(httpLink)

const wsLink = new WebSocketLink({
  uri: `wss://api.graphql.guide/subscriptions`,
  options: {
    reconnect: true,
  },
})

const link = split(
  ({ query }) => {
    const { kind, operation } = getMainDefinition(query)
    return kind === 'OperationDefinition' && operation === 'subscription'
  },
  wsLink,
  authedHttpLink
)

const cache = new InMemoryCache()

export const apollo = new ApolloClient({ link, cache })
```

We get the token from `auth0-helpers` using `getAuthToken()`, which either looks it up in localStorage, or if it has expired, opens the GitHub auth popup again. We use [`concat()`](https://www.apollographql.com/docs/link/composition.html#additive) to combine our new `authLink` with the `httpLink`—now when our Apollo client sends out a new query or mutation, it will first go through `authLink`, which will set the header, and then through `httpLink`, which will put it in an HTTP request and send it to the server.

The last piece is to make an HOC that provides the current user’s data:

[`src/lib/useUser.js`](https://github.com/GraphQLGuide/guide/blob/7_1.0.0/src/lib/useUser.js)

```js
import { gql, useQuery } from '@apollo/client'

export const USER_QUERY = gql`
  query UserQuery {
    currentUser {
      id
      firstName
      name
      username
      email
      photo
      hasPurchased
    }
  }
`

export function useUser() {
  const { data, loading } = useQuery(USER_QUERY)

  return {
    user: data && data.currentUser,
    loggingIn: loading,
  }
}
```

We can now try logging in with our Github account. Clicking “Sign in” opens the popup, and after we go through the OAuth dialog, the popup closes. But then nothing else happens. The “Sign in” link is still there, which means `useUser()` is still providing `user: null` to `<CurrentUser>`. If we reload, it’ll show us logged in, but we don’t want to have to reload, of course. This issue will be solved in the next section.

## Resetting

> If you’re jumping in here, `git checkout 7_1.0.0` (tag [`7_1.0.0`](https://github.com/GraphQLGuide/guide/tree/7_1.0.0)). Tag [`8_1.0.0`](https://github.com/GraphQLGuide/guide/tree/8_1.0.0) contains all the code written in this section.

Because the auth token is included in every request, the server will know who we are for any other queries and mutations we send, like the ones for the section content. So our server should recognize that we have purchased a Guide package and return the full content to the sections that are included in our package. But after we log in, the section content is still cut off like it was before. Why is that? Because the section content queries haven’t been refetched! We’re still showing the old data fetched when we were logged out. Now what do we do?

Apollo does have a [refetch()](https://www.apollographql.com/docs/react/api/react/hooks/#result) function that we get along with a query’s results. It would be a pain to use on our section queries because: A) there are 3 of them, and B) we’d have to figure out how to call the `refetch()` functions (which would be inside `Section.js`) from `auth.js`. So let’s take a different path—telling Apollo to refetch all the queries in the app. Apollo has a `reFetchObservableQueries()` function, which takes all the *observable queries* (queries used in a `useQuery()` hook) and re-sends them to the server. Let’s call that:

[`src/lib/auth.js`](https://github.com/GraphQLGuide/guide/blob/8_1.0.0/src/lib/auth.js)

```js
import { apollo } from './apollo'

export const login = () => {
  auth0Login({
    onCompleted: e => {
      if (e) {
        console.error(e)
        return
      }

      apollo.reFetchObservableQueries()
    },
  })
}
```

Now we’ve got login working. But let’s take a minute to think about query efficiency. We have `useUser()` in two components right now, and when we load `/me`, they’re both on the page. But if we look in our network tab, we only see `UserQuery` sent to the server once! This is an example of Apollo’s automatic [query deduplication](https://www.apollographql.com/docs/link/links/dedup/#context)—when we ask it to make the same query twice, it’s smart enough to only send it once and give the result to both components. However, whenever we render new components that use `useUser()` (for instance, when we navigate from `/Preface` to `/me`), it’s treated as a separate query and not deduplicated. But we don’t need to re-send it to the server—the user’s name, photo, etc. isn’t likely to change. Luckily, the query isn’t re-sent to the server! The default [fetchPolicy](https://www.apollographql.com/docs/react/data/queries/#configuring-fetch-logic) for queries is `cache-first`, which means if the query result is already in the cache, Apollo loads the data from the cache. If we were dealing with a type of data that was more likely to change, we could set the `fetchPolicy` to `cache-and-network`, which first loads data from the cache, but at the same time sends the query to the server, and will update the component if the server result is different from the cache result. We would set `fetchPolicy` like this:

```js
const { data, loading } = useQuery(USER_QUERY, {
  fetchPolicy: 'cache-and-network',
})
```

Our queries update on login, but what about logout? There may be private data in the cache, so the method we want is [`resetStore()`](https://www.apollographql.com/docs/react/api/apollo-client.html#ApolloClient.resetStore), which first clears the cache (a.k.a. store) and then refetches observable queries:

[`src/lib/auth.js`](https://github.com/GraphQLGuide/guide/blob/8_1.0.0/src/lib/auth.js)

```js
export const logout = () => {
  auth0Logout()
  apollo.resetStore()
}
```

Now when we log in and out, the full section content should appear and disappear. 

> If we knew what the private data was, we could alternatively delete only that data. For instance if the only private data was under `Query.currentUser`, we could do:

```js
export const logout = () => {
  auth0Logout()
  apollo.cache.evict({ fieldName: 'currentUser' })
  apollo.cache.gc()
}
```

