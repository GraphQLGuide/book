---
title: Overview
---

# Chapter 6: React

Chapter contents:

* [Setting up](setting-up.md)
  * [Build options](setting-up.md#build-options)
  * [App structure](setting-up.md#app-structure)
  * [Set up Apollo](setting-up.md#set-up-apollo)
* [Querying](querying.md)
  * [First query](querying.md#first-query)
  * [Loading](querying.md#loading)
  * [Polling](querying.md#polling)
  * [Subscriptions](querying.md#subscriptions)
  * [Lists](querying.md#lists)
  * [Query variables](querying.md#query-variables)
  * [Skipping queries](querying.md#skipping-queries)
* [Authentication](authentication.md)
  * [Logging in](authentication.md#logging-in)
  * [Resetting](authentication.md#resetting)
* [Mutating](mutating.md)
  * [First mutation](mutating.md#first-mutation)
  * [Listing reviews](mutating.md#listing-reviews)
  * [Optimistic updates](mutating.md#optimistic-updates)
  * [Arbitrary updates](mutating.md#arbitrary-updates)
  * [Creating reviews](mutating.md#creating-reviews)
  * [Using fragments](mutating.md#using-fragments)
  * [Deleting](mutating.md#deleting)
  * [Error handling](mutating.md#error-handling)
  * [Editing reviews](mutating.md#editing-reviews)
* [Advanced querying](advanced/index.md)
  * [Paginating](advanced/paginating.md)
    * [Offset-based](advanced/paginating.md#offset-based)
      * [page](advanced/paginating.md#page)
      * [skip & limit](advanced/paginating.md#skip-and-limit)
    * [Cursors](advanced/paginating.md#cursors)
      * [after](advanced/paginating.md#after)
      * [orderBy](advanced/paginating.md#orderby)
  * [Client-side ordering & filtering](advanced/client-side-ordering-and-filtering.md)
  * [Local state](advanced/local-state.md)
    * [Reactive variables](advanced/local-state.md#reactive-variables)
    * [In cache](advanced/local-state.md#in-cache)
  * [REST](advanced/rest.md)
  * [Review subscriptions](advanced/review-subscriptions.md)
    * [Subscription component](advanced/review-subscriptions.md#subscription-component)
    * [Add new reviews](advanced/review-subscriptions.md#add-new-reviews)
    * [Update on edit and delete](advanced/review-subscriptions.md#update-on-edit-and-delete)
  * [Prefetching](advanced/prefetching.md)
    * [On mouseover](advanced/prefetching.md#on-mouseover)
    * [Cache redirects](advanced/prefetching.md#cache-redirects)
  * [Batching](advanced/batching.md)
  * [Persisting](advanced/persisting.md)
  * [Multiple endpoints](advanced/multiple-endpoints.md)
* [Extended topics](extended-topics/index.md)
  * [Linting](extended-topics/linting.md)
  * [Uploading files](extended-topics/uploading-files.md)
  * [Testing](extended-topics/testing.md)
  * [Server-side rendering](extended-topics/server-side-rendering.md)  


---

Background: [single-page application](../background/spa.md), [HTTP](../background/http.md), [Node](../background/node-npm-and-nvm.md), [git](../background/git.md), [JSON](../background/json.md), [JavaScript](../background/javascript), [React](../background/react.md)

In this chapter, we’ll learn to use the [`@apollo/client`](https://www.apollographql.com/docs/react/) library through building the Guide web app—the code behind the [https://graphql.guide](https://graphql.guide/Preface) site, where we can sign in, read the book, and write reviews. We’ll go through setup, simple queries, complex queries, auth, and mutations for creating, updating, and deleting. Then we’ll cover advanced topics like infinite scrolling, local state, SSR, working offline, and performance. Here’s what it will look like:

![Guide app](../img/guide-app.png)

We’ll be using Apollo’s hooks API. For an older version of this chapter that uses Apollo’s [render prop](https://www.apollographql.com/docs/react/api/react/components/) and [higher-order component](https://www.apollographql.com/docs/react/api/react/hoc/) APIs or the Apollo Client 2.* cache API, see version `r5` of the Guide:

- [r5.pdf](https://s3.graphql.guide/the-graphql-guide-r5.pdf)
- [r5.mobi](https://s3.graphql.guide/the-graphql-guide-r5.mobi)
- [r5.epub](https://s3.graphql.guide/the-graphql-guide-r5.epub)

> We recommend Apollo for its flexibility, ease of use, documentation, and ecosystem. The main alternative is [Relay](https://relay.dev/), which is more opinionated—it requires fragments colocated with components, specific ways of working with errors, and a certain format for the server schema, including `Node`s, universally unique `id`s, [connections](../server/extended-topics/pagination.md#relay-cursor-connections) for pagination, and mutation structure. It also requires use of the Relay compiler. For more info on these differences, check out [this post](https://hasura.io/blog/deep-dive-into-relay-graphql-client/).

