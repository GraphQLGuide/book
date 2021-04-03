---
title: Mobile apps
---

# Mobile apps

* [Android](#android)
* [iOS](#ios)
* [React Native](#react-native)

With the demise of BlackBerry OS in 2013 and Windows Phone in 2015, the only two mass market phone operating systems are iOS and Android, with around 15% and 85% of the global market, respectively. And in the U.S., the majority of time spent online is spent on mobile devices. If we want our users to be able to use our software on mobile, we can either make a web app or a native mobile app.

Pros of making a web app:

- We don’t need to have multiple codebases for desktop web and mobile. We can make our desktop web app a responsive PWA that works on mobile, or, if we choose to have a separate mobile site (like `m.oursite.com`), we can at least share a lot of the code.
- Publishing is easier:
  - We aren’t subject to app store rules and review processes.
  - Our users don’t have to update the app to get the newest version—the newest version is loaded when they open our website (or if we’re using a service worker, they might get the new version the second time they open the site, depending on our implementation).

Pros of making a native app:

- Better UX: 
  - Native UI components that feel smoother / perform better.
  - No browser URL bar or bottom navigation bar.
  - Easier to open: the user of a web app has to either install the PWA, which most iOS users don’t know how to do, or they have to open a browser and type in our URL.
- More capabilities, particularly when it comes to iOS. (Android allows PWAs—progressive web apps—to do more, like store large files, speech recognition, bluetooth, background sync, and push notifications. Android also doesn’t delete our cached assets like IndexedDB, service worker cache, and LocalStorage after two weeks of disuse.)
- If we make a [universal React Native app](#react-native), then we don’t need to have separate codebases for web and mobile.

The three main ways of making a native mobile app are:

- Native code: Java, C++, or Kotlin for Android, and C++, Objective-C, or Swift for iOS.
- React Native: We write JavaScript code that runs on the device in a background process and communicates with the React Native runtime to interact with native UI components and device APIs.
- Cordova: A native shell for our web app. We build and submit a native app to the app store, and when the app starts up, it loads our website inside a *web view* (like a full-screen browser tab). So our UI and logic is written in HTML/CSS/JS, and we can add Cordova plugins so that our JavaScript can call native APIs.

Cordova is much less popular than the other options, as it performs poorer, and the plugins are more often out of date or buggy compared to React Native plugins (called [native modules](https://reactnative.dev/docs/native-modules-setup)).

## Android

Android is a mobile operating system created in 2003 and bought by Google in 2005. As it is open source (published under the Apache license), it can be freely used, and it *is* used by ~all phone manufacturers besides Apple. It can also be modified—for instance, Fire OS is a fork of Android used by Amazon for its mobile devices. 

One thing to keep in mind when developing for Android is that Android devices are more likely than iOS devices to be on an older version of the OS. At the time of writing, only 33% of Android devices were on the latest major version, and 15% were 5+ years old, versus 85% of iOS devices on the latest version and 1% 4+ years old.

While any editor can be used, the official IDE is Android Studio, and it can build, run, and package apps. It also does linting, layout editing, debugging, and device emulation.

Android apps can be written in Kotlin, Java, and/or C++. As of 2019, Google recommends Kotlin. Kotlin is statically typed and multi-paradigm: it supports object-oriented programming, functional programming, and other styles. We use [Kotlin](https://kotlinlang.org/) in the [Android chapter](../android/index.md), and those who know JavaScript will likely be able to read the code and understand what’s going on. You can also learn Kotlin by example [on their website](https://play.kotlinlang.org/byExample/overview). 

## iOS

The iOS operating system was released in 2007 with the first iPhone. It is closed source and only used on Apple devices. The iOS IDE is Xcode, and it has similar features to Android Studio. iOS apps can be written in Swift, Objective-C, and/or C++. Swift was released by Apple in 2014 as an improved, modern option. It is multi-paradigm and actively developed, with a new major version released each year.

## React Native

React Native (RN) is an open-source front-end JavaScript framework from Facebook. Version `0.1.0` was released in 2015, and since then there have been over 60 minor versions released and > 20,000 commits from > 2,000 people. It originally just supported iOS, with Android support coming soon after. Microsoft released support for [Windows and macOS](https://microsoft.github.io/react-native-windows/), and there are third-party packages for [web](https://github.com/necolas/react-native-web), [tvOS](https://github.com/react-native-community/react-native-tvos), Linux (via Qt: [Proton Native](https://github.com/kusti8/proton-native) or [RN Desktop](https://github.com/status-im/j)), and more. 

Some third-party RN modules have platform-specific code, in which case they only support certain platforms. We can find modules that work with our target platforms by filtering on [reactnative.directory](https://reactnative.directory/). A *universal* react native app is one that works on more than just the official two platforms (iOS and Android). It most often refers to iOS, Android, and web. 

[Expo](https://expo.io/) is a set of tools and modules that makes it easier to code React Native apps, and it supports iOS, Android, and web. Most of its modules are compatible with all three platforms, and there’s a chart on each library’s documentation page so we know the exceptions:

![Expo’s AppleAuthentication library, which doesn’t work on Android or web](../img/expo-library-compatibility.png)

Expo’s major features are:

- A command-line tool that makes it easy to run the app on devices or simulators in development.
- A large set of well-maintained cross-platform libraries for accessing device APIs.
- A build service that streamlines preparing apps for the app stores.
- Over-the-air updates: updating our app in production without resubmitting to the app store.
- Cross-platform push notification service.

