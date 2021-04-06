---
title: Creating persisted queries
---

# Creating persisted queries

As we discussed in [Chapter 11: Server Dev > Extended topics > Performance](../server/extended-topics/performance.md), a persisted query is one that the server remembers the hash of. When the client sends an HTTP request with that hash, the server looks up the persisted query and executes it. In contrast to Apollo Server’s *automatic* persisting of arbitrary client queries, OneGraph allows for specific persisted queries that the graph owner (that’s us 😄) manually creates in their dashboard. In addition to the reduction in request size, their system has three benefits:

- **Auth**: We can attach an auth token, like the one we made in the [last section](writing-server-side-code.md), to a query, so that when a client sends the query hash, the server knows to use that private token during execution.
- **Caching**: We can set a custom TTL (number of seconds that the query result will be cached).
- **Variable safelisting**: We can list the specific variables that can be provided by the client, and provide the others ourselves.

Let’s take advantage of the auth feature. We can create a persisted query that returns the current number of active users on our website. This requires OAuth with our Google account, but we don’t want to give the public access to our entire Google Analytics account. With OneGraph, we can attach an auth token to our persisted query, and the client won’t know what the token is and won’t be able to make any queries using our token other than the current active users query.

We start out in the Data Explorer, and, looking at the root query fields, we see `google`, which has an `analytics` field. We want current data, so expand `realtimeApi`. OneGraph’s Google Analytics is in beta, and they haven’t converted all their REST APIs into a GraphQL schema, so we need to use the `makeRestCall` field. We can look at `get`’s type in the docs to see what arguments it takes:

![Google analytics query](../img/onegraph-google-analytics.png)

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

![Create persisted query form](../img/onegraph-create-persisted-query.png)


When successful, we see the query listed with its ID:

![“Your app’s persisted queries”](../img/onegraph-persisted-query.png)


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
