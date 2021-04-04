---
title: Overview
---

# Part II · The Client

This begins the practical coding part of the book. 🤓🎉

* Client-side:
  * Chapter 5: Client Dev
  * Web: 
    * [Chapter 6: React](../react/index.md)
    * [Chapter 7: Vue](../vue/index.md)
  * Mobile: 
    * [Chapter 8: React Native](../react-native/index.md)
    * [Chapter 9: iOS](ios/index.md)
    * [Chapter 10: Android](../android/index.md)
* Server-side:
  * [Chapter 11: Server Dev](../server/index.md)

# Chapter 5: Client Dev

Chapter 5 contents:

* [Anywhere: HTTP](anywhere-http.md)
  * [cURL](anywhere-http.md#curl)
  * [JavaScript](anywhere-http.md#javascript)
* [Client libraries](client-libraries.md)
  * [Streamlined request function](client-libraries.md#streamlined-request-function)
  * [View layer integration](client-libraries.md#view-layer-integration)
  * [Caching](client-libraries.md#caching)
  * [Typing](client-libraries.md#typing)
  * [DevTools](client-libraries.md#devtools)

---

GraphQL can be used between any two computers, such as from a web browser to a server or between two servers. Any computer with a network
connection can send a GraphQL request, and any computer with an IP address on
that network can receive that request and send back a response. Most software
written these days follows the
[client–server model](https://en.wikipedia.org/wiki/Client%E2%80%93server_model),
in which one computer is always providing a service (a **server**), and another
computer is always requesting the service (a **client**, such as a web browser or mobile app). In a GraphQL client–server model, the client
makes GraphQL requests, and the server provides the service of responding to
those requests. We’ll code GraphQL clients in the next few chapters and a GraphQL server
in the [last](../server/index.md).

First we’ll make simple HTTP requests, which we can do from any computer. Most
application clients are web browsers or mobile apps, so after HTTP,
we’ll use the best web and mobile GraphQL libraries to create full-featured
clients. The two web view layers we’ll be covering are React and Vue, and
we’ll use their most popular GraphQL libraries, which are
[`@apollo/client`](https://www.apollographql.com/docs/react/) and
[`vue-apollo`](https://github.com/akryum/vue-apollo#table-of-contents/). The best mobile
libraries are [`Apollo iOS`](https://www.apollographql.com/docs/ios/),
[`Apollo-Android`](https://github.com/apollographql/apollo-android), and
[`@apollo/client`](https://www.apollographql.com/docs/react/) for React
Native.

For each type of client and the server, we’ll go through building an app for reading this book 😄.
