---
title: Introduction
slug: '/introduction'
description: Introduction to the book, its contents, and formatting.
redirect_from:
  - /README/
---

# Introduction

* [Who is this book for?](#who-is-this-book-for)
* [Background](#background)
* [The book](#the-book)
  * [The chapters](#the-chapters)
* [The code](#the-code)
  * [Git](#git)
  * [Formatting](#formatting)
* [Resources](#resources)
* [Version](#version)

---

## Who is this book for?

This book is for most programmers. If you write software that fetches data from a server, or you write server code that provides data to others, this book is for you. It’s particularly relevant to frontend and backend web and mobile developers. If you don’t know modern JavaScript, we recommend [learning that first](background/javascript.md), but it’s not necessary. For example, if you only know Ruby, you can likely follow the JavaScript server code in Chapter 11 well enough to learn the important concepts of a GraphQL server, most of which will apply to using the `graphql` gem in your Ruby server code.

This book will be especially poignant to these groups of people:

- Backend devs who work on REST APIs and who:
  - write a lot of similar code to fetch data and format it into JSON,
  - maintain view- or device-specific endpoints, or
  - have multiple APIs that use overlapping business data.
- Frontend devs who either: 
  - don’t use a caching library, and manually keep track of what data has already been fetched from the server, or 
  - use a cache, and write a lot of code to fetch data over REST and put it in the cache (we’re looking at you, Reduxers 👀😄).

## Background

We have a [Background](background/index.md) chapter that provides concise introductions to various background topics. You’re welcome to either look through them now or individually as you go along—at the beginning of a section, you’ll find a list of topics it assumes knowledge of, like the [Anywhere: HTTP](client/anywhere-http.md) section, which has two listed:

> Background: [HTTP](background/http.md), [JSON](background/json.md)

Some topics like [Git](background/git.md) and [Node](background/node-npm-and-nvm.md) are necessary for following along with the coding. Others, like [Tokens vs. sessions](background/authentication.md#tokens-vs-sessions), are nice to know, but not necessary.

## The book

While this book is great when read cover-to-cover, we don’t expect everyone to be interested in all the topics. A junior dev who wants to learn GraphQL and full-stack React Native might start with the Background and read straight through, skipping Vue, iOS, and Android, whereas a senior backend dev who’s already familiar with GraphQL might just read the spec and server chapters, and then come back to them as a reference when needed.

We’ve organized the table of contents for easy referencing. For instance, if you’re familiar with most GraphQL types but want to learn about Unions, you can look them up in the Table of Contents under Chapter 3: Type System > [Unions](type-system/unions.md). Or if you’re already doing basic queries in your React app, and you want to implement infinite scrolling, you can look it up under Chapter 6: React > Advanced querying > [Paginating](react/advanced/paginating.md).

There are many intra-book links like the two above, and depending on your e-book reader, there may be a way to “Go back” to your previous location after tapping a link. For example, in Mac Preview, you can use the `Cmd-[` shortcut. Otherwise, you may be able to bookmark the current location before tapping or remember the page number and then use a “Go to page/location” feature. Alternatively, it’s easy to go back and forward in a web browser if you’re using the HTML version of the book: [graphql.guide/introduction](https://graphql.guide/introduction).

### The chapters

[Chapter 1](understanding-graphql/index.md) introduces GraphQL and shows why it’s better than REST in most cases.

[Chapter 2](query-language/index.md) and [Chapter 3](type-system/index.md) explain the language itself and its type system.

[Chapter 4](validation-and-execution/index.md) goes in depth on how a GraphQL server responds to a query. It’s great for a full understanding of the technology, but you don’t *need* to know it unless you’re contributing to a GraphQL server library. So it’s totally fine to skip this—you’ll still understand everything if you go straight to [Chapter 11](server/index.md), the practical server coding chapter.

[Chapter 5: Client Dev](client/index.md) is the first of the coding chapters, and introduces common concepts among client libraries. Then we have a chapter for each of these libraries:

- [Chapter 6: React](react/index.md)
- [Chapter 7: Vue](vue/index.md)
- [Chapter 8: React Native](react-native/index.md)
- [Chapter 9: iOS](ios/index.md)
- [Chapter 10: Android](android/index.md)

[Chapter 11: Server Dev](server/index.md) is our server coding chapter. It and Chapter 6 are by far the longest chapters. All of the server examples are in Node with the `apollo-server` library, but almost all of the concepts can be applied to [other languages’ GraphQL libraries](server/introduction.md).

## The code

We intersperse blocks of code throughout the text. When we add code to a file that we’ve shown previously, we often just display the additions and some context, with ellipses (`...`) in place of existing code and sometimes with indentation removed to improve readability on mobile and e-readers. Code changes will be clearer if you read the book with the code open on your computer. Further, we believe humans usually learn better if they write things out themselves, so we encourage you to write out the code for each step, and get it working on your computer before moving on to the next step.

We recommend using Chrome and [VS Code](https://code.visualstudio.com/).

Code snippets are better formatted and sized in the HTML and PDF versions of the book. If you’re reading this in EPUB or MOBI format on your phone, turning sideways into landscape mode will help reduce code snippet wrapping.

### Git

In Chapters 6–11, you’ll learn through writing an app, step by step. Each chapter has its own repository. Each step has a branch in that repo, for example, branch `0` is the starter template, branch `1` has the code you write in step 1, etc. The branches we link to in the text also have a version number, and have the format: `[step]_[version]`. When the first version of the Guide was published, the Chapter 6 code version was `0.1.0`, so step 1 linked to branch `1_0.1.0`. The current version is `0.2.0`, so step 1 links to `1_0.2.0`.

If you skip the beginning of Chapter 6 and go straight to the [Listing reviews](react/mutating.md#listing-reviews) section, it says to start with step 9 (`9_0.2.0`). So we can look at the app in that state with these terminal commands:

```sh
git clone https://github.com/GraphQLGuide/guide.git
cd guide/
git checkout 9_0.2.0
npm install
npm start
```

> Check out the [git](background/git.md) and [npm](background/node-npm-and-nvm.md) background sections if you’re unfamiliar with these commands.

If we get stuck, we can look at the diff between step 9 and step 10 with GitHub’s compare feature:

`github.com/[repository]/compare/[tag 1]...[tag 2]`

which in our case would be:

[`github.com/GraphQLGuide/guide/compare/9_0.2.0...10_0.2.0`](https://github.com/GraphQLGuide/guide/compare/9_0.2.0...10_0.2.0)

We can also see the solution to the current step by checking out the next step:

```sh
git checkout 10_0.2.0
npm start
```

### Formatting

All the JavaScript code is [ES2017](background/javascript.md) and formatted with [prettier](https://prettier.io/) with two [settings](https://prettier.io/docs/en/options.html):

`.prettierrc`

```
singleQuote: true
semi: false
```

This means `'` instead of `"` for string literals and no unnecessary semicolons 😄.

## Resources

If you run into issues, we recommend posting to Stack Overflow with the relevant tags, for instance [`apollo-client`](https://stackoverflow.com/questions/ask?tags=apollo-client) for Chapter 6. If you have the Full edition, you can also ask the community in the #support Slack channel or email the technical support address we gave you.

If the issue is with our code, please search the repository’s issues to see if it’s an existing bug, and if it’s new, submit it! 🙏 🙌 Repositories are listed [below](#version).

Another important resource is the docs! Here they are for each library:

- [Chapter 6 and 8: `@apollo/client`](https://www.apollographql.com/docs/react/)
- [Chapter 7: Vue Apollo](https://v4.apollo.vuejs.org/)
- [Chapter 9: Apollo iOS](https://www.apollographql.com/docs/ios/)
- [Chapter 10: Apollo Android](https://www.apollographql.com/docs/android/)
- [Chapter 11: `apollo-server`](https://www.apollographql.com/docs/apollo-server/)

## Version

Book version: `r6` ([changelog](https://github.com/GraphQLGuide/book/releases))

Published April 6, 2021

If you purchased a package with free updates, we’ll be sending you new versions of the book whenever the content is updated (to the email address on the GitHub account you connected when you purchased the book from [graphql.guide](https://graphql.guide)).

### Chapter 6: React

Repo: [GraphQLGuide/guide](https://github.com/GraphQLGuide/guide/)

Code version: `1.0.0` ([changelog](https://github.com/GraphQLGuide/guide/blob/master/CHANGELOG.md))

```
@apollo/client 3.3.6
graphql 15.4.0
react 17.0.1
```

### Chapter 7: Vue

Repo: [GraphQLGuide/guide-vue](https://github.com/GraphQLGuide/guide-vue/)

Code version: `1.0.0` ([changelog](https://github.com/GraphQLGuide/guide-vue/blob/master/CHANGELOG.md))

```
@vue/apollo-composable 4.0.0-alpha.12
vue 3.0
```

### Chapter 8: React Native

Repo: [GraphQLGuide/guide-react-native](https://github.com/GraphQLGuide/guide-react-native/)

Code version: `1.0.0` ([changelog](https://github.com/GraphQLGuide/guide-react-native/blob/master/CHANGELOG.md))

```
@apollo/client 3.2.1
expo 39.0.2
react 16.13.1
```

### Chapter 10: Android

Repo: [GraphQLGuide/guide-android](https://github.com/GraphQLGuide/guide-android/)

Code version: `1.0.0` ([changelog](https://github.com/GraphQLGuide/guide-android/blob/master/CHANGELOG.md))

```
com.apollographql.apollo 2.2.2
android sdk 29
```

### Chapter 11: Server Dev

Repo: [GraphQLGuide/guide-api](https://github.com/GraphQLGuide/guide-api/)

Code version: `0.2.0` ([changelog](https://github.com/GraphQLGuide/guide-api/blob/master/CHANGELOG.md))

```
apollo-server 2.12.0
```
