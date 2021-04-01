# Adding Apollo

> If you’re jumping in here, `git checkout 0_1.0.0` (tag [0_1.0.0](https://github.com/GraphQLGuide/guide/tree/0_1.0.0), or compare [0...1](https://github.com/GraphQLGuide/guide/compare/0_1.0.0...1_1.0.0))

Just like we did the React chapter, we create a client instance and wrap our app in an `<ApolloProvider>`:

[`App.js`](https://github.com/GraphQLGuide/guide-react-native/blob/1_1.0.0/App.js)

```js
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client'

const client = new ApolloClient({
  uri: 'https://api.graphql.guide/graphql',
  cache: new InMemoryCache(),
})

export default function App() {
  return (
    <ApolloProvider client={client}>
      <NavigationContainer>
        ...
      </NavigationContainer>
    </ApolloProvider>
  )
}
```

Now in our `HomeScreen` component, we can make a query for the chapter list and display it:

[`src/HomeScreen.js`](https://github.com/GraphQLGuide/guide-react-native/blob/1_1.0.0/src/HomeScreen.js)

```js
import { Text, FlatList, Pressable } from 'react-native'
import { gql, useQuery } from '@apollo/client'

import styles from './styles'

const CHAPTERS_QUERY = gql`
  query Chapters {
    chapters {
      id
      number
      title
    }
  }
`

const ChapterItem = ({ chapter }) => {
  const { number, title } = chapter
  let header, subheader

  if (number) {
    header = `Chapter ${number}`
    subheader = title
  } else {
    header = title
  }

  return (
    <Pressable style={styles.item}>
      <Text style={styles.header}>{header}</Text>
      {subheader && <Text style={styles.subheader}>{subheader}</Text>}
    </Pressable>
  )
}

export default () => {
  const { data, loading } = useQuery(CHAPTERS_QUERY)

  if (loading) {
    return <Loading />
  }

  return (
    <FlatList
      data={data.chapters}
      renderItem={({ item }) => (
        <ChapterItem chapter={item} />
      )}
      keyExtractor={(chapter) => chapter.id.toString()}
    />
  )
}
```

[FlatList](https://reactnative.dev/docs/flatlist.html) is a core React Native component for displaying lists. `renderItem` is called to render each item in the `data` array prop, and `keyExtractor` returns a unique string to use for each item’s `key` prop.

When we edit our code with the app open, it live reloads. However, the query gets stuck in a loading state, so we just see the spinner. To do a full reload, open the developer menu and select “Reload.”

How to open the developer menu:

- iOS Device: Shake the device a little bit.
- iOS Simulator: Hit `Ctrl+Cmd+Z` on a Mac in the emulator to simulate the shake gesture, or press `Cmd+D`.
- Android Device: Shake the device vertically a little bit.
- Android Emulator: Either hit `Cmd+M`, or run `adb shell input keyevent 82` in your terminal window.

When we do a full reload, we briefly see the loading indicator, and then:

![App open on iOS, displaying the list of chapters](../img/expo-home-screen.png)

