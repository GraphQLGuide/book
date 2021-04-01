# GraphQL as an alternative to a REST API

This chapter examines how to build a fully-functional API using REST techniques and how that compares to building an equivalent API using GraphQL.

A basic REST API (where we perform a HTTP GET request to a particular URL and get back some JSON data) is one of the simplest API designs in existence. The complications appear when we want to have greater control over the results returned from the server. This is where GraphQL’s abilities really shine.

While a GraphQL API starts out more complex than a REST API, its complexity doesn’t increase as quickly because GraphQL implementations implicitly handle many of the challenging aspects of API design. Once we understand the basics of GraphQL, we understand enough to do pretty much anything we want, which is an exciting proposition. On the other hand, while a REST API starts off simple, it quickly ratchets up in complexity to levels that can be challenging to maintain, as we’ll see later in this chapter.

GraphQL’s developers have taken all the best practices of an excellently designed REST API and built them into a single system. It may seem like there is a lot of abstraction to it, but that  abstraction guides us toward practices that will make our APIs better designed and more consistent.

Going through building a REST API may seem like unnecessary work, but if we look at GraphQL as a REST API taken to its logical conclusion (a REST API with all the bells and whistles included), then a lot of the decisions that were made in designing GraphQL make a lot of sense. GraphQL is truly the best version of a REST API.

We recommend following along with the code, which can be found [on GitHub](https://github.com/GraphQLGuide/graphql-rest-api-demo).

