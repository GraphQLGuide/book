### Managed federation

As we’ve been running the gateway, we’ve been seeing the output:

```
        * Mode: unmanaged
```

The default gateway mode is unmanaged. A gateway is *managed* when it’s connected to Apollo Studio, the SaaS tool we’ve used previously for [Analytics](../server/production/analytics.md) and [Schema validation](../server/extended-topics/schema-validation.md). `ApolloGateway` will connect to Apollo Studio if we set `APOLLO_KEY` and make one change to the code—remove the `serviceList` argument in the constructor:

`gateway.js`

```js
const gateway = new ApolloGateway({
  serviceList: [
    { name: 'users', url: 'http://localhost:4001/graphql' },
    { name: 'reviews', url: 'http://localhost:4002/graphql' }
  ],
  buildService({ url }) {
    return new AuthenticatedDataSource({ url })
  },
  __exposeQueryPlanExperimental: true
})
```

In managed federation, instead of listing the service URLs in the gateway, we register each service with Apollo Studio, and the gateway gets the service info from Apollo Studio. This has two main benefits: 

1. When we add services, change service URLs, or change service schemas, we don’t need to redeploy the gateway.
2. When there’s an error with one of the changes in #1, the gateway can automatically fall back to the last working configuration.

We register a service in the same way we registered our monolith’s schema in [Analytics](../server/production/analytics.md) and [Schema validation](../server/extended-topics/schema-validation.md)—with the `apollo service:push` command:

```sh
$ npx apollo service:push \
    --serviceName=users \
    --serviceURL="http://users.svc.cluster.local:4001/" \
    --endpoint="http://localhost:4001/"
```

We can view the list of services we’ve pushed:

```sh
$ npx apollo service:list
  ✔ Loading Apollo Project
  ✔ Fetching list of services for graph guide-api

name       URL                                      last updated
─────────  ───────────────────────────────────────  ────────────────────────
Users      http://users.svc.cluster.local:4001/    5 March 2020 (5 days ago)
Reviews    http://reviews.svc.cluster.local:4002/  5 March 2020 (5 days ago)

View full details at: https://studio.apollographql.com/graph/guide-api/service-list
```

To validate the service, we use `--serviceName` with the `apollo service:check` command we used in the [Schema validation](../server/extended-topics/schema-validation.md) section:

```sh
$ npx apollo service:check \
    --serviceName=users \
    --endpoint="http://localhost:4001/" \
    --tag=prod \
```

> Just as monolith schemas can have multiple *variants*, denoted by the `--tag` option, so can federated schemas.

This command not only validates the service’s schema against recent usage data, but it also checks failed composition—that is, a failure in the ability to compose the whole federated schema. 

Now we know how to set up Apollo Studio with federation and to validate changes to services to make sure they continue to fit into the whole data graph and don’t break clients.

