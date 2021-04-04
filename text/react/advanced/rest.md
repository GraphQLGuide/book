---
title: REST
description: How to use GraphQL query code to make requests to REST APIs
---

## REST

> If you’re jumping in here, `git checkout 20_1.0.0` (tag [`20_1.0.0`](https://github.com/GraphQLGuide/guide/tree/20_1.0.0)). Tag [`21_1.0.0`](https://github.com/GraphQLGuide/guide/tree/21_1.0.0) contains all the code written in this section.

You might be thinking, “What is a section on REST doing in a chapter on GraphQL client dev??” The thing is, not all of our colleagues have seen the light of GraphQL yet, so they’re still making REST APIs! 😉 And we might want to use them in our app. The common solution is for your backend GraphQL server to proxy the REST API. For example, the server will add a query to the schema:

```gql
type Query {
  githubStars
  ...
  latestSatelliteImage(lon: Float!, lat: Float!, sizeInDegrees: Float): String
}
```

And we would write our client query:

```gql
query WhereAmI {
  latestSatelliteImage(lon: -73.94, lat: 40.7, sizeInDegrees: 0.3)
}
```

And when the server received our query, it would send this GET request to NASA:

https://api.nasa.gov/planetary/earth/imagery/?lon=-73.94&lat=40.7&dim=0.3&api_key=DEMO_KEY

The server would get back a URL of an image, which it would return to us, which we would put in the `src` of an `<img>` tag:

![Satellite image of Brooklyn and Manhattan](../../img/satellite-image.png)

So that’s how proxying through our GraphQL backend works (and we’ll go into more detail in the server chapter). But what if our backend can’t proxy the REST API? Maybe we don’t have control over the backend, or maybe some less common reason applies, like needing to reduce load on the server or needing better latency (proxying through the server is slightly slower). In that case, we can use [`apollo-link-rest`](https://www.apollographql.com/docs/link/links/rest.html) to send some of our GraphQL queries as REST requests to a REST API instead of to our GraphQL server!

We need to find a REST API to use in our Guide app so that we can learn by example in this section of the book 😜. Displaying a satellite image isn’t useful, but displaying the temperature in the header might conceivably be useful (albeit completely unrelated to GraphQL 😄). If we google “weather api”, the first result is OpenWeatherMap, and we see that it’s free to use—great. Now we want to open up Playground to look at the OpenWeatherMap’s schema to figure out which query to use. But it’s a REST API! And REST doesn’t have a specified way of reporting what the API can do, so we can’t have a standard tool like Playground that shows us. So we have to read their docs. Let’s use their [current weather data](https://openweathermap.org/current) endpoint, `api.openweathermap.org/data/2.5/weather`, which looks like it has a number of options for specifying the location with query parameters: 

- `?q=[city name]`
- `?id=[city id]`
- `?lat=[latitude]&lon=[longitude]`
- `?zip=[zip code]`

Which one can we use? We don’t know the client’s city or GPS coordinates or zip code... so at the moment, none of them! There are a couple of ways, though, to get the user’s location: 

- Query an IP geolocation API, which looks up the client’s IP in a database and returns that IP’s city and approximate coordinates.
- Use the web standard [geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API), which according to [caniuse](https://caniuse.com/#search=geolocation) works in all browsers after IE 8! Except for Opera Mini 😄.

The browser API is more precise, easier to code, and gets the user’s consent via a built-in permission dialog. So let’s do that. All we need to do is just `navigator.geolocation.getCurrentPosition`, and after the user approves, we get the coordinates in a callback:

```js
window.navigator.geolocation.getCurrentPosition(
  ({ coords: { latitude, longitude } }) => {
    console.log(latitude, longitude)
    // logs: 40.7 -73.94
  }
)
```

Now we have numbers to put into our URI format, which was:

`api.openweathermap.org/data/2.5/weather?lat=[latitude]&lon=[longitude]`

And we also need an API key, which their docs say should go in an `appid` query param. The full URL, broken down:

```
http://
api.openweathermap.org
/data/2.5/weather
?lat=40.7
&lon=-73.94
&appid=4fb00091f111862bed77432aead33d04
```

And the link:

[http://api.openweathermap.org/data/2.5/weather?lat=40.7&lon=-73.94&appid=4fb00091f111862bed77432aead33d04](http://api.openweathermap.org/data/2.5/weather?lat=40.7&lon=-73.94&appid=4fb00091f111862bed77432aead33d04)

> If this API key is over its limit, you can [get a free one here](https://home.openweathermap.org/users/sign_up).

We get a response like this:

```json
{
  "coord": { "lon": -73.94, "lat": 40.7 },
  "weather": [
    {
      "id": 803,
      "main": "Clouds",
      "description": "broken clouds",
      "icon": "04n"
    }
  ],
  "base": "stations",
  "main": {
    "temp": 283.59,
    "pressure": 1024,
    "humidity": 66,
    "temp_min": 280.95,
    "temp_max": 285.95
  },
  "visibility": 16093,
  "wind": { "speed": 2.26, "deg": 235.503 },
  "clouds": { "all": 75 },
  "dt": 1539575760,
  "sys": {
    "type": 1,
    "id": 2121,
    "message": 0.0044,
    "country": "US",
    "sunrise": 1539601626,
    "sunset": 1539641711
  },
  "id": 5125125,
  "name": "Long Island City",
  "cod": 200
}
```

That’s a lot of stuff. Since it’s not GraphQL, we didn’t know what we were going to get back until we tried it, unless we were able to find it in their docs (which author Loren did, eventually—under the heading “Weather parameters in API respond”). Looking through the response JSON, we find `main.temp`, which is a weirdly high number, so we might suspect it’s Kelvin, and we can search the docs to confirm. (In a GraphQL API, this could have been included in a schema comment, and we wouldn’t have had to search 😎.) 

If we didn’t have Apollo, we would use [`fetch()`](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch) or [`axios.get()`](https://github.com/axios/axios#example) to make the HTTP request:

```js
const weatherEndpoint = 'http://api.openweathermap.org/...'
const response = await fetch(weatherEndpoint)
const data = await response.json();
console.log(`It is ${data.main.temp} degrees Kelvin`);
```

[Run in browser](https://codesandbox.io/s/814v12k739?expanddevtools=1&module=%2Fsrc%2Findex.js)

And we would use component lifecycle methods and `setState` to get the returned data into our JSX. Or if we wanted the data cached so that we can use it in other components or on future instances of the current component, or if we wanted all of our data fetching logic separated from our presentational components, we might use [Redux](https://redux.js.org/) instead.

However, with [`apollo-link-rest`](https://www.apollographql.com/docs/link/links/rest.html) we can get Apollo to make the HTTP request for us, cache the response data for future use, and provide the data to our components. 

Before we set up the link, `apollo.js` is getting long. Let’s move all the existing link code to a new file `link.js` so that we can simplify `apollo.js`:

[`src/lib/apollo.js`](https://github.com/GraphQLGuide/guide/blob/21_1.0.0/src/lib/apollo.js)

```js
import { ApolloClient, InMemoryCache, gql } from '@apollo/client'
import find from 'lodash/find'

import link from './link'

export const cache = new InMemoryCache({ ... })

const typeDefs = ...

export const apollo = new ApolloClient({ link, cache, typeDefs })
```

Now we set up the new link:

[`src/lib/link.js`](https://github.com/GraphQLGuide/guide/blob/21_1.0.0/src/lib/link.js)

```js
import { ApolloLink } from '@apollo/client'
import { RestLink } from 'apollo-link-rest'

...

const restLink = new RestLink({
  uri: 'https://api.openweathermap.org/data/2.5/'
})

const link = ApolloLink.from([errorLink, restLink, networkLink])
```

Since requests flow from left to right in the link chain, we want our `restLink` to be to the left of `networkLink` (it won’t pass on REST requests to `networkLink`, which would send them to our GraphQL server). And since responses (and errors) flow from right to left, we want `restLink` to be to the right of `errorLink` so that errors from `restLink` go through `errorLink`.

Let’s add a temperature component in the header:

[`src/components/App.js`](https://github.com/GraphQLGuide/guide/blob/21_1.0.0/src/components/App.js)

```js
import CurrentTemperature from './CurrentTemperature'

...

<header className="App-header">
  <StarCount />
  <Link ... />
  <CurrentUser />
  <CurrentTemperature />
</header>
```

And now for its implementation. Let’s start with the query:

```gql
{
  weather(lat: $lat, lon: $lon)
    @rest(
      type: "WeatherReport"
      path: "weather?appid=4fb00091f111862bed77432aead33d04&{args}"
    ) {
    main
  }
}
```

Anything with the `@rest` [directive](../../query-language/#directives) `apollo-link-rest` will resolve itself. We’ve already configured the link with the base of the URI, so here we give the rest of it. Since we’re getting back an object, we also need to make up a name for what the object’s type will be in the Apollo cache. And we want the `"main"` attribute from the JSON response, so `{ main }` is our selection set.

If we want to be even more explicit about which data we’re using, we could select just `main.temp` instead of the whole `main` object. But when we want to select fields in objects, we need the object to have a type, so we add an `@type` directive:

```gql
query TemperatureQuery {
  weather(lat: $lat, lon: $lon)
    @rest(
      type: "WeatherReport"
      path: "weather?appid=4fb00091f111862bed77432aead33d04&{args}"
    ) {
    main @type(name: "WeatherMain") {
      temp
    }
  }
}
```

Now let’s think about the UX. At some point, we need to call `window.navigator.geolocation.getCurrentPosition`, after which the browser prompts the user to share their location. We don’t want to annoy users with this prompt every time they use the app, so let’s start out with a button and go through these steps:

- Display location button
- User clicks button and we request their location from the browser
- User gives permission through browser dialog
- We receive the location and make the query
- We receive the query results and display them

Here’s the shell of our component with that logic and our lat/lon state:

[`src/components/CurrentTemperature.js`](https://github.com/GraphQLGuide/guide/blob/21_1.0.0/src/components/CurrentTemperature.js)

```js
import React, { useState } from 'react'
import { useQuery, gql } from '@apollo/client'
import { IconButton } from '@material-ui/core'
import { MyLocation } from '@material-ui/icons'

const TEMPERATURE_QUERY = gql`
  query TemperatureQuery {
    weather(lat: $lat, lon: $lon)
      @rest(
        type: "WeatherReport"
        path: "weather?appid=4fb00091f111862bed77432aead33d04&{args}"
      ) {
      main
    }
  }
`

function Content() {
  const [position, setPosition] = useState(null)

  function requestLocation() { ... }

  const haveLocation = !!position

  const { data, loading } = useQuery(TEMPERATURE_QUERY, {
    skip: !haveLocation,
    variables: position,
  })

  if (!haveLocation) {
    return (
      <IconButton
        className="Weather-get-location"
        onClick={requestLocation}
        color="inherit"
      >
        <MyLocation />
      </IconButton>
    )
  }

  return data.weather.main.temp
}

export default () => (
  <div className="Weather">
    <Content />
  </div>
)
```

When we don’t yet have the user’s location, we skip running the query and show the location button. Once we do have the location, we pass it to our query and display `data.weather.main.temp`. 

![A location button displayed in the header](../../img/location-button.png)

It would be nice to display a spinner while we’re waiting for the location and the weather API, so let’s fill in `requestLocation()` and add `gettingPosition` to the state:

```js
function Content() {
  const [position, setPosition] = useState(null)
  const [gettingPosition, setGettingPosition] = useState(false)

  function requestLocation() {
    setGettingPosition(true)
    window.navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        setGettingPosition(false)
        setPosition({
          lat: latitude,
          lon: longitude,
        })
      }
    )
  }

  ...
  
  if (loading || gettingPosition) {
    return <div className="Spinner" />
  }
```

![Loading spinner in place of the location button](../../img/loading-temperature.png)

And now it works, and we’re reminded that the API returns Kelvin, so let’s show it in Celsius and Fahrenheit (and default to the former, because it’s just silly that the latter is still in use 😆):

```js
const kelvinToCelsius = kelvin => Math.round(kelvin - 273.15)
const kelvinToFahrenheit = kelvin =>
  Math.round((kelvin - 273.15) * (9 / 5) + 32)

function Content() {
  const [displayInCelsius, setDisplayInCelsius] = useState(true)

  ...

  const kelvin = data.weather.main.temp
  const formattedTemp = displayInCelsius
    ? `${kelvinToCelsius(kelvin)} °C`
    : `${kelvinToFahrenheit(kelvin)} °F`

  return (
    <IconButton onClick={() => setDisplayInCelsius(!displayInCelsius)}>
      {formattedTemp}
    </IconButton>
  )
}
```

![Temperature in Celsius](../../img/temperature.png)

To recap, we added `@rest` to our root query field, which made our REST link intercept the query before it was sent to our GraphQL server. The REST link returns data from the weather REST API, which gets saved to our cache and provided to our component. We get all the nice things we’re used to in Apollo, like declarative data fetching and loading state. And because the data is in the cache, we can reuse the data in other components, and we can update the data (through re-querying or direct writes), and our components will automatically update.

