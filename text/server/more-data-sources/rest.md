---
title: REST
description: Fetching REST data from our GraphQL server
---

## REST

> If you’re jumping in here, `git checkout 25_0.2.0` (tag [25_0.2.0](https://github.com/GraphQLGuide/guide-api/tree/25_0.2.0), or compare [25...rest](https://github.com/GraphQLGuide/guide-api/compare/25_0.2.0...rest_0.2.0))

Instead of fetching our data directly from the database, we may want to make use of our company’s legacy REST services (yes, any service that doesn’t speak GraphQL and support [Apollo Federation](../extended-topics/apollo-federation.md) is now a *legacy* service 😉😄). Or we may want to use data from third-party REST APIs. In either case, we use `RESTDataSource` to create a data source that makes REST requests.

Users of the Guide site need to be able to purchase the book, so we need to display the price to them. And let’s say we wanted to make the book more affordable in locations outside of the United States where it was originally priced. [Purchasing power parity](https://en.wikipedia.org/wiki/Purchasing_power_parity) (PPP) produces a conversion factor based on the actual purchasing power in a different location. For example, if the book is $100 in the U.S., and the conversion factor for India is 0.26, then charging `100 * 0.26 = $26` for the book to customers in India would make it equivalently affordable for them.

Let’s add a root query field `costInCents` that returns the PPP-adjusted cost of the book. To do that, we’ll need to query a PPP API. `ppp.graphql.guide` is a REST API that returns PPP information when given a country code (for example, `/?country=IN` for India). We can try it out in the browser:

[ppp.graphql.guide/?country=IN](https://ppp.graphql.guide/?country=IN)

![Chrome showing the JSON response with PPP info](../../img/ppp-in-browser.png)

The response JSON includes `pppConversionFactor`, which combines the `ppp` value and exchange rate into a number we multiply the USD price by. 

The other thing we need to figure out is how to get the country code of the client. We could look at the IP address (which is either `req.headers['x-forwarded-for'] || req.socket.remoteAddress`) and use a GeoIP lookup API (where we send the IP address and get back a location), but the easier way is to use the Cloudflare CDN, which adds a fairly accurate [`cf-ipcountry` HTTP header](https://support.cloudflare.com/hc/en-us/articles/200168236-What-does-Cloudflare-IP-Geolocation-do-) to all incoming requests. We can emulate this by setting the `cf-ipcountry` header in Playground.

We can check the header in our context function, and add the country code to our context object:

[`src/context.js`](https://github.com/GraphQLGuide/guide-api/compare/25_0.2.0...rest_0.2.0)

```js
export default async ({ req }) => {
  const context = {}
  
  ...

  const countryCode = req && req.headers['cf-ipcountry']
  const invalidCode = ['XX', 'T1'].includes(countryCode)
  if (countryCode && !invalidCode) {
    context.countryCode = countryCode
  }

  return context
}
```

We’ll then be able to access the code from our data source, which we create by extending `RESTDataSource` from [`apollo-datasource-rest`](https://www.npmjs.com/package/apollo-datasource-rest). There are five main things to know about `RESTDataSource`:

- Set `this.baseURL` to the REST API’s URL in the constructor.
- Use HTTP verb methods like `this.get(path, queryParams, options)`, `this.post()`, etc.
- It [deduplicates](https://khalilstemmler.com/blogs/graphql/how-apollo-rest-data-source-caches-api-calls/) REST requests.
- It caches responses from the REST API based on the responses’ cache headers.
- Define a `willSendRequest()` method if you want to modify all outgoing requests—for instance, by adding an auth header:

```js
class SomePrivateAPI extends RESTDataSource {
  ...
  
  willSendRequest(request) {
    request.headers.set('Authorization', this.context.token);
  }
}
```

Here’s our implementation, using `this.baseURL`, `this.get()`, and `this.context`:

[`src/data-sources/PPP.js`](https://github.com/GraphQLGuide/guide-api/blob/rest_0.2.0/src/data-sources/PPP.js)

```js
import { RESTDataSource } from 'apollo-datasource-rest'

export default class PPP extends RESTDataSource {
  constructor() {
    super()
    this.baseURL = `https://ppp.graphql.guide`
  }

  async getConversionFactor() {
    const { countryCode } = this.context
    if (!countryCode) {
      return 1
    }

    const data = await this.get('/', { country: countryCode })
    return data.pppConversionFactor || 1
  }
}
```

We don’t need to define `willSendRequest()` because it’s a public API. We only need a single method `getConversionFactor()`, which makes a GET request of the form `/?country=[countryCode]`. It defaults to a factor of 1, which results in the full price.

Next we need to add this to our `dataSources` so we can access it from our resolvers:

[`src/data-sources/index.js`](https://github.com/GraphQLGuide/guide-api/compare/25_0.2.0...rest_0.2.0)

```js
import PPP from './PPP'

export default () => ({
  reviews: new Reviews(db.collection('reviews')),
  users: new Users(db.collection('users')),
  ppp: new PPP()
})

export { Reviews, Users, Github, PPP }
```

And now adding our resolver:

[`src/resolvers/PPP.js`](https://github.com/GraphQLGuide/guide-api/blob/rest_0.2.0/src/resolvers/PPP.js)

```js
const BOOK_PRICE = 3900

export default {
  Query: {
    costInCents: async (_, __, { dataSources }) =>
      Math.round((await dataSources.ppp.getConversionFactor()) * BOOK_PRICE)
  }
}
```

[`src/resolvers/index.js`](https://github.com/GraphQLGuide/guide-api/compare/25_0.2.0...rest_0.2.0)

```js
import PPP from './PPP'

const resolversByType = [Review, User, Date, Github, PPP]

...
```

Lastly, we add the `costInCents` root Query field:

[`src/schema/PPP.graphql`](https://github.com/GraphQLGuide/guide-api/blob/rest_0.2.0/src/schema/PPP.graphql)

```gql
extend type Query {
  costInCents: Int!
}
```

[`src/schema/schema.graphql`](https://github.com/GraphQLGuide/guide-api/compare/25_0.2.0...rest_0.2.0)

```gql
...
#import 'PPP.graphql'
```

Now we should be able to get 3900 in response to a `{ costInCents }` query:

![costInCents query in Playground](../../img/costInCents.png)

This is defaulting to the US price, since there’s no header. When we add a country header, we’ll see a different result:

```json
{
  "cf-ipcountry": "IN"
}
```

![costInCents query with cf-ipcountry header](../../img/costInCents-with-header.png)

It works! 💃 The only thing left to check is caching. `RESTDataSource` only caches responses that contain a `Cache-Control` header. To see whether `ppp.graphql.guide` uses cache headers, we can use a command-line tool called [httpie](https://httpie.org/) (a modern alternative to `wget`):

```sh
brew install httpie
```

```
$ http https://ppp.graphql.guide/?country=IN
HTTP/1.1 200 OK
Connection: keep-alive
Content-Type: application/json; charset=utf-8
cache-control: max-age=604800, public
content-length: 278
date: Wed, 05 Feb 2020 07:27:47 GMT
etag: W/"116-6RgJXuLuRrGbBbX6QFViYUXAREs"
server: now
strict-transport-security: max-age=63072000
x-now-cache: MISS
x-now-id: iad1:sfo1:bxvvv-1580887666054-bbdc016271ef
x-now-trace: iad1

{
    "countryCode": "IN",
    "currency": {
        "code": "INR",
        "exchangeRate": 71.295489,
        "name": "Indian rupee",
        "symbol": "₹"
    },
    "ppp": 18.553,
    "pppConversionFactor": 0.2602268426828519
}
```

At the top of a list of headers, which includes a `cache-control` header (HTTP headers aren’t case-sensitive) instructing the recipient to cache the response for 604800 seconds (one week). So now our data source *should* be saving responses to the cache, but how can we check? If we were still using [Redis as a cache](../production/database-hosting.md#redis-caching), we could check Redis, but instead the data source is using the default in-memory cache. Without Redis, we can run [tcpdump](https://en.wikipedia.org/wiki/Tcpdump) to see when our development machine makes requests to `ppp.graphql.guide`. When a country is already cached, we shouldn’t see the request. In one terminal, we run this command:

```
$ sudo tcpdump "tcp[tcpflags] & (tcp-syn) != 0 and dst ppp.graphql.guide"
tcpdump: data link type PKTAP
tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
listening on pktap, link-type PKTAP (Apple DLT_PKTAP), capture size 262144 bytes
```

And then we change the country header in Playground to one we haven’t used, e.g., `CN` for China. On the first query, we should see this line printed:

```
04:30:18.705846 IP macbook.fios-router.home.52591 > ec2-3-210-90-207.compute-1.amazonaws.com.https: Flags [S], seq 995289110, win 65535, options [mss 1460,nop,wscale 6,nop,nop,TS val 1101427783 ecr 0,sackOK,eol], length 0
```

which signifies a new request to `ppp.graphql.guide`. If we continue to re-issue the Playground query with the same country header, no more lines should be printed, which means the data source used the in-memory cache instead of making a request.

