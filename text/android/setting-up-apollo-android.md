# Setting up Apollo Android

First we clone the starter app, which has everything but the data:

```sh
git clone https://github.com/GraphQLGuide/guide-android.git
cd guide-android/
git checkout 0_1.0.0
```

We can open it in [Android Studio 4.1+](https://developer.android.com/studio) and see the file structure:

![Android Studio’s Project panel with expanded `app/src/`](../img/android-studio.png)

We’ll be working in the `app/` module. In `app/src/main/java/`, we have the `guide.graphql.toc` (`toc` stands for table of contents) package with code for the Activity, two Fragments, and two RecyclerView Adapters. In this chapter, we’ll be:

- Editing the gradle file and existing UI code.
- Adding code to the `data/` package.
- Adding GraphQL queries and a `schema.json` to the `app/src/main/graphql/[package name]/` folder.

When we run the app, we see a single chapter with no sections:

![“Android Dev” chapter](../img/android-starter-chapters.png)
![No sections](../img/android-starter-sections.png)

Let’s start by adding the Apollo Android library to our project:

`app/build.gradle.kts`

```kt
plugins {
  ...
  id("com.apollographql.apollo").version("2.2.2")
}

apollo {
  generateKotlinModels.set(true)
}

dependencies {
  ...
  implementation("com.apollographql.apollo:apollo-runtime:2.2.2")
  implementation("com.apollographql.apollo:apollo-coroutines-support:2.2.2")
}
```

We add the `apollo-runtime` and `apollo-coroutines-support` dependencies, apply version `2.2.2` of the plugin to our project, and tell Apollo to generate the typed models in Kotlin instead of Java.

After saving, we click the “Sync Now” link that appears in the top right. 

Apollo Android needs the schema of the GraphQL server we’ll be querying. If the server has introspection enabled, we can fetch the schema file with this Gradle task:

```sh
$ mkdir -p app/src/main/graphql/guide/graphql/toc
$ ./gradlew :app:downloadApolloSchema --endpoint='https://api.graphql.guide/graphql' --schema='app/src/main/graphql/guide/graphql/toc/schema.json'
```

> `mkdir -p` creates any necessary intermediate directories 😎.

If it’s blocked on Mac, we do the following:

- Open System Preferences -> Security & Privacy -> General.
- Select “Allow Anyway.”

![Security & Privacy General tab](../img/security-and-privacy-settings.png)

- Re-run the `./gradlew` command.
- Select “Open.”

![Cannot verify developer dialog for adoptopenjdk.net](../img/security-dialog.png)

We can check to make sure it downloaded the schema file:

```sh
$ ls app/src/main/graphql/guide/graphql/toc/
schema.json
```

