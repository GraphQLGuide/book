---
title: Contents
description: Table of contents for the Android chapter
---

# Chapter 10: Android

Chapter contents:

* [Setting up Apollo Android](setting-up-apollo-android.md)
* [First query](first-query.md)
* [Querying with variables](querying-with-variables.md)
* [Caching](caching.md)
* [ViewModel](viewmodel.md)
* [Flow](flow.md)

---

Background: [mobile apps](../background/mobile-apps.md), [Android and Kotlin](../background/mobile-apps.md#android)

In this chapter, we’ll build a small Android app using the [Apollo Android](https://www.apollographql.com/docs/android/) library to make a couple GraphQL queries and get the data for our UI. 

Apollo Android doesn’t use Apollo Client, the JavaScript library behind the [React](../react/index.md), [Vue](../vue/index.md), and [React Native](../react-native/index.md) chapters. It’s a separate codebase with its own feature set:

- Generates Java and Kotlin typed models from our operations and [fragments](https://www.apollographql.com/docs/android/essentials/fragments/)
- Three types of [caching](caching.md)
- [RxJava](https://www.apollographql.com/docs/android/advanced/rxjava3/) and [coroutine](https://www.apollographql.com/docs/android/advanced/coroutines/) APIs
- [File uploads](https://www.apollographql.com/docs/android/essentials/mutations/#uploading-files)
- [Persisted queries](https://www.apollographql.com/docs/android/advanced/persisted-queries/)
- [Custom scalar types](https://www.apollographql.com/docs/android/essentials/custom-scalar-types/)

The app we’ll build is the table of contents for the Guide. It has two pages: the first, a list of chapters, and the second, a list of sections in a chapter.

![The first page with a list of chapters](../img/android-chapters.png)
![The second page with a list of sections](../img/android-sections.png)
