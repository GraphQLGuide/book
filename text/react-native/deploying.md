# Deploying

> If you’re jumping in here, `git checkout 3_0.1.0` (tag [3_0.1.0](https://github.com/GraphQLGuide/guide/tree/3_0.1.0)

Deploying an [SPA](../background/spa.md) is straightforward: 

- The build tool outputs an HTML file, a JS file (or multiple if we’re code splitting), and other static assets, like CSS files, images, and fonts.
- We put those files on the cloud service that our domain points to. If we’re using GitHub Pages, we do so with a `git push`, with [Vercel](https://vercel.com/) it’s `cd build/ && vercel`, and with [Netlify](https://www.netlify.com/) it’s `netlify deploy`.

Deploying native apps is much more involved. Fortunately, Expo does a lot to make the process smoother. First, we optimize our assets (for example, compressing images):

```sh
npm i -g sharp-cli
npx expo-optimize
```

The next step is building, but before we do that, we need to add some fields to our `app.json`:

```json
{
  "expo": {
    ...
    "primaryColor": "#ff5dc8",
    "ios": {
      "bundleIdentifier": "com.example.appname",
      "buildNumber": "1.0.0",
      "supportsTablet": true
    },
    "android": {
      "package": "com.example.appname",
      "versionCode": 1,
      "permissions": []
    }
  }
}
```

The first digit of an iOS build number cannot be 0, so the lowest number possible is `1.0.0`. 

On Android, permissions are requested at time of install (versus iOS, which are requested via popup dialogs while the app is being used). `android.permissions` lists all permissions the app needs, for example `["CAMERA"]` for an app that takes pictures.

Now we can build for the platform(s) we want:

```sh
npx expo build:ios
npx expo build:android
npx expo build:web
```

After `build:web`, our static assets will be in `web-build/`, so we’d do, for instance, `cd web-build/ && vercel`. 

After `build:ios` or `build:android`, we upload to the app stores:

```sh
npx expo upload:ios
npx expo upload:android
```
 
Both commands walk us through the process. In each case, we’ll need a developer account. Creating a developer account for uploading apps to the Google Play Store has a one-time fee of $25, and the iOS App Store is $99/year. The iOS App Store also has a manual review process that can take a couple days.
 
So far we’ve gone through the process for deploying apps for the first time. When we make updates to our app and want to redeploy, there are two different ways to do it, depending on what types of changes we made. 

If we made changes to the version of Expo or to [certain fields](https://docs.expo.io/workflow/publishing/#some-native-configuration-cant-be-updated-by) in `app.json`, like `name`, `icon`, `splash`, `ios`, `android`, etc., then we need to re-run the build and upload commands. 

However, if we’ve only changed JavaScript or other assets (besides the `icon` and `splash` images), all we need to do is run `expo publish`! This command uploads our code and assets to the Expo cloud and CDN. Whenever a user opens our app, it will check Expo’s cloud for a new version of our code to download and run. We can configure in `aap.json` whether Expo waits for the new version to arrive before starting the app. We currently have it set to not wait:
 
`app.json`
 
```json
{
  "expo": {
    ...
    "fallbackToCacheTimeout": 0
  }
}
```

So when the user opens the app, the version of the app code that’s on the device will run. The new version will be downloaded in the background and used the next time the app is opened. If we set `"fallbackToCacheTimeout": 30000` (30 seconds, the default value), then this will happen:

- User opens app and sees splash screen.
- App checks Expo cloud for new version.
  - If there’s no new version, the current version will run and the splash screen is removed.
  - If there’s a new version:
    - The new version is downloaded.
      - If downloading takes less than 30 seconds, the new version is run.
      - If it takes more than 30 seconds, the old version is run.
    - The splash screen is removed.
