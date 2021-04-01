# Tying this all together

REST APIs have served us well for many years. They’ve made data access for many applications easy to understand and implement. However, as we’ve seen in this chapter, this simplistic approach belies the true complexity of implementing a full API that supports a modern web or mobile application.

In a modern application, the consumer needs to be in control of what data they can request. A single page may have many different data models represented in it, and short of writing a unique REST endpoint for every page of a site, REST simply doesn’t have the flexibility to allow applications to request the data they need at all times.

While GraphQL has a number of new concepts to learn (GraphQL schemas, the query language, etc.), these features are designed to help us write our applications correctly from the start—whereas the prospect of building a comparable REST API can be absolutely overwhelming in its complexity.

GraphQL truly is the most developer-friendly way of building an API. It puts the consumer in full control of the data requested, and we can therefore avoid querying data that we don’t need. As an added bonus, there is clear, automatically-generated documentation we can browse to understand any new GraphQL API.

The developers of GraphQL learned from REST’s challenges and mistakes over the years, and have turned the best parts into a streamlined interface that will surely be the standard for API design for many years to come. The rest of this book will dive deep into the benefits of GraphQL, how to implement it efficiently, and how to build the best applications using this technology.