# App structure

We start with a basic Expo app:

```sh
git clone https://github.com/GraphQLGuide/guide-react-native.git
cd guide-react-native/
git checkout 0_1.0.0
npm install
npm start
```

`npm start` runs `expo start`, which starts the Expo bundler and displays a number of ways to start the app, either from the terminal or from the “Metro Bundler” website that’s opened.

![Expo running in the terminal](../img/expo-terminal.png)

Here’s the app running on iOS:

![Screenshot of the app on an iOS device](../img/expo-iOS.png)

and on an Android simulator:

![Screenshot of the app on an Android simulator](../img/expo-android.png)

and as a web app:

![Screenshot of the app in Chrome](../img/expo-web.png)

Here’s our code structure:

```
.
├── .gitignore
├── App.js
├── app.json
├── assets
│   ├── favicon.png
│   ├── icon.png
│   └── splash.png
├── babel.config.js
├── package-lock.json
├── package.json
└── src
    ├── HomeScreen.js
    ├── Loading.js
    └── styles.js
```

[`app.json`](https://github.com/GraphQLGuide/guide-react-native/blob/0_1.0.0/app.json) has Expo configuration:

```json
{
  "expo": {
    "name": "guide",
    "slug": "guide",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "cover",
      "backgroundColor": "#ffffff"
    },
    "updates": {
      "fallbackToCacheTimeout": 0
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
```

It points to images in the `assets/` folder for the app icon, the splash screen (full-screen image shown while the app is loading), and the website favicon.

[`babel.config.js`](https://github.com/GraphQLGuide/guide-react-native/blob/0_1.0.0/babel.config.js) allows us to configure Babel. It’s currently using the default preset:

```js
module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
  }
}
```

Our JavaScript code is in these files:

```
├── App.js
└── src
    ├── HomeScreen.js
    ├── Loading.js
    └── styles.js
```

[`App.js`](https://github.com/GraphQLGuide/guide-react-native/blob/0_1.0.0/App.js) is the app’s entry point. It sets up navigation with the [React Navigation](https://reactnavigation.org/) library and sets the mobile status bar icons to light/white (against the pink header):

```js
import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'

import HomeScreen from './src/HomeScreen'
import { screenOptions } from './src/styles'

const Stack = createStackNavigator()

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" screenOptions={screenOptions}>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: '📖 The GraphQL Guide' }}
        />
      </Stack.Navigator>
      <StatusBar style="light" />
    </NavigationContainer>
  )
}
```

`src/Homescreen.js` just displays `<Loading />` for now:

```js
import React from 'react'

import Loading from './Loading'

export default () => {
  return <Loading />
}
```

[`src/Loading.js`](https://github.com/GraphQLGuide/guide-react-native/blob/0_1.0.0/src/Loading.js) uses the native `ActivityIndicator` spinner:

```js
import React from 'react'
import { View, ActivityIndicator } from 'react-native'

import styles, { PINK } from './styles'

export default () => (
  <View style={styles.centered}>
    <ActivityIndicator size="large" color={PINK} />
  </View>
)
```

And [`src/styles.js`](https://github.com/GraphQLGuide/guide-react-native/blob/0_1.0.0/src/styles.js) contains our styling:

```js
import { StyleSheet } from 'react-native'

export const PINK = '#ff5dc8'

export const screenOptions = {
  headerStyle: {
    backgroundColor: PINK,
  },
  headerTintColor: '#fff',
}

export default StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  item: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 20,
    paddingRight: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
  },
  header: {
    fontWeight: 'bold',
  },
  subheader: {
    paddingTop: 10,
  },
})
```

