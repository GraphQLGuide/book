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

We can put this query in code using the [graphql-request](https://github.com/prisma-labs/graphql-request) library we used in [Chapter 11 > Subscriptions > githubStars]([githubStars](../server/#githubstars)).

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

