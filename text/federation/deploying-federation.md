---
title: Deploying federation
---

### Deploying federation

The gateway and our services are all just Node.js servers, so we can use any of the deployment options we discussed in the main [Deployment section](../server/production/deployment.md). And Apollo gateway doesn’t yet support subscriptions, so FaaS websocket support isn’t an issue like it was before. One new issue is the recommendation that services not be publicly accessible. Federation services need to expose extra information to work with the gateway (note the added `_service` and `_entities` root query fields), and we might not want people to be able to access it. 

There are a number of different options for deploying services privately, including:

- IaaS or Faas: Amazon’s VPC ([Virtual Private Cloud](https://aws.amazon.com/vpc/)) with either EC2 or Lambda
- PaaS: Heroku’s [Private Spaces](https://www.heroku.com/private-spaces) (requires an Enterprise account)
- Kubernetes [private clusters](https://cloud.google.com/kubernetes-engine/docs/concepts/private-cluster-concept)

And if we didn’t care about the information exposure, we could use public-only options like Vercel Now.

There are three steps we usually do around deployment:

- Schema validation (`apollo service:check`)
- Code deployment (various)
- Push new service information to Apollo Studio (`apollo service:push`)

Normally, it’s best to do them in the order listed—first checking if the service’s schema will fit in the graph and not break queries, then deploying the code, and finally, once the production servers are ready to receive requests, telling the gateway about the updated service. In CircleCI, it would look something like this:

`.circleci/config.yml`

```yaml
version: 2

jobs:
  deploy_to_prod:
    docker:
      - image: circleci/node:8

    steps:
      - checkout

      - run: npm install

      - run:
          name: Starting server
          command: npm start
          background: true

      # Wait for server to start up
      - run: sleep 5

      - run: npx apollo service:check --serviceName=users --endpoint="http://localhost/graphql" --tag=prod

      - run: npm run deploy

      # Wait for production servers to restart
      - run: sleep 5

      - run: npx apollo service:push --serviceName=users --endpoint="http://localhost/graphql/" --tag=prod
```

If the `service:check` command fails, the CircleCI build will fail, and `npm run deploy` and subsequent commands won’t get run.

When a `service:push` is not backward compatible with our gateway’s query planner (for instance when we change `@key @requires @provides` directives), then we should do the `service:push` *before* deploying. And generally, when we make modifications that affect the query planner, we need to take the steps listed in [Apollo Docs: Modifying query-planning logic](https://www.apollographql.com/docs/graph-manager/managed-federation/advanced-topics/). The article has different instructions for *in-place* versus *atomic* changes. In-place is when we deploy a service to the same domain, whereas atomic is when we deploy a service to a new domain and `service:push` to point the gateway at the new domain. Let’s look at the difference using Vercel Now, which creates a unique URL with every deployment. 

In-place, deploying to the existing `serviceUrl`:

```sh
$ apollo service:push \
    --tag=prod 
    --serviceName=users 
    --endpoint="http://localhost:4001"
$ now --prod
> https://users.api.graphql.guide
> Success! Deployment ready
```

Atomic, changing the `serviceUrl`:

```sh
$ now
> https://users-61h1hvwis.now.sh/
> Success! Deployment ready
$ apollo service:push \
    --tag=prod \
    --serviceName=users \
    --endpoint="http://localhost:4001" \
    --serviceUrl="https://users-61h1hvwis.now.sh/"
```

---

In summary, we started out this Apollo federation section by building a [users service](federated-service.md) and connecting it to [a gateway](federated-gateway.md). Then we built a [second service](extending-entities.md) for reviews and extended entities. Finally, we learned how to set up [managed federation](managed-federation.md) and [how to deploy](deploying-federation.md). 🚀

