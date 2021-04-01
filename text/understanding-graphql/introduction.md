# Introduction

GraphQL is a modern, flexible specification for querying and modifying data that is on track to eclipse REST as a best practice for API design. You can write a single elegant query for all the data you need—no more cobbling together responses from a handful of REST endpoints. 

When describing GraphQL, it’s easier to start by saying what it isn’t. It isn’t a database—nothing is stored in it. It has little to do with graphs. While it is especially popular in the Node.js and React/Redux communities, GraphQL is a specification, which means it can be used in any language or framework. GraphQL is a query language (hence the “QL”)—it’s an abstraction for querying and modifying data, and it’s typically used by the client to fetch data from the server. It’s an explicit, type-safe, and flexible alternative to traditional JSON REST APIs.

Why use GraphQL? It turns out that GraphQL is amazingly useful—it combines a number of features that have existed in well-designed REST APIs and presents them as a single, easy-to-understand package:

- **Flexible, explicit queries:** GraphQL puts the consumer of the API in full control over what data they receive. Instead of a REST endpoint that returns all the properties you could possibly want (and often links to more), you only get the properties you ask for.
- **Type-safe, self-documenting API:** GraphQL APIs are type-safe and self-documenting: the schema you define is exposed as interactive documentation for private or public consumption.
- **No more API endpoint sprawl:** Backend engineers also love GraphQL. Once you write the code for accessing a data type, you won’t have to re-implement it. You don’t have to make a new endpoint for each view—you can leave that work up to the client and the GraphQL execution model, which is implemented by your GraphQL server library. And you don’t have to make a new API for each new app—you can have a single GraphQL API that covers all your business data.
- **Query consolidation:** A request for multiple data types can be combined into a single query that is executed in parallel on the server.
- **Static query analysis:** GraphQL schemas allow you to statically analyze the queries in your codebase, and they guarantee that you’ll never break them.

All together you end up with an API that is a delight to use and allows you to write expressive queries with understandable results:

![GraphiQL web interface](../img/graphiql.jpg)
*A GraphQL query (left) and the results from the server (right) inside the GraphiQL (with an “i” and pronounced “graphical”) web interface, an easy-to-use IDE for developing GraphQL queries.*

By reading this book, you’ll learn why you should use GraphQL in production and how to do it, and some best practices and common pitfalls. To start, we’ll dip our toes in the water: we’ll see the power of GraphQL through examples and answer the most obvious questions. Then we’ll dive deep into the intricacies of how this system was designed.

