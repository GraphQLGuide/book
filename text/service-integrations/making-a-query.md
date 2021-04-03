---
title: Making a query
---

# Making a query

After [signing up](https://www.onegraph.com/) and creating an app in their [dashboard](https://www.onegraph.com/dashboard/), we can select “Data Explorer” on the left to see get a GraphiQL for our app’s API. Under the first Explorer column, we can see a root query field for each service that we can get data from. We can expand “stripe” to see what Stripe data we can fetch. Let’s select the most recent 10 charges and their `amount` and `receiptEmail`. The query is automatically written in the middle pane, and once we hit the “Authentication” button and go through Stripe OAuth, we can get the results on the right:

![OneGraph dashboard](../img/onegraph-dashboard.png)

> [onegraph.com/graphiql?shortenedId=6F4GB](https://www.onegraph.com/graphiql?shortenedId=6F4GB)

We can also generate code that runs this query. Let’s try clicking the “Code Exporter” button at the top, selecting “JavaScript”, “react-apollo”, and “Create CodeSandbox.” We’re taken to a CodeSandbox like [this one](https://codesandbox.io/s/onegraph-query-export-r7r7y), with the React and GraphQL code on the left backing the website on the right. To get our query working, we click the “Log in to stripe” button and complete the OAuth popup:

![CodeSandbox with Stripe OAuth popup](../img/onegraph-codesandbox-oauth.png)

Now we see our data displayed:

![CodeSandbox with Stripe data](../img/onegraph-codesandbox-data.png)

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

