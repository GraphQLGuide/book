## Future

The largest change to GraphQL-land in the coming years will be its size! The [S curve](https://en.wikipedia.org/wiki/Sigmoid_function) of GraphQL adoption is currently in the exponential phase (*seemingly* exponential—technically, it’s logistic). Here’s a graph of the [`graphql`](https://www.npmjs.com/package/graphql) package’s weekly npm downloads over the first 5 years:

![Downloads increasing exponentially over 5 years, ending in 3.5M](../img/npm-graphql-downloads.png)

And it doesn’t even include client packages like `apollo-client`, which are also growing. At the time of writing, [`apollo-client`](https://www.npmjs.com/package/apollo-client) has 1.7M weekly downloads. There’s also a lot of room left to grow—according to Google Trends, REST still has 3x the interest that GraphQL has:

![Line chart with GraphQL increasing and ending at 21:61 GraphQL:REST](../img/google-trends.png)

As adoption grows, more resources will be put into GraphQL libraries, tools, and services. The existing ones will improve, and new ones will be created. 

- Apollo Server’s [roadmap](https://github.com/apollographql/apollo-server/blob/master/ROADMAP.md#future-work) lists near-term future work, including: 
  - Adding subscription support to Apollo Federation.
  - Adding `@defer` and `@stream` directives.
  - Invalidation of whole-query cache through cache tags with CDN integration.
  - Building a “graph” caching layer for the gateway.
- Apollo Client also has a [roadmap](https://github.com/apollographql/apollo-client/blob/master/ROADMAP.md) as well.
- For some futuristic-seeming services and tooling, check out [this video](https://www.youtube.com/watch?v=JilN_PvQOqs) from the creator of [OneGraph](https://www.onegraph.com/docs/) (a GraphQL API that combines many different companies’ APIs).
- An exciting area in which we’re looking forward to growth is full-stack GraphQL frameworks—the Ruby on Rails of GraphQL, Node, and React. Our current favorite is [RedwoodJS](https://redwoodjs.com/), a new project based on Apollo, serverless, and Prisma.

There will also be changes to the language itself. In 2018, Facebook transferred the GraphQL project (which includes the spec, the [`graphql-js`](https://github.com/graphql/graphql-js) reference implementation, GraphiQL, and DataLoader) to a new Linux Foundation called the [GraphQL Foundation](https://foundation.graphql.org/). Anyone can discuss or propose changes to the specification in its GitHub repo, [graphql/graphql-spec](https://github.com/graphql/graphql-spec), or in the [GraphQL Working Group](https://github.com/graphql/graphql-wg), a monthly virtual meeting of maintainers.

Changes to the spec go through an [RFC process](https://github.com/graphql/graphql-spec/blob/master/CONTRIBUTING.md), and the current proposals are [listed here](https://github.com/graphql/graphql-spec/tree/master/rfcs). A few of them are:

- The [`@defer` and `@stream`](https://github.com/graphql/graphql-spec/blob/master/rfcs/DeferStream.md) query directives we mentioned on the Apollo Server roadmap. Adding `@defer` to a field tells the server they can initially return `null` and later fill in the data. Adding the `@stream` directive to a field with a list type means the server can send part of the list initially, and further parts of the list later. These directives address the fact that currently the server only sends a single response, which means it has to wait for all data to arrive from its data sources. And that means the response time is limited by the slowest source. With `@defer` and `@stream`, the client can get some of the data sooner.
- The [`@live`](https://github.com/graphql/graphql-spec/blob/master/rfcs/Subscriptions.md) query directive, which means: “send me the current value of this field, and then send me the updated value whenever it changes.”
- The Input Union—creating a union type that can be used for arguments. The [proposal](https://github.com/graphql/graphql-spec/blob/master/rfcs/InputUnion.md) (a.k.a. RFC) is a long document that starts with:

> RFC: GraphQL Input Union
>
> The addition of an Input Union type has been discussed in the GraphQL community for many years now. The value of this feature has largely been agreed upon, but the implementation has not.
> 
> This document attempts to bring together all the various solutions and perspectives that have been discussed with the goal of reaching a shared understanding of the problem space.
> 
> From that shared understanding, the GraphQL Working Group aims to reach a consensus on how to address the proposal.

There are also specifications in GraphQL-land other than the GraphQL spec, including the [Relay Cursor Connections](https://relay.dev/graphql/connections.htm) spec, the [Relay server](https://relay.dev/docs/en/graphql-server-specification.html) spec, and the in-development [GraphQL over HTTP](https://github.com/APIs-guru/graphql-over-http) spec.

---

You can contribute to the future of GraphQL by:

- Building things with it!
- Contributing to GraphQL libraries and tools.
- Getting involved with the spec and foundation.
- Spreading the word. 

Speaking of spreading the word, if you’d like to recommend the Guide to a friend or co-worker, we’d appreciate it 🙏🤗. [`https://graphql.guide`](https://graphql.guide). And we’d value any feedback you may have on the book via [GitHub issues](https://github.com/GraphQLGuide/book/issues) or PRs.

To learn more about GraphQL, we recommend:

- Books: 
  - [Production Ready GraphQL](https://book.productionreadygraphql.com/): An in-depth discussion of production topics.
  - [Advanced GraphQL with Apollo & React](https://8bit.press/book/advanced-graphql): A large tutorial-style book based on Apollo Federation and React.
- Course: [Fullstack Advanced React & GraphQL](https://advancedreact.com/).
- Reading [the spec](https://spec.graphql.org/draft/).

