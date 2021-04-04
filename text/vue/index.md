---
title: Overview
---

# Chapter 7: Vue

Chapter contents:

* [Setting up Apollo](setting-up-apollo.md)
* [Querying](querying.md)
* [Querying with variables](querying-with-variables.md)
* [Further topics](further-topics.md)
  * [Advanced querying](further-topics.md#advanced-querying)
  * [Mutating](further-topics.md#mutating)
  * [Subscriptions](further-topics.md#subscriptions)

---

Background: [Vue](../background/vue.md)

In this chapter, we’ll build a basic Vue.js app with [Vue Apollo](https://v4.apollo.vuejs.org/)’s [composition API](https://v4.apollo.vuejs.org/guide-composable/). Vue Apollo also has an [option API](https://v4.apollo.vuejs.org/guide-option/), where operations are defined under an `apollo` component option, and a [component API](https://v4.apollo.vuejs.org/guide-components/#what-are-apollo-components), where `<ApolloQuery>`, `<ApolloMutation>`, and `<ApolloSubscribeToMore>` are used inside component templates. We recommend using the composition API for its flexibility.

Vue Apollo uses the same Apollo Client library that we used in the extensive [React chapter](../react/index.md), so for in-depth knowledge and advanced topics, refer to that chapter. In this chapter, we’ll see what the Vue equivalents to the React hooks API look like. (Vue Apollo’s composition API, option API, and component API are roughly analogous to React Apollo’s hooks API, HOC API, and render prop API, respectively.)
