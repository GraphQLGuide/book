# Introduction

Background: [HTTP](../background/http.md), [Server](../background/server.md)

Welcome to the server chapter! This is the last—and longest—chapter. We’ll learn most of the concepts through building the Guide API server, which backs the apps we built in the client chapters. The server will primarily store data in MongoDB, but we’ll also connect to several other data sources, including SQL and REST. We’ll write it in JavaScript, but all server-side GraphQL libraries use [the same execution method](../validation-and-execution/index.md), and most of the concepts in this chapter will apply to writing GraphQL servers in other languages. To see the differences, check out these backend tutorials:

- [Java](https://www.howtographql.com/graphql-java/0-introduction/)
- [Python](https://www.howtographql.com/graphql-python/0-introduction/)
- [Ruby](https://www.howtographql.com/graphql-ruby/0-introduction/)
- [Scala](https://www.howtographql.com/graphql-scala/0-introduction)
- [Elixir](https://www.howtographql.com/graphql-elixir/0-introduction/)

There are also GraphQL libraries in these languages:

- [.NET](https://github.com/graphql-dotnet/graphql-dotnet)
- [Clojure](https://github.com/walmartlabs/lacinia)
- [Go](https://github.com/graphql-go/graphql)
- [PHP](https://github.com/webonyx/graphql-php)

This chapter is split into six parts:

* **Introduction**
* **[Building](building/index.md)**
* **[Testing](testing/index.md)**
* **[Production](production/index.md)**
* **[More data sources](more-data-sources/index.md)**
* **[Extended topics](extended-topics/index.md)**

In **Building**, we build a GraphQL server from scratch, including authentication and authorization, query and mutation resolvers that talk to a database, error handling, and subscriptions. In **Testing**, we test it in different ways. In **Production**, we deploy our server and update it with things that are helpful to have in production, like error reporting, analytics, and security against attack. In **More data sources**, we connect our server to other databases and a REST API. In **Extended topics**, we learn about various new server-side topics and go into more depth on previous topics like the schema, subscriptions, and auth.

## Why build a GraphQL server?

There are three main reasons why we might decide our server should be a GraphQL server:

1. So we can use GraphQL on the client and gain all the client-side benefits of GraphQL.
2. To simplify our server code: instead of setting up many endpoints and implementing fetching and formatting logic for each, we set up one endpoint and write a single resolver for each data type.
3. To avoid having to create new endpoints or new APIs in the future.

For coders, #1 and #2 are often the most compelling, because it improves our quality of life 😄. For companies, #3 is often the most compelling, since they save time and money: they get a single, flexible API that covers all their business data, which means that instead of having to create new endpoints or entire APIs for new features or apps, they can just use their existing GraphQL API (and in some cases add fields and resolvers).

## What kind of GraphQL server should I build?

Actually, the first choice we have is whether to build it or generate it 😄. There are services that can save us a lot of time by generating a production-ready GraphQL backend for us. We'll go over the pros/cons and how to set one up in the [Hasura section](hasura.md), and another option is [AWS AppSync](https://aws.amazon.com/appsync/).

If we do decide to build our own server, there are two situations we might be in:

1. **Existing project**, in which case we’ll either be adding a GraphQL layer in front of our existing servers, or adding a GraphQL endpoint to existing servers.
2. **New project** (a.k.a. *greenfield*), in which case we have a choice of which architecture to use.

There are two main architectures:

1. **Microservices** (a collection of servers that each cover a different business capability). GraphQL as the API gateway: the client talks to the GraphQL server API gateway, which talks to services (via GraphQL, REST, gRPC, Thrift, etc), which talk to databases.
2. **Monolith** (a single server that covers all business logic). GraphQL as the application layer: the client talks to the GraphQL server, which talks directly to databases.

Microservices are in vogue and the word “monolith” is often used with a scornful tone, but in most cases, it’s better to have a monolith. Martin Fowler, one of the leaders in software design, [wrote](https://martinfowler.com/bliki/MicroservicePremium.html):

> So my primary guideline would be don’t even consider microservices unless you have a system that’s too complex to manage as a monolith. The majority of software systems should be built as a single monolithic application. Do pay attention to good modularity within that monolith, but don’t try to separate it into separate services.

While there are a lot of huge tech companies that use microservices and are better off for it, they’re better off because they’re huge—not because microservices are a general good practice.

If we have an existing monolith, it often makes sense to add a GraphQL endpoint to that server instead of putting a GraphQL server in front of the monolith. For example, if we have an Express monolith that has a lot of thin REST routes that call model functions that contain the business logic and data fetching, then it would be easy to add a `/graphql` route with [`apollo-server-express`](https://www.apollographql.com/docs/apollo-server/essentials/server#middleware) and implement resolvers that call the same model functions as the REST routes. Or if all of our logic was in the routes themselves, and we didn't need to continue supporting the REST API, we could move the code we needed over to resolvers and [Apollo data sources](building/data-sources.md).

When we’re adding a GraphQL layer in front of an existing backend, whether it’s a microservices or monolith backend, we can make the choice between continuing to develop the existing backend or gradually moving logic to the GraphQL layer. If we’re doing microservices and want to keep that architecture, then it’s easy to keep implementing services (in whatever language(s) we implement services) and either extend the GraphQL schema and resolvers or use [schema federation](apollo-federation.md).

Another question is what language to write our GraphQL server in. In the case of adding to an existing monolith, we’ll use the GraphQL server library for the same language. In all other cases (new projects or a GraphQL layer in front of existing microservices or monoliths), we generally recommend JavaScript. It’s by far the most popular type of GraphQL server, and has thus developed the best ecosystem of libraries and services.

The server we’ll be creating in this chapter is a greenfield monolith, so it will talk directly to the database. However, most of the concepts will carry over to the microservice model. The largest difference will be either:

- using schema federation to combine multiple GraphQL services
- fetching data and resolving mutations by talking to the services (e.g. with REST) instead of the database

We’ll go over both of these options later in the chapter.

