* [Preface](preface.md)
* [Introduction](README.md)
  * [Who is this book for?](README.md#who-is-this-book-for)
  * [Background](README.md#background)
  * [The book](README.md#the-book)
  * [The code](README.md#the-code)
    * [Git](README.md#git)
    * [Formatting](README.md#formatting)
  * [Resources](README.md#resources)
  * [Version](README.md#version)

* [Chapter 1: Understanding GraphQL Through REST](1.md)
  * [Introduction](1.md#introduction)
  * [GraphQL as an alternative to a REST API](1.md#graphql-as-an-alternative-to-a-rest-api)
  * [A simple REST API server](1.md#a-simple-rest-api-server)
  * [A simple GraphQL server](1.md#a-simple-graphql-server)
  * [Querying a set of data](1.md#querying-a-set-of-data)
  * [Filtering the data](1.md#filtering-the-data)
  * [Async data loading](1.md#async-data-loading)
  * [Multiple types of data](1.md#multiple-types-of-data)
  * [Security & error handling](1.md#security-&-error-handling)
  * [Tying this all together](1.md#tying-this-all-together)

* [Chapter 2: Query Language](2.md)
  * [Document](2.md#document)
  * [Fields](2.md#fields)
  * [Arguments](2.md#arguments)
  * [Fragments](2.md#fragments)
  * [Variables](2.md#variables)
  * [Directives](2.md#directives)
  * [Mutations](2.md#mutations)
  * [Subscriptions](2.md#subscriptions)

* [Chapter 3: Type System](3.md)
  * [Schema](3.md#schema)
  * [Scalar types](3.md#scalar-types)
  * [Enum types](3.md#enum-types)
  * [Object types](3.md#object-types)
  * [Query & Mutation types](3.md#query-&-mutation-types)
  * [Lists](3.md#lists)
  * [Non-null](3.md#non-null)
  * [Arguments](3.md#arguments)
  * [Unions](3.md#unions)
  * [Interfaces](3.md#interfaces)

* [Chapter 4: Validation & Execution](4.md)
  * [Validation](4.md#validation)
  * [Resolvers](4.md#resolvers)
  * [Execution](4.md#execution)
  * [Error handling](4.md#error-handling)

* [Chapter 5: Client Dev](5.md)
  * [Anywhere: HTTP](5.md#anywhere-http)
    * [cURL](5.md#curl)
    * [Javascript](5.md#javascript)
  * [Client libraries](5.md#client-libraries)
    * [Streamlined request function](5.md#streamlined-request-function)
    * [Typing](5.md#typing)
    * [View layer integration](5.md#view-layer-integration)
    * [Caching](5.md#caching)
    * [DevTools](5.md#devtools)

* [Chapter 6: React](6.md)
  * [Setting up](6.md#setting-up)
    * [Build options](6.md#build-options)
    * [App structure](6.md#app-structure)
    * [Set up Apollo](6.md#set-up-apollo)
  * [Querying](6.md#querying)
    * [First query](6.md#first-query)
    * [Loading](6.md#loading)
    * [Polling](6.md#polling)
    * [Subscriptions](6.md#subscriptions)
    * [Lists](6.md#lists)
    * [Query variables](6.md#query-variables)
    * [Skipping queries](6.md#skipping-queries)
      * [Section HOCs](6.md#section-hocs)
      * [Section Query](6.md#section-query)
      * [More routing](6.md#more-routing)
  * [Auth](6.md#auth)
    * [Logging in](6.md#logging-in)
    * [Resetting](6.md#resetting)
  * [Mutating](6.md#mutating)
    * [First mutation](6.md#first-mutation)
    * [Listing reviews](6.md#listing-reviews)
    * [Optimistic updates](6.md#optimistic-updates)
    * [Arbitrary updates](6.md#arbitrary-updates)
    * [Creating reviews](6.md#creating-reviews)
    * [Using fragments](6.md#using-fragments)
    * [Deleting](6.md#deleting)
    * [Error handling](6.md#error-handling)
    * [Editing reviews](6.md#editing-reviews)
  * [Advanced querying](6.md#advanced-querying)
    * [Paginating](6.md#paginating)
      * [Offset-based](6.md#offset-based)
        * [page](6.md#page)
        * [skip & limit](6.md#skip-&-limit)
      * [Cursors](6.md#cursors)
        * [after](6.md#after)
        * [orderBy](6.md#orderby)
    * [Updating multiple queries]()
    * [Local state]()
    * [withUser]()
    * [Reviews subscription]()
    * [Batching]()
    * [Prefetching]()
    * [Persisting]()
  * [Extended topics]()
    * [SSR]()
    * [Offline]()
    * [Testing]()
    * [Linting]()

* [Chapter 7: Vue](7.md)

* [Chapter 8: React Native](8.md)

* [Chapter 9: iOS](9.md)

* [Chapter 10: Android](10.md)

* [Chapter 11: Server Dev](11.md)
  * Setting up node
  * Writing good schemas
  * Writing resolvers
  * Structuring the server
    * Schema
    * Models & connectors
  * Subscriptions
  * Connecting data sources
    * SQL
    * MongoDB
    * REST APIs
    * Prisma
    * Redis
    * Elasticsearch
    * RethinkDB
  * Security
    * Authentication
    * Authorization
    * Denial of service
  * Extended topics
    * Caching
    * Batching
    * Prepared queries
    * Testing

* [Background](bg.md)
  * [JavaScript](bg.md#javascript)
  * [JSON](bg.md#json)
  * [Git](bg.md#git)
  * [Node & npm & nvm](bg.md#node-&-npm-&-nvm)
  * [HTTP](bg.md#http)
  * [SPA](bg.md#spa)
  * [SSR](bg.md#ssr)
  * [Latency](bg.md#latency)
  * [Webhooks](bg.md#webhooks)  
  * [Authentication](bg.md#authentication)
    * [Tokens vs. sessions](bg.md#tokens-vs-sessions)
    * [localStorage vs. cookies](bg.md#localstorage-vs-cookies)  
  