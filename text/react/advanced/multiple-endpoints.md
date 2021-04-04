---
title: Multiple endpoints
description: Querying multiple GraphQL APIs from our React app
---

## Multiple endpoints

> If you’re jumping in here, `git checkout 25_1.0.0` (tag [`25_1.0.0`](https://github.com/GraphQLGuide/guide/tree/25_1.0.0)). Tag [`26_1.0.0`](https://github.com/GraphQLGuide/guide/tree/26_1.0.0) contains all the code written in this section.

So far, we’ve been working with a single GraphQL endpoint, `api.graphql.guide/graphql` (and its websocket counterpart, `/subscriptions`). Would we ever want our app to talk to another endpoint? Maybe. Similarly to the APIs in the [REST section](rest.md), we usually would want to proxy the other GraphQL endpoint through our GraphQL server (we’ll go over how to do this in the server chapter). There are two main reasons: 

- If the endpoint is authenticated, we usually will want to keep it private on our server.
- It’s nice for our GraphQL endpoint to have the complete graph of data our app might need, so that devs have one source of truth, and so that our server-side tools—including caching, logging, and analytics—cover all our queries.

However, there are cases in which we might not want to proxy: we might not have control over the backend, or maybe we want to reduce load on our server or get a slightly better latency than we would while proxying. So we need a GraphQL API from which to fetch some data for this section. Apollo GraphQL shares the name of NASA’s Apollo project, which landed the first humans on the moon in 1969. And Apollo GraphQL identifies with the rocket emoji 🚀. So let’s put that emoji somewhere and make it an easter egg—if it’s clicked, we’ll show the next SpaceX launch using the (unofficial) [SpaceX GraphQL API](https://github.com/spacexland/api).

So far, all our queries know what endpoint to talk to because of the `<ApolloProvider>` wrapped around the `<App>`:

`src/index.js`

```js
render(
  <BrowserRouter>
    <ApolloProvider client={apollo}>
      <MuiThemeProvider theme={theme}>
        <App />
      </MuiThemeProvider>
    </ApolloProvider>
  </BrowserRouter>,
  document.getElementById('root')
)
```

where `apollo` is the `ApolloClient` instance we created with an HTTP link to `api.graphql.guide/graphql`:

`src/lib/link.js`

```js
const httpLink = new HttpLink({
  uri: 'https://api.graphql.guide/graphql'
})
```

`src/lib/apollo.js`

```js
import link from './link'

export const apollo = new ApolloClient({ link, cache, typeDefs })
```

We’re going to need a second `ApolloClient` instance to use for our launch query:

[`src/lib/apollo.js`](https://github.com/GraphQLGuide/guide/blob/26_1.0.0/src/lib/apollo.js)

```js
import link, { spaceXLink } from './link'

export const apollo = new ApolloClient({ link, cache, typeDefs })

export const apolloSpace = new ApolloClient({
  link: spaceXLink,
  cache: new InMemoryCache(),
})
```

[`src/lib/link.js`](https://github.com/GraphQLGuide/guide/blob/26_1.0.0/src/lib/link.js)

```js
export const spaceXLink = ApolloLink.from([
  errorLink,
  new HttpLink({
    uri: 'https://api.spacex.land/graphql',
  }),
])
```

Now to use it, we can put it in the `client` option of `useQuery()`, which overrides its normal behavior of using the client provided by `<ApolloProvider>`.

```js
useQuery(LAUNCH_QUERY, { client: apolloSpace })
```

For building the `LAUNCH_QUERY`, let’s see what data is available from the API by browsing its GraphiQL: [api.spacex.land/graphql/](https://api.spacex.land/graphql/). From the available queries, it looks like the relevant one for us is `launchNext`, and we can pick a few fields to display:

![SpaceX GraphiQL with launchNext query](../../img/launch-next-query.png)

[`src/components/Profile.js`](https://github.com/GraphQLGuide/guide/blob/26_1.0.0/src/components/Profile.js)

```js
import { gql } from '@apollo/client'

const LAUNCH_QUERY = gql`
  query LaunchQuery {
    launchNext {
      details
      launch_date_utc
      launch_site {
        site_name
      }
      mission_name
      rocket {
        rocket_name
      }
    }
  }
`
```

Now we can use it—let’s put the 🚀 button on the bottom of `Profile`. Then we put the data from the response into a `<dl>`:

[`src/components/Profile.js`](https://github.com/GraphQLGuide/guide/blob/26_1.0.0/src/components/Profile.js)

```js
import React, { useState } from 'react'
import { gql, useQuery } from '@apollo/client'

import { apolloSpace } from '../lib/apollo'

const LAUNCH_QUERY = gql`...`

function Launch() {
  const { data, loading } = useQuery(LAUNCH_QUERY, {
    fetchPolicy: 'cache-and-network',
    client: apolloSpace,
    onCompleted: () =>
      window.scrollTo({ top: 1000, left: 0, behavior: 'smooth' }),
  })

  if (loading) {
    return <div className="Spinner" />
  }

  const {
    launchNext: { details, launch_date_utc, launch_site, mission_name, rocket },
  } = data

  return (
    <div>
      The next SpaceX launch will be:
      <dl>
        <dt>Date</dt>
        <dd>
          <code>{new Date(launch_date_utc).toString()}</code>
        </dd>

        <dt>Mission</dt>
        <dd>
          <code>{mission_name}</code>
        </dd>

        <dt>Rocket</dt>
        <dd>
          <code>{rocket.rocket_name}</code>
        </dd>

        <dt>Launch site</dt>
        <dd>
          <code>{launch_site.site_name}</code>
        </dd>

        <dt>Details</dt>
        <dd className="-non-code">{details}</dd>
      </dl>
    </div>
  )
}

export default () => {
  const { user, loggingIn } = useUser()
  const [showLaunch, setShowLaunch] = useState(false)
  
  ...

        <div className="Profile-footer">
          <button
            className="Profile-toggle-launch"
            onClick={() => setShowLaunch(!showLaunch)}
          >
            <span role="img" aria-label="rocket">
              🚀
            </span>
          </button>

          {showLaunch && <Launch />}
        </div>
      </main>
    )
  }
}
```

When the 🚀 button is clicked, the launch info appears below, but, depending on our screen height and browser settings, we might be at the bottom of the page already—in which case we won’t be able to see the info without scrolling. It would be nice UX to autoscroll down to show the info. `useQuery()` has an [`onCompleted` option](https://www.apollographql.com/docs/react/api/react/hooks/#params) that is called after the query results are provided to us and our component has re-rendered, so we can call `window.scrollTo` then.

We’re using `fetchPolicy: 'cache-and-network'` instead of the default `cache-first` to make sure we always have the latest results. If a user checked the next launch, left the browser open for a while, and checked back later, it’s possible that the launch we have in the cache will be old—either the launch already happened, or the plans changed. With `cache-and-network`, `useQuery()` will first provide us with the cache data, then send the request to the server, then provide us with the response data. However, something unexpected is now happening when we repeatedly toggle the launch info. Do you notice it?

Every time we show the launch info, it shows the loading spinner. As we learned in the last section, `loading` is true whenever there’s a network request in flight, even when there’s cached data available.
Let’s test whether there’s data instead of using `loading`:

```js
const {
  launchNext: {
    details,
    launch_date_utc,
    launch_site,
    mission_name,
    rocket,
  } = {},
} = data || {}

if (!details) {
  return <div className="Spinner" />
}
```

Now we’ll only see the spinner the first time.

We’re done! We can add more SpaceX data to different parts of our app by importing `apolloSpace` and using the `useQuery()` `client` option. And we can add more APIs by creating more `ApolloClient` instances.

