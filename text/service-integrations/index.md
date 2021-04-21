---
title: Overview
---

# Stripe and Service Integrations

Chapter contents:

* [Making a query](making-a-query.md)
* [Writing server-side code](writing-server-side-code.md)
* [Creating persisted queries](creating-persisted-queries.md)

---

Background: [Authentication](../background/authentication.md)

In this chapter, we’ll learn how to integrate with 3rd party services like Stripe using [OneGraph](https://www.onegraph.com/). 

> For those seeing “Stripe integration” and looking for how to accept payments in your app, we won’t be covering that in this chapter as it’s not GraphQL-specific. We recommend the [Stripe Checkout tutorial](https://stripe.com/docs/checkout/integration-builder), where the only change you’ll need to make to it is using GraphQL instead of REST! 😄 So the basic process is:

- On the server, define a mutation like `createCheckoutSession(cart: Cart): ID`.
- On the client, when the checkout button is clicked, first send the mutation to the server to get the checkout session ID, and then call `stripe.redirectToCheckout({ sessionId })`.

OneGraph is a single GraphQL endpoint that brings together many different SaaS APIs like Stripe, Salesforce, Zendesk, Twitter, and Clearbit. (51 at time of writing!) Instead of coding with many different libraries, REST APIs, and auth systems, we can talk to a single GraphQL API with a single auth token.
