---
title: Overview
---

# Apollo federation

* [Federated service](federated-service.md)
* [Federated gateway](federated-gateway.md)
* [Extending entities](extending-entities.md)
* [Managed federation](managed-federation.md)
* [Deploying federation](deploying-federation.md)

In the [Introduction](../server/introduction.md) to the server chapter, we talk about microservices versus monoliths. If we go down the microservice route, then we recommend doing so with Apollo federation.

> An alternative that supports Subscriptions is [GraphQL Tools schema stitching](https://www.graphql-tools.com/docs/stitch-combining-schemas/). For further differences between the two, see [this article](https://product.voxmedia.com/2020/11/2/21494865/to-federate-or-stitch-a-graphql-gateway-revisited).

Apollo federation is a specification for how to divide our schema across different GraphQL *services*. Each service describes which parts of the schema it implements, and a gateway combines all the parts into one larger schema. The gateway stands between the client and the services, receiving requests from the client and automatically resolving them through one or more requests to services.

The Apollo federation specification can be implemented in any language and has been added to many [existing GraphQL server libraries](https://www.apollographql.com/docs/apollo-server/federation/other-servers/) and some databases (like [Dgraph](https://dgraph.io/docs/graphql/federation/)). Servers that follow the specification are the services, and the gateway is a special instance of Apollo Server that uses the [`@apollo/gateway`](https://www.apollographql.com/docs/apollo-server/api/apollo-gateway/) library.

In the first three sections, we’ll rebuild our Guide server monolith using federation: We’ll start with a users service, then the gateway, and then the reviews service. Then in [Managed federation](#managed-federation), we’ll see how we can benefit from Apollo Studio SaaS product, and finally in [Deploying federation](#deploying-federation), we’ll discuss the deployment of the gateway and services.

