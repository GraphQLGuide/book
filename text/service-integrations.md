# Stripe and Service Integrations

Chapter contents:

* [Making a query](service-integrations.md#making-a-query)
* [Writing server-side code](service-integrations.md#writing-server-side-code)
* [Creating persisted queries](service-integrations.md#creating-persisted-queries)

---

Background: [Authentication](bg.md#authentication)

In this chapter, we’ll learn how to integrate with 3rd party services like Stripe using [OneGraph](https://www.onegraph.com/). 

> For those seeing “Stripe integration” and looking for how to accept payments in your app, we won’t be covering that in this chapter. We recommend the [Stripe Checkout tutorial](https://stripe.com/docs/checkout/integration-builder), where the only change you’ll need to make to it is using GraphQL instead of REST! 😄 So the basic process is:

- On the server, define a mutation like `createCheckoutSession(cart: Cart): ID`.
- On the client, when the checkout button is clicked, first send the mutation to the server to get the checkout session ID, and then call `stripe.redirectToCheckout({ sessionId })`.

OneGraph is a single GraphQL endpoint that brings together many different SaaS APIs like Stripe, Salesforce, Zendesk, Twitter, and Clearbit. (51 at time of writing!) Instead of coding with many different libraries, REST APIs, and auth systems, we can talk to a single GraphQL API with a single auth token.

# Making a query

After [signing up](https://www.onegraph.com/) and creating an app in their [dashboard](https://www.onegraph.com/dashboard/), we can select “Data Explorer” on the left to see get a GraphiQL for our app’s API. Under the first Explorer column, we can see a root query field for each service that we can get data from. We can expand “stripe” to see what Stripe data we can fetch. Let’s select the most recent 10 charges and their `amount` and `receiptEmail`. The query is automatically written in the middle pane, and once we hit the “Authentication” button and go through Stripe OAuth, we can get the results on the right:

![OneGraph dashboard](img/onegraph-dashboard.png)

> [onegraph.com/graphiql?shortenedId=6F4GB](https://www.onegraph.com/graphiql?shortenedId=6F4GB)

We can also generate code that runs this query. Let’s try clicking the “Code Exporter” button at the top, selecting “JavaScript”, “react-apollo”, and “Create CodeSandbox.” We’re taken to a CodeSandbox like [this one](https://codesandbox.io/s/onegraph-query-export-r7r7y), with the React and GraphQL code on the left backing the website on the right. To get our query working, we click the “Log in to stripe” button and complete the OAuth popup:

![CodeSandbox with Stripe OAuth popup](img/onegraph-codesandbox-oauth.png)

Now we see our data displayed:

![CodeSandbox with Stripe data](img/onegraph-codesandbox-data.png)

Anyone else could use our app to look at the most recent charges in their Stripe account. The main parts of the generated code are:

```js
import React from "react";
import ReactDOM from "react-dom";
import { useQuery, ApolloProvider, InMemoryCache, gql } from "@apollo/client";

import OneGraphApolloClient from "onegraph-apollo-client";
import OneGraphAuth from "onegraph-auth";

const auth = new OneGraphAuth({
  appId: APP_ID
});

const apolloClient = new OneGraphApolloClient({
  cache: new InMemoryCache(),
  oneGraphAuth: auth
});

const MY_QUERY = gql`
  query MyQuery {
    stripe {
      charges(first: 10) {
        nodes {
          amount
          receiptEmail
        }
      }
    }
  }
`;

const MyQuery = (props) => { ... }

const container = (
  <ApolloProvider client={apolloClient}>
    <MyQuery />
  </ApolloProvider>
);

ReactDOM.render(container, document.getElementById("root"));
```

It sets up an instance of OneGraph’s version of Apollo Client and uses `MyQuery` to fetch the data from our API.

# Writing server-side code

While the above frontend example works when the user of our app has their own Stripe account, we may want our users to be able to see data from our Stripe account. In that case, we need to create a server-side token that’s connected to our Stripe OAuth, and then use that token to either create a persisted query or make queries from our server. We’ll do the latter in this section and create a persisted query in [the next](service-integrations.md#creating-persisted-queries).

We can create server “Personal tokens” in the “Authentication” tab of the [dashboard](https://www.onegraph.com/dashboard/) and add one or more services to it. We’ll add Stripe to it, and then copy the token. To test our token, we can use curl. Back in our dashboard’s “Data Explorer” tab, we select “Code Exporter” and “curl” to get:

```sh
$ curl 'https://serve.onegraph.com/graphql?app_id=1c2b2872-c502-4986-b90f-0bfd0e8ddb73' \
--compressed \
-X POST \
-H "Content-Type: application/json" \
-H "Accept: application/json" \
-H "Accept-Encoding: gzip, deflate" \
--data '{
  "query": "query MyQuery { stripe { charges(first: 10) { nodes { amount receiptEmail } } } }",
  "variables": null,
  "operationName": "MyQuery"
}'
```

When we run this with ` | jq` added to the last line (`brew install jq` if you don’t have this JSON formatting tool installed), we get:

```json
{
  "errors": [
    {
      "message": "Missing auth for Stripe. Please reauthenticate.",
      "path": [
        "stripe",
        "charges"
      ],
      "extensions": {
        "service": "stripe",
        "type": "auth/missing-auth",
        "traceId": "d14ff658-027d-4fc8-be6f-7c3a327325d0"
      }
    }
  ],
  "data": {
    "stripe": {
      "charges": null
    }
  }
}
```

We can add our OneGraph token as a header, and then OneGraph will use our Stripe auth.

```sh
$ curl 'https://serve.onegraph.com/graphql?app_id=1c2b2872-c502-4986-b90f-0bfd0e8ddb73' \
--compressed \
-X POST \
-H "Content-Type: application/json" \
-H "Accept: application/json" \
-H "Accept-Encoding: gzip, deflate" \
-H "Authorization: Bearer xxx" \
--data '{
  "query": "query MyQuery { stripe { charges(first: 10) { nodes { amount receiptEmail } } } }",
  "variables": null,
  "operationName": "MyQuery"
}' | jq
```

After adding the line `-H "Authorization: Bearer xxx" \`, we get a response:

```
{
  "data": {
    "stripe": {
      "charges": {
        "nodes": [
          {
            "amount": 3900,
            "receiptEmail": "loren@graphql.guide"
          },
          {
            "amount": 8900,
            "receiptEmail": "john@graphql.guide"
          }, 
          ...
        ]
      }
    }
  }
}
```

We can put this query in code using the [graphql-request](https://github.com/prisma-labs/graphql-request) library we used in [Chapter 11 > Subscriptions > githubStars]([githubStars](11.md#githubstars)).

`server.js`

```js
import { GraphQLClient, gql } from 'graphql-request'

const ONEGRAPH_API =
  'https://serve.onegraph.com/graphql?app_id=1c2b2872-c502-4986-b90f-0bfd0e8ddb73'
const AUTH_TOKEN = '...'

const onegraphClient = new GraphQLClient(ONEGRAPH_API, {
  headers: {
    authorization: `Bearer ${AUTH_TOKEN}`,
  },
})

const query = gql`
  query MyQuery {
    stripe {
      charges(first: 10) {
        nodes {
          amount
          receiptEmail
        }
      }
    }
  }
`

onegraphClient
  .request(query)
  .then((data) => console.log(JSON.stringify(data, undefined, 2)))
```

This can be run with `node server.js` inside a directory with `graphql-request` and `graphql` installed, `"type": "module"` in the `package.json`, node version 14, and a valid `AUTH_TOKEN`.

We can add more services to our auth token, and then we can fetch more data with `MyQuery` or other query documents, reusing `onegraphClient`. For instance, we could take the `receiptEmail`s, give them to `{ clearbit { enrich(email: $email) } }` to get that person’s Twitter or company, and sort our customers by number of Twitter followers or size of their company.

# Creating persisted queries

As we discussed in [Chapter 11: Server Dev > Extended topics > Performance](11.md#performance), a persisted query is one that the server remembers the hash of. When the client sends an HTTP request with that hash, the server looks up the persisted query and executes it. In contrast to Apollo Server’s *automatic* persisting of arbitrary client queries, OneGraph allows for specific persisted queries that the graph owner (that’s us 😄) manually creates in their dashboard. In addition to the reduction in request size, their system has three benefits:

- **Auth**: We can attach an auth token, like the one we made in the [last section](service-integrations.md#writing-server-side-code), to a query, so that when a client sends the query hash, the server knows to use that private token during execution.
- **Caching**: We can set a custom TTL (number of seconds that the query result will be cached).
- **Variable safelisting**: We can list the specific variables that can be provided by the client, and provide the others ourselves.

Let’s take advantage of the auth feature. We can create a persisted query that returns the current number of active users on our website. This requires OAuth with our Google account, but we don’t want to give the public access to our entire Google Analytics account. With OneGraph, we can attach an auth token to our persisted query, and the client won’t know what the token is and won’t be able to make any queries using our token other than the current active users query.

We start out in the Data Explorer, and, looking at the root query fields, we see `google`, which has an `analytics` field. We want current data, so expand `realtimeApi`. OneGraph’s Google Analytics is in beta, and they haven’t converted all their REST APIs into a GraphQL schema, so we need to use the `makeRestCall` field. We can look at `get`’s type in the docs to see what arguments it takes:

![Google analytics query](img/onegraph-google-analytics.png)

For the path and query, we’ll need to look at their [API documentation](https://developers.google.com/analytics/devguides/reporting/realtime/v3/reference/data/realtime/get), which gives the path (`/data/realtime`) and the query parameters (`ids` and `metrics`). For the ID, we use `ga:<View id>`, and we find the View’s ID under Analytics accounts -> Properties & Apps -> Views -> All Web Site Data.

All together, that’s:

```gql
query MyQuery {
  google {
    analytics {
      realtimeApi {
        makeRestCall {
          get(
            path: "/data/realtime"
            query: [
              ["ids", "ga:146232901"]
              ["metrics", "rt:activeUsers"]
            ]
          ) {
            jsonBody
          }
        }
      }
    }
  }
}
```

When we execute the query for the first time, it returns an auth error, and the “Log in to Google Analytics (beta)” button appears at the top. After we go through the OAuth dialog and re-execute, we get the response, which includes `"rt:activeUsers": "1"` at the bottom.

Now that we have our query, we need a server auth token for our persisted query to use. As we did with the server-side Stripe token, we go to Auth services -> Server-side -> Your Personal Tokens -> Create Token called “google-analytics” and add the Google Analytics service to it. Then we: 

- Copy and paste our query into the “Persisted Queries” tab on the left.
- Select the “google-analytics” auth token.
- Enter a cache TTL. We can use 1 second in this case so that clients get up-to-date results.
- We don’t have any variables in this query, so we don’t need to add any safelisted or fixed variables.
- Hit the “Create” button.

![Create persisted query form](img/onegraph-create-persisted-query.png)


When successful, we see the query listed with its ID:

![“Your app’s persisted queries”](img/onegraph-persisted-query.png)


The client puts the ID in the body of the request:

`curl -X POST https://serve.onegraph.com/graphql?app_id=1c2b2872-c502-4986-b90f-0bfd0e8ddb73 --data '{"doc_id": "27e6292b-21cb-4de3-8450-a5431200d096"}'`

We can use `jq`’s filtering (`man jq`) to extract from the response the specific piece of data we’re looking for:

```sh
$ curl -X POST https://serve.onegraph.com/graphql?app_id=1c2b2872-c502-4986-b90f-0bfd0e8ddb73 --data '{"doc_id": "27e6292b-21cb-4de3-8450-a5431200d096"}' | jq '.data.google.analytics.realtimeApi.makeRestCall.get.jsonBody.totalsForAllResults'
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   836  100   786  100    50   1875    119 --:--:-- --:--:-- --:--:--  1995
{
  "rt:activeUsers": "0"
}
```

We can now publish this request, and anyone can make this query! 💃
