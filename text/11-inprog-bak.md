* [Production](11.md#production)
  * [Deployment](11.md#deployment)
    * [Options](11.md#options)
    * [Deploying](11.md#deploying)
    * [Environment variables](11.md#environment-variables)
  * [Database hosting](11.md#database-hosting)
    * [MongoDB hosting](11.md#mongodb-hosting)
    * [Redis hosting](11.md#redis-hosting)
      * [Redis PubSub](11.md#redis-pubsub)
      * [Redis caching](11.md#redis-caching)
  * [Querying in production](11.md#querying-in-production)
  * [Analytics](11.md#analytics)
  * [Error reporting](11.md#error-reporting)
* [More data sources](11.md#more-data-sources)
  * [SQL](11.md#sql)
    * [SQL setup](11.md#sql-setup)
    * [SQL data source](11.md#sql-data-source)
    * [SQL testing](11.md#sql-testing)
  * [REST](11.md#rest)
  * [GraphQL](11.md#graphql)
  * [Custom data source](11.md#custom-data-source)
  * [Prisma](11.md#prisma)
* [Extended topics](11.md#extended-topics)
  * [Mocking](11.md#mocking)
  * [Pagination](11.md#pagination)
    * [Offset-based](11.md#offset-based)
    * [Cursors](11.md#cursors)
      * [after an ID](11.md#after-an-id)
      * [Relay cursor connections](11.md#relay-cursor-connections)
  * [File uploads](11.md#file-uploads)
    * [Client-side](11.md#client-side)
    * [Server-side](11.md#server-side)
  * [Schema validation](11.md#schema-validation)
  * [Apollo federation](11.md#apollo-federation)
    * [Federated service](11.md#federated-service)
    * [Federated gateway](11.md#federated-gateway)
    * [Extending entities](11.md#extending-entities)
    * [Managed federation](11.md#managed-federation)
    * [Deploying federation](11.md#deploying-federation)
  * [Hasura](11.md#hasura)
  * [Schema design](11.md#schema-design)
    * [One schema](11.md#one-schema)
    * [User centric](11.md#user-centric)
    * [Easy to understand](11.md#easy-to-understand)
    * [Easy to use](11.md#easy-to-use)
    * [Mutations](11.md#mutations)
      * [Arguments](11.md#arguments)
      * [Payloads](11.md#payloads)
    * [Versioning](11.md#versioning)
  * [Custom schema directives](11.md#custom-schema-directives)
    * [@tshirt](#@tshirt)
    * [@upper](#@upper)
    * [@auth](#@auth)
  * [Subscriptions in depth](11.md#subscriptions-in-depth)
    * [Server architecture](11.md#server-architecture)
    * [Subscription design](11.md#subscription-design)
  * [Security](11.md#security)
    * [Auth options](11.md#auth-options)
      * [Authentication](11.md#authentication)
      * [Authorization](11.md#authorization)
    * [Denial of service](11.md#denial-of-service)
  * [Performance](11.md#performance)
    * [Caching](11.md#caching)
  * [Future](11.md#future)




# Production

Once our GraphQL server code works and we want others (or our client code) to use it, we need to put it into production. This section contains the basic steps:

- [Deploying our code](#deployment)
- [Setting up our databases](#database-hosting)
- [Gathering analytics](11.md#analytics)
- [Tracking errors](11.md#error-reporting)

And in the last part of the chapter, [Extended topics](#extended-topics), we cover further things relevant to production, including [security](11.md#security) and [performance](11.md#performance).

## Deployment

* [Options](11.md#options)
* [Deploying](11.md#deploying)
* [Environment variables](11.md#environment-variables)

### Options

For our GraphQL API to be accessible, we need our code to run on a server that is *publicly addressable*—i.e. can be reached via a public IP address. Our dev computer usually can't be reached because it has a local (non-public) IP address (often starting with `192.168.*.*`), and the router that connects us to the internet (which does have a public IP) usually doesn't respond to HTTP requests. And while we could set the router up to forward requests to our dev computer, we then would have to leave our computer there and powered on, as well as do a number of other things to keep it working (like [DDNS](https://en.wikipedia.org/wiki/Dynamic_DNS)). Given the trouble and unreliability of that solution, we usually run our server code on a different computer—a production server—that's been built, set up, and maintained for that purpose.

The *deployment* process is copying the latest version of our code to the production server and running it. There are four main types of production server we can use:

- **On-prem**: In *on premises*, we buy our own servers, plug them in to power and internet in our office, and maintain them ourselves.
- **IaaS**: In *infrastructure as a service*, a company (like Amazon with its EC2 service) houses and maintains the physical servers, and we choose the operating system that gets run. We connect to the operating system over SSH to get a command prompt, install Node, copy our code to the machine, and run it.
- **PaaS**: *Platform as a service* is like IaaS, except in addition to maintaining the physical servers, the company also maintain the operating system and software server. For example a Node PaaS would install and update Node.js, and we would send them the code of our Node server, and they would run it with their version of Node.
- **FaaS**: *Function as a service* (also known as *serverless*) is like PaaS, except instead of sending them Node server code (which runs continuously and responds differently to different routes), we send them individual JavaScript functions and configure which route triggers which function. Then when we get HTTP requests, their server runs the right function. The function returns the response, which their server forwards to the client. Once the function returns, our code stops running—with FaaS we don't have a continuously running server process.

These options appear in:

- decreasing order of complexity to use (it's hardest to run our own server, and it's easiest to write and upload a single function)
- increasing time order:
  - 1970's: On-prem was the original type of server since the beginning of the internet.
  - 2006: AWS came out with EC2, the most popular IaaS.
  - 2009: Heroku, which popularized PaaS, publicly launched.
  - 2014: AWS came out with Lambda, the most popular FaaS.

Currently, PaaS seems to be the most popular option in modern web development. However, FaaS is rising and may eclipse PaaS. Notably, the most popular PaaS in the Node community ([Zeit Now](https://zeit.co/home)), switched to FaaS. While FaaS might be better for many applications, there are some disadvantages:

- **No continuous server process**: When we have a process (as we do with on-prem, IaaS, and PaaS), we can do things like:
  - Store data in memory between requests. The alternative that usually suffices is using an independent memory store, like a Redis server, which adds a small network latency (only ~0.2ms if inside the same AWS Availability Zone).
  - Open and maintain a WebSocket connection. However, some FaaS providers have added the ability to use WebSockets: At the end of 2018, AWS added support for WebSockets to its API Gateway, which can call a Lambda function when each message arrives over the socket.
- **Latency**: When there's not an existing server process, the FaaS provider has to start a new process (with a copy of our code and npm packages) to handle an incoming request, and that takes time, which increases the latency (i.e. total response time of the server). For example, Lambda usually takes under 500ms to create a new instance to handle a request (also called a *cold start*). Once the function returns, the instance stays running, and immediately handles the next request that arrives. If there are no requests for about ten seconds, it shuts down, and the next request is subject to the 500ms instance startup latency. Also, if there's an existing instance handling a request and a second request arrives while the existing instance is busy, a second instance is cold started.
- **Resource limits**: FaaS providers usually have a limit on how much memory and CPU can be used, and on how long the function can run for. One of the more flexible providers is Lambda. By default it limits memory and duration to 128 MB and 3 seconds. The limits can be raised to a maximum 3,008 MB and 15 minutes, which costs more. CPU speed scales linearly with memory size.

An example application that isn't well-suited to FaaS is a [Meteor](https://www.meteor.com) app, which: 

- keeps a WebSocket open to each client
- stores in memory a cache of the data each client has
- can use a lot of CPU to determine what data updates to send to each client

Apollo Server [doesn't yet support](https://github.com/apollographql/apollo-server/issues/2129) GraphQL subscriptions on Lambda. [`aws-lambda-graphql`](https://github.com/michalkvasnicak/aws-lambda-graphql) is a different GraphQL server that does support subscriptions on Lambda. Aside from subscriptions, FaaS is a great fit for GraphQL:

- GraphQL only has a single route, so we only need a single function.
- The only thing stored in memory between requests is the data source cache, and that's easy to swap out with a Redis cache.

Since our app does use subscriptions, let's use Heroku, a PaaS that supports Node. 

It's worth noting that another option would be to split our application layer into two servers: 

- one that handles Queries and Mutations over HTTP, hosted on a FaaS
- one that handles Subscriptions over WebSockets, hosted on a PaaS

The former could publish subscription events to Redis, which the latter could subscribe to.

### Deploying

> If you’re jumping in here, `git checkout 25_0.1.0` (tag [25_0.1.0](https://github.com/GraphQLGuide/guide-api/tree/25_0.1.0), or compare [25...26](https://github.com/GraphQLGuide/guide-api/compare/25_0.1.0...26_0.1.0))

In this section we'll deploy our server to the Heroku PaaS, see how it breaks, and then fix it 🤓. 

We start by [creating an account](https://signup.heroku.com/dc). Then we do the following steps:

```sh
$ cd guide-api/
$ brew install heroku/brew/heroku
$ heroku login
$ heroku create
$ git push heroku 25:master
$ heroku open
```

1. `brew install heroku/brew/heroku`—Install the `heroku` command-line tool.
2. `heroku login`—Login using the account we just created.
3. `heroku create`—Create a new Heroku app. This registers our server with Heroku and reserves a name (which is used in the deployed URL: `https://app-name.herokuapp.com/`). It also adds a Git remote named `heroku`.
4. `git push heroku 25:master`—Git push to the master branch of the Heroku remote. When Heroku receives the updated code, it builds and runs the server. This command assumes we currently have branch 25 checked out on our machine. If we were on master, we could just run `git push heroku master`.
5. `heroku open`—Open the deployed URL in the browser.

On the page that's opened (`https://app-name.herokuapp.com/`) we see "Application error," which we can investigate by viewing the logs:

```sh
$ heroku logs
```

We see lots of logs, including:

```
2019-10-30T12:50:33.923678+00:00 heroku[web.1]: Error R10 (Boot timeout) -> Web process failed to bind to $PORT within 60 seconds of launch
2019-10-30T12:50:33.951435+00:00 heroku[web.1]: Stopping process with SIGKILL
```

When Heroku runs our code, it provides a `PORT` environment variable, and waits for our code to start a server on that port. If our code doesn't do so within a minute, Heroku kills the process running our code. We're running our server on port 4000, so it killed us. 💀😞

Let's update our code to use `PORT`:

`src/index.js`

```js
server
  .listen({ port: process.env.PORT || 4000 })
  .then(({ url }) => console.log(`GraphQL server running at ${url}`))
```

We fall back to `4000` in development, where there is no `PORT` environment variable. Now to test, we can run `heroku logs --tail` in one terminal (`--tail` keeps the command running, displaying log lines in realtime) and deploy in another. Since the deployment process for Heroku is `git push`, we have to create a new commit, so that the updated code is part of the push.

```sh
$ git add src/index.js
$ git commit -m 'Listen on process.env.PORT in production'
$ git push heroku 25:master
```

After the last command, we start seeing log lines like this (plus timestamps) in the first terminal:

```
$ heroku logs --tail
...
app[api]: Build started by user  loren@graphql.guide
heroku[web.1]: State changed from crashed to starting
app[api]: Release v4 created by user  loren@graphql.guide
app[api]: Deploy 4f2d2e92 by user  loren@graphql.guide
app[api]: Build succeeded
heroku[web.1]: Starting process with command `npm start`
app[web.1]: 
app[web.1]: > guide-api@0.1.0 start /app
app[web.1]: > node dist/index.js
app[web.1]: 
app[web.1]: GraphQL server running at http://localhost:7668/
app[web.1]: (node:23) UnhandledPromiseRejectionWarning: MongoNetworkError: failed to connect to server [localhost:27017] on first connect [Error: connect ECONNREFUSED 127.0.0.1:27017
heroku[web.1]: State changed from starting to up
app[web.1]: Error: GraphQL Error (Code: 401): {"response":{"message":"Bad credentials","documentation_url":"https://developer.github.com/v4","status":401},"request":{"query":"\nquery GuideStars {\n  repository(owner: \"GraphQLGuide\", name: \"guide\") {\n    stargazers {\n      totalCount\n    }\n  }\n}\n"}}
```

Heroku is no longer killing us! 🎉💃 

> Speaking of which, we can kill the logs process by hitting `Ctrl-C`.

The label `[web.1]` identifies which *dyno* (Heroku's term for a container) the log comes from. By default, our app only has one dyno, but we could scale up to multiple if we wanted. The lines labeled `heroku` are the dyno's general state changes:

```
heroku[web.1]: State changed from crashed to starting
heroku[web.1]: Starting process with command `npm start`
heroku[web.1]: State changed from starting to up
```

The lines labeled `app` are more granular, and include all output from our server process. The last two of them are errors that we'll fix in the next two sections:

```
app[web.1]: (node:23) UnhandledPromiseRejectionWarning: MongoNetworkError: failed to connect to server [localhost:27017] on first connect [Error: connect ECONNREFUSED 127.0.0.1:27017

app[web.1]: Error: GraphQL Error (Code: 401): {"response":{"message":"Bad credentials","documentation_url":"https://developer.github.com/v4","status":401},"request":{"query":"\nquery GuideStars {\n  repository(owner: \"GraphQLGuide\", name: \"guide\") {\n    stargazers {\n      totalCount\n    }\n  }\n}\n"}}
```

### Environment variables

> If you’re jumping in here, `git checkout 26_0.1.0` (tag [26_0.1.0](https://github.com/GraphQLGuide/guide-api/tree/26_0.1.0).

There are a couple outstanding errors with our deployment. Let's look at this one:

```
app[web.1]: Error: GraphQL Error (Code: 401): {"response":{"message":"Bad credentials","documentation_url":"https://developer.github.com/v4","status":401},"request":{"query":"\nquery GuideStars {\n  repository(owner: \"GraphQLGuide\", name: \"guide\") {\n    stargazers {\n      totalCount\n    }\n  }\n}\n"}}
```

It's an error response from our `GuideStars` query which our server is sending to GitHub's API. The error message is `Bad credentials`. Credentials are provided in the authorization header:

`src/data-sources/Github.js`

```js
const githubAPI = new GraphQLClient('https://api.github.com/graphql', {
  headers: {
    authorization: `bearer ${process.env.GITHUB_TOKEN}`
  }
})
```

The problem is the `GITHUB_TOKEN` environment variable isn't defined, because our `.env` file isn't in Git, which means that Heroku didn't get a copy of it when we did `git push`. In order to set environment variables, PaaS and FaaS providers have a web UI and/or command-line tool. Heroku has both—let's use the command-line tool:

```
$ heroku config:set GITHUB_TOKEN=...
Setting GITHUB_TOKEN and restarting ⬢ graphql-guide... done, v5
GITHUB_TOKEN: ...
```

> We replace `...` with the value from our `.env` file.

Heroku restarts the server in order to provide the new environment variable. We can now see with `heroku logs` that the `Bad credentials` error doesn't appear after the restart. 

We need to also set our other environment variable from `.env`:

```
$ heroku config:set SECRET_KEY=...
```

## Database hosting

* [MongoDB hosting](11.md#mongodb-hosting)
* [Redis hosting](11.md#redis-hosting)
  * [Redis PubSub](11.md#redis-pubsub)
  * [Redis caching](11.md#redis-caching)

### MongoDB hosting

> If you’re jumping in here, `git checkout 26_0.1.0` (tag [26_0.1.0](https://github.com/GraphQLGuide/guide-api/tree/26_0.1.0), or compare [26...27](https://github.com/GraphQLGuide/guide-api/compare/26_0.1.0...27_0.1.0))

Our last error is:

```
app[web.1]: (node:23) UnhandledPromiseRejectionWarning: MongoNetworkError: failed to connect to server [localhost:27017] on first connect [Error: connect ECONNREFUSED 127.0.0.1:27017
```

The error is coming from MongoDB, which we're setting up with:

`src/db.js`

```js
const URL = 'mongodb://localhost:27017/guide'

export const connectToDB = async () => {
  const client = new MongoClient(URL, { useNewUrlParser: true })
  await client.connect()
  db = client.db()
  return client
}
```

In production, `localhost` is our Heroku container, which doesn't have a MongoDB database server running on it. We need a place to host our database, and then we can use that URL instead of `mongodb://localhost:27017/guide`. 

We have similar options to our Node [deployment options](#options): on-prem, IaaS, and DBaaS (similar to PaaS). Most people choose DBaaS. (With on-prem we'd have to house the machines, and with IaaS we'd have to configure and manage the OS and database software ourselves.) MongoDB, Inc. runs their own DBaaS called [Atlas](https://www.mongodb.com/cloud/atlas). Let's use its free tier to get a production MongoDB server. During setup, we have a choice of which cloud provider we want our database hosted on (AWS, Google Cloud Platform, or Azure), and within a cloud provider, which region:

![List of AWS regions with us-east-1 selected](img/atlas-regions.png)

As discussed in the [Latency](bg.md#latency) background section, we want to pick provider and region closest to our Heroku GraphQL server. Here are all the Heroku regions:

```sh
$ heroku regions
ID         Location                 Runtime
─────────  ───────────────────────  ──────────────
eu         Europe                   Common Runtime
us         United States            Common Runtime
dublin     Dublin, Ireland          Private Spaces
frankfurt  Frankfurt, Germany       Private Spaces
oregon     Oregon, United States    Private Spaces
sydney     Sydney, Australia        Private Spaces
tokyo      Tokyo, Japan             Private Spaces
virginia   Virginia, United States  Private Spaces
```

Our server is in the default region, `us`. We can look up more information about `us` using Heroku's API:

```sh
$ curl -n -X GET https://api.heroku.com/regions/us -H "Accept: application/vnd.heroku+json; version=3"
{
  "country":"United States",
  "created_at":"2012-11-21T20:44:16Z",
  "description":"United States",
  "id":"59accabd-516d-4f0e-83e6-6e3757701145",
  "locale":"Virginia",
  "name":"us",
  "private_capable":false,
  "provider":{
    "name":"amazon-web-services",
    "region":"us-east-1"
  },
  "updated_at":"2016-08-09T22:03:28Z"
}
```

Under the `provider` attribute, we can see that the Heroku `us` region is hosted on AWS's `us-east-1` region. So let's pick `AWS` and `us-east-1` for our Atlas database hosting location. Now it will take less than a millisecond for our GraphQL server to talk to our database.

After a few minutes, our cluster has been created, and we can click the "Connect" button:

![Atlas dashboard with our cluster](img/atlas-cluster.png)

The first step is "Whitelist your connection IP address." IP *safelisting* (formerly known as "whitelisting") is only allowing certain IP addresses to connect to the database. The IP address we want to be able to connect to the database is the IP of our GraphQL server. However, our Heroku dynos have different IPs, and the [IPs of `us-east-1`](https://docs.aws.amazon.com/general/latest/gr/aws-ip-ranges.html) change over time. And even if they were static, it wouldn't be very secure to list them, as an attacker could rent a machine in `us-east-1` to run their code on. We could use a [Heroku add-on](https://elements.heroku.com/addons/categories/network) to provide a static outbound IP address for all of our dynos, but for now let's go the easy and less secure route of safelisting all IP addresses: `0.0.0.0/0` denotes the range of all addresses.

> This issue isn't specific to Heroku or MongoDB—it applies to any database that's used by any server platform with shared IP addresses.

Next we create a username and password, and on the "Choose a connection method" step, we choose "Connect your application", and copy the connection string, which looks like this:

```
mongodb+srv://<username>:<password>@cluster0-9ofk6.mongodb.net/test?retryWrites=true&w=majority
```

The `cluster0-*****.mongodb.net` domain is the domain of our new MongoDB cluster, which can contain multiple databases. The `/test?` part determines the default database. Let's change ours to `/guide?`. We also need to replace `<username>` and `<password>` with the user we created.

Then we can set our URL as an environment variable:

```
$ heroku config:set MONGO_URL="mongodb+srv://***:***@cluster0-*****.mongodb.net/guide?retryWrites=true&w=majority"
```

And finally we can reference it in the code:

`src/db.js`

```js
const URL = process.env.MONGO_URL || 'mongodb://localhost:27017/guide'
```

Our new database is empty. We can either recreate our user document using Compass or run this command to copy all of our users and reviews from our local database to the production database:

`mongodump --archive --uri "mongodb://localhost:27017/guide" | mongorestore --archive --uri "mongodb+srv://..."`

> Replace `mongodb+srv://...` with your URL.

After we commit and push to heroku, we can see that our server is error-free! 💃

```sh
$ heroku logs
heroku[web.1]: Starting process with command `npm start`
app[web.1]: 
app[web.1]: > guide-api@0.1.0 start /app
app[web.1]: > node dist/index.js
app[web.1]: 
app[web.1]: GraphQL server running at http://localhost:33029/
heroku[web.1]: State changed from starting to up
```

### Redis hosting

Background: [Redis](bg.md#redis)

> If you’re jumping in here, `git checkout 27_0.1.0` (tag [27_0.1.0](https://github.com/GraphQLGuide/guide-api/tree/27_0.1.0), or compare [27...28](https://github.com/GraphQLGuide/guide-api/compare/27_0.1.0...28_0.1.0))

There are two parts of our app that are only meant to run in development, and we need to change for production:

- Apollo Server's included `PubSub` implementation, which we use for subscriptions.
- Apollo Server's default cache, which is used by data sources.

Both of these things were designed to work when the server is run as a single continuous process. In production, there are usually multiple processes/containers/servers, PaaS containers are subject to being restarted, and FaaS definitely isn't continuous. 

We'll use a `PubSub` implementation and cache library that were designed for [Redis](bg.md#redis), the most popular caching (in-memory) database. 

#### Redis PubSub

Our current `PubSub` comes from `apollo-server`:

`src/util/pubsub.js`

```js
import { PubSub } from 'apollo-server'

export const pubsub = new PubSub()
```

There are many different [`PubSub` implementations](https://www.apollographql.com/docs/apollo-server/data/subscriptions/#pubsub-implementations) for different database and queue software. We'll use `RedisPubSub` from [`'graphql-redis-subscriptions'`](https://github.com/davidyaha/graphql-redis-subscriptions) when we're in production:

```js
import { PubSub } from 'apollo-server'
import { RedisPubSub } from 'graphql-redis-subscriptions'

import { getRedisClient } from './redis'

const inProduction = process.env.NODE_ENV === 'production'

const productionPubSub = () => new RedisPubSub({
  publisher: getRedisClient(),
  subscriber: getRedisClient()
})

export const pubsub = inProduction ? productionPubSub() : new PubSub()
```

We have the same line checking `NODE_ENV` in `formatError.js`. Let's deduplicate by adding a new file:

`src/env.js`

```js
export const inProduction = process.env.NODE_ENV === 'production'
```

`src/formatError.js`

```js
import { inProduction } from './env'
```

`src/util/pubsub.js`

```js
import { inProduction } from '../env'
```

The one piece we haven't seen yet is `getRedisClient`:

`src/util/redis.js`

```js
import Redis from 'ioredis'

const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = process.env

const options = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  retryStrategy: times => Math.min(times * 50, 1000)
}

export const getRedisClient = () => new Redis(options)
```

We use our preferred Redis client library, [`ioredis`](https://www.npmjs.com/package/ioredis). The `retryStrategy` function returns how long to wait (in milliseconds) before trying to re-connect to the server when the connection is broken.

We need a public Redis server to connect to. For that we'll use Redis Labs, the sponsor of Redis. They have a DBaaS, and it includes a [free 30MB tier](https://redislabs.com/redis-enterprise-cloud/essentials-pricing/) that we can sign up for. During sign-up, we have to choose a cloud provider and region (we'll use AWS and us-east-1, since that's where our GraphQL server is hosted) as well as an eviction policy: `allkeys-lfu`. An eviction policy determines which keys get deleted when the 30MB of memory is full, and `lfu` stands for least frequently used. Once we've signed up, we'll have connection info like this:

`.env`

```
REDIS_HOST=redis-10042.c12.us-east-1-4.ec2.cloud.redislabs.com
REDIS_PORT=10042
REDIS_PASSWORD=abracadabra
```

Once they're added to our `.env`, our `getRedisClient()` function (and our pubsub system) should start working. 

> We can check to make sure it's connecting to the right Redis server by turning on debug output: in the `dev` script in our `package.json`, add `DEBUG=ioredis:* ` before `babel-node src/index.js`.

We can test our new Redis-backed pubsub by making a subscription in Playground, unstarring and starring the repo [on GitHub](https://github.com/GraphQLGuide/guide), and checking that two events appear:

![githubStars subscription in Playground with two events](img/githubStars-subscription.png)

#### Redis caching

Apollo Server's default cache for data sources is an in-memory LRU cache (*LRU* means that when the cache is full, the *least recently used* data gets evicted). To ensure that our data source classes across multiple containers have the same cached data, we'll switch to a Redis cache. The ['apollo-server-cache-redis'](https://www.npmjs.com/package/apollo-server-cache-redis) library provides `RedisCache`:

`src/util/redis.js`

```js
import Redis from 'ioredis'
import { RedisCache } from 'apollo-server-cache-redis'

const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = process.env

const options = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  retryStrategy: times => Math.min(times * 50, 1000)
}

export const getRedisClient = () => new Redis(options)

export const cache = new RedisCache(options)

export const USER_TTL = { ttl: 60 * 60 } // hour
```

We added the `cache` and `USER_TTL` exports. Now we can add `cache` to the `ApolloServer` constructor:

`src/index.js`

```js
import { cache } from './util/redis'

const server = new ApolloServer({
  typeDefs,
  resolvers,
  dataSources,
  context,
  formatError,
  cache
})
```

To use caching, we have to set a *TTL* (time to live) with our calls to `findOneById`. This denotes how many seconds an object will be kept in the cache, during which calls to `findOneById` with the same ID will return the cached object instead of querying the database. We choose a TTL based on our app requirements and how often our objects change. Our user documents rarely change, and it wouldn't be a big deal for one to be less than an hour out of date after a change, so we can set the TTL for user documents to an hour (60 * 60 seconds). We're not currently using `findOneById` for reviews, but if we did, we might use a lower TTL—maybe a minute—since reviews might get edited, and we might want the edits to be reflected sooner in the app.

Now let's add `USER_TTL` to our `User` and `Review` resolvers:

`src/resolvers/User.js`

```js
import { USER_TTL } from '../util/redis'

export default {
  Query: {
    me: ...
    user: (_, { id }, { dataSources }) => {
      try {
        return dataSources.users.findOneById(ObjectId(id), USER_TTL)
      } catch (error) {
        if (error.message === OBJECT_ID_ERROR) {
          throw new InputError({ id: 'not a valid Mongo ObjectId' })
        } else {
          throw error
        }
      }
    },
    searchUsers: ...
  },
  ...
}
```

`src/resolvers/Review.js`

```js
import { USER_TTL } from '../util/redis'

export default {
  Query: {
    reviews: ...
  },
  Review: {
    id: ...
    author: (review, _, { dataSources }) =>
      dataSources.users.findOneById(review.authorId, USER_TTL),
    fullReview: async (review, _, { dataSources }) => {
      const author = await dataSources.users.findOneById(
        review.authorId,
        USER_TTL
      )
      return `${author.firstName} ${author.lastName} gave ${review.stars} stars, saying: "${review.text}"`
    },
    createdAt: ...
  },
  ...
}
```

Now after we make a query like `{ reviews { fullReview } }`, we should be able to see a user object stored in Redis. To view the database's contents, we can use the command line (`brew install redis` and then `redis-cli -h`) or a GUI like [Medis](http://getmedis.com/):

![Cache key with corresponding user object](img/redis-cached-user.png)

The cache key has the format `mongo-[collection]-[id]`, and the value is a string, formatted by Medis as JSON. We can also see the remaining TTL on the bottom right.

Finally, let's get Redis working in production. We update our environment variables on Heroku with:

```sh
$ heroku config:set \
REDIS_HOST=redis-10042.c12.us-east-1-4.ec2.cloud.redislabs.com \
REDIS_PORT=10042 \
REDIS_PASSWORD=abracadabra
```

And we push the latest code:

```sh
$ git commit -am 'Add Redis pubsub and caching'
$ git push heroku 27:master
```

We'll learn in the next section how to query our production API. We can test our Redis in production by deleting the `mongo-users-foo` key, making the same `{ reviews { fullReview } }` query, and then refreshing Medis to ensure that the key has been recreated.

### Querying in production

> If you’re jumping in here, `git checkout 28_0.1.0` (tag [28_0.1.0](https://github.com/GraphQLGuide/guide-api/tree/28_0.1.0).

Now when we visit our `app-name.herokuapp.com`, instead of "Application error" we see:

```
GET query missing.
```

Usually GraphQL requests are sent by POST, but Apollo Server also supports receiving GETs. The browser is making a `GET /` request when we load the page, but the format that Apollo supports is `GET /?query=X`. Let's test it with the `{ hello }` query:

[`app-name.herokuapp.com/?query={hello}`](https://graphql-guide.herokuapp.com/?query={hello})

![Webpage showing JSON GraphQL response](img/hello-get-query.png)

This method of querying our production server works, but it gets inconvenient when queries get large or use variables, and we can't add an authorization header. The method we were using before, GraphQL Playground, is disabled by default in production. However, we can use the [Playground app](https://github.com/prisma-labs/graphql-playground/releases) (download the latest `.dmg` or `.exe` file) to query any GraphQL API. First we select "URL ENDPOINT" and enter our production URL:

![Playground app's "New Workspace" screen](img/playground-app-url.png)

And then we query:

![hello query and response in Playground app](img/playground-app-hello.png)

While the query returns a response, we see the "Server cannot be reached" error, and query autocompletion doesn't work, and the schema tab doesn't load. These are all because *introspection*, the queries that return the schema, are disabled by default in production in order to obscure private APIs. If we were publishing a public API that we wanted 3rd party apps to query, we would want to enable at least introspection (and probably Playground as well) to make it easier for the 3rd party developers to query our API. We can enable both introspection and Playground in production by adding the last two options below:

`src/index.js`

```js
const server = new ApolloServer({
  typeDefs,
  resolvers,
  dataSources,
  context,
  formatError,
  introspection: true,
  playground: true
})
```

```
$ git add src/index.js
$ git commit -m 'Enable introspection and Playground'
$ git push heroku 26:master
```

Now we can view the schema in the Playground app, and if we visit our index URL, the Playground website will load:

[`app-name.herokuapp.com/`](https://graphql-guide.herokuapp.com/)

If we want to undo the change, we can:

```
$ git reset HEAD^
$ git checkout -- src/index.js
$ git push heroku 26:master -f
```

We need the `-f` (force push) because a normal push will fail, since the `heroku` remote has a different understanding of what the branch looks like (it still has the "Enable introspection and Playground" commit as the branch tip).

In summary, the ways we can interactively query our production GraphQL server are:

- `GET /?query=X`
- Playground app without introspection
- Playground app with introspection (the server must have introspection enabled)
- Playground website, if the server has it enabled

And we can, of course, continue to query it with POST requests on the command line or in code.

## Analytics

> If you’re jumping in here, `git checkout 28_0.1.0` (tag [28_0.1.0](https://github.com/GraphQLGuide/guide-api/tree/28_0.1.0).

There are different types of server analytics that can be useful to track, and different tools that gather data and display analytics. In this section we'll cover a few of each.

The types of analytics can be split into two categories: those at the operating system (OS) level, and those at the code level. At the OS level, there is:

- Memory usage
- CPU usage
- Request statistics:
  - Rate (e.g. 1000 requests received per second)
  - Response times (e.g. 95% of responses are sent within 100ms of receiving the request)
  - Error rates (e.g. 1% of responses have an HTTP code in the 500-599 range)

The code level can also measure things based on details in the code, for instance [Express](https://en.wikipedia.org/wiki/Express.js) route names or GraphQL field usage. A popular APM (*application performance management*) tool that can do code-level measurement is [New Relic], which has an npm library that tracks requests by route name for a list of [supported frameworks](https://docs.newrelic.com/docs/agents/nodejs-agent/getting-started/compatibility-requirements-nodejs-agent) like Express. It also can monitor the performance of calls to several different databases, and it provides functions for custom instrumentation/metrics. 

The main APM tool for GraphQL servers is Apollo's Graph Manager, which tracks the request statistics listed above as well as:

- Queries received
- Fields selected
- Resolver timelines
- Clients
- Deprecated field usage
- GraphQL Errors

For memory and CPU usage, we could either use Heroku's [built-in metrics](https://devcenter.heroku.com/articles/metrics#metrics-gathered-for-all-dynos) or New Relic. However, these OS-level metrics are becoming less important, given the prevalence of autoscaling (where the PaaS automatically adds more containers when under a higher load) and serverless (where we usually don't have to think about memory and CPU).

For the rest, let's set up Graph Manager. First we [sign up](https://engine.apollographql.com/signup), then we get an API key to set for the `ENGINE_API_KEY` env variable:

`.env`

```
ENGINE_API_KEY=service:guide-api:*****
```

We now start our server with `npm run dev`, and once it has finished starting up, run this command in another terminal:

```
$ npx apollo service:push --endpoint="http://localhost:4000"
```

This sends Apollo our schema, which is used for GraphQL analytics and other Graph Manager features like [schema change validation](#schema-validation). When we change our schema, we need to re-run the command. Usually this is done automatically as part of [continuous integration](bg.md#continuous-integration) ([CircleCI example](https://www.apollographql.com/docs/graph-manager/schema-registry/#registering-a-schema-via-continuous-delivery)).

We can now make some queries in Playground, reload [Graph Manager](https://engine.apollographql.com/), select "Metrics" from the menu, and see server analytics!

If we only want to see production analytics, we can remove `ENGINE_API_KEY` from `.env` and set it on Heroku:

```
$ heroku config:set ENGINE_API_KEY="service:guide-api:*****"
```

Here is an example metrics dashboard:

![Metrics page of Graph Manager](img/graph-manager-metrics.png)

We see:

- A low request rate of 0.094 rpm (requests per minute). The operation with the highest request rate (0.083 rpm) begins with `fragment FullType`. (We can also see this operation has 120 total requests on the right in the Filters sidebar.)
- A low p95 service time of 17.7ms (95% of requests are responded to within 17.7ms).
- A high error rate of 92.65%. Most of the errors come from the `fragment FullType` operation, which is sent by Playground to request the schema (and fails because introspection is disabled on this production server).
- Request rate over time, and after scrolling down, request latency over time and request latency distribution.

We can also see how hard it is to differentiate unnamed queries—for instance the four different `searchUsers` queries. In order to see which query for instance has the second-slowest service time, we'd need to select it and then select the "Operation" tab:

![Unnamed operation in Graph Manager](img/graph-manager-unnamed-operation.png)

The "Traces" tab shows us the timeline of when resolvers are called and how long they take to complete. Here's a `reviews` query and its trace:

```gql
{
  reviews {
		text
    stars
    author {
      firstName
    }
  }
}
```

![Trace in Graph Manager](img/graph-manager-trace.png)

The `reviews` resolver fetches the list of reviews, which takes 3.57ms, and then Apollo server calls `Review.*` field resolvers, starting with the first review (`reviews.0` in the trace), and ending with `reviews.11`, which is expanded so that we can see the timing of the field resolvers. `Review.text` and `Review.stars` return immediately, since they're just fields on the review object, but `Review.author` requires a database lookup. That lookup (which is actually the same lookup for reviews 0–10, as all the reviews have the same author and our datasource uses Dataloader) takes 2.76ms, after which the `User.firstName` resolver returns immediately, and the entire query response is ready to send to the client.

The Filters sidebar lets us filter by time range or by operation, but we can also filter by client type and version. To do that, we select "Clients" from the left sidebar. Now clients are listed on the left half of the page. Currently we only see one labeled "Unidentified clients" and "All versions." That's because none of our clients have identified themselves! They do so by setting two headers, `apollographql-client-name` (like "webapp", "iOS-app", "marketing-script", etc.) and `apollographql-client-version` (like `0.1.0`, `v2`, etc.). Let's open the HTTP headers section of Playground and enter these:

```
{
  "apollographql-client-name":"playground-test",
  "apollographql-client-version":"0.1.0"
}
```

> When using Apollo Client, we can use the `name` and `version` constructor options: `new ApolloClient({ link, cache, name: 'web', version: '1.0' })`.

Then if we run a query, change the version, run more queries, and refresh Graph Manager, we'll see the new client type with two versions:

![Clients page of Graph Manager](img/graph-manager-clients.png)

Selecting a version and then an operation on the right takes us to the metrics page of that query for that client version. We can also look at other operations used by that client in the Filters sidebar.

## Error reporting

> If you’re jumping in here, `git checkout 28_0.1.0` (tag [28_0.1.0](https://github.com/GraphQLGuide/guide-api/tree/28_0.1.0), or compare [28...29](https://github.com/GraphQLGuide/guide-api/compare/28_0.1.0...29_0.1.0))

In this section we'll look at what kind of error reporting Graph Manager covers, and then we'll look at a dedicated error reporting service.

In the [last section](#analytics) we set up Apollo's Graph Manager and looked at its analytics. The one tab of the Metrics page we didn't get to is the Errors tab:

![General errors page of Graph Manager](img/graph-manager-errors.png)

The general errors page (without an operation selected) shows a timeline of total error count, followed by a list of all errors within the current time range, grouped by where they occurred—either in a specific resolver, like the `user.email` errors at the bottom, or before the server starts calling resolvers (labeled as "outside of the GraphQL context" above). The latter category often includes failures parsing or validating the request's operation: in this example, the validation fails because the operation includes a `__schema` root Query field, but the field is not in the schema because introspection is turned off. 

We can expand the instances links to get a list of times and operations in which the error occurred:

![Error instances expanded](img/graph-manager-error-instances.png)

And when we have an operation selected, the Errors tab only shows us errors that occurred during the execution of that operation.

There are a few features that Graph Manager doesn't have that would be useful:

- Stack traces
- The contents of the `extensions` field of the GraphQL error (above we only see the `message` field)
- The ability to attach further information, like the current user
- The ability to ignore errors or mark them as fixed
- Team features like the ability to attach notes or assign errors to people
- The ability to search through the errors

There are a few error tracking services that provide these features. We'll set up [Sentry](https://sentry.io/)—one of the most popular ones—but setting up another service would work similarly.

First we [create an account](https://sentry.io/signup/), and then we create our first Sentry project, choosing Node.js as the project type. We're given a statement like `Sentry.init({ dsn: 'https:://...' })` with our new project's ID filled in, which we paste into our code:

`src/formatError.js`

```js
import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: 'https://ceb14feec00b4c49bebd10a9674bb68d@sentry.io/5168151'
})
```

Now Sentry automatically gathers uncaught errors like this one:

```js
Sentry.init({
  dsn: 'https://ceb14feec00b4c49bebd10a9674bb68d@sentry.io/5168151'
})

myUndefinedFunction()
```

Within seconds of `npm run dev`, we should see a new error in our Sentry dashboard:

![The error detail page of the Sentry web app](img/sentry-uncaught-error.png)

We see the time, error message, stack trace, and line of code. And if the same error happens again, it will be grouped with this one so that we can see total number of occurrences and graph occurrences over time.

This is all really useful, but the issue is that Apollo server catches all errors that occur during GraphQL requests, which is where most of our errors will be occurring. In order to have Sentry gather those errors, we can use one of two `ApolloServer()` options:

- `formatError` function
- `plugins` array with a new plugin we write

The first is simpler, and we're already using it:

`src/index.js`

```js
import formatError from './formatError'

const server = new ApolloServer({
  typeDefs,
  resolvers,
  dataSources,
  context,
  formatError,
  cache
})
```

`src/formatError.js`

```js
export default error => {
  if (inProduction) {
    // send error to tracking service
  } else {
    console.log(error)
    console.log(get(error, 'extensions.exception.stacktrace'))
  }

  const name = get(error, 'extensions.exception.name') || ''
  if (name.startsWith('Mongo')) {
    return new InternalServerError()
  } else {
    return error
  }
}
```

We're currently using the `formatError()` function to log errors in development and mask errors involving MongoDB. We can call `Sentry.captureException()` to tell Sentry about errors:

```js
import get from 'lodash/get'
import * as Sentry from '@sentry/node'
import { AuthenticationError, ForbiddenError } from 'apollo-server'

import { InternalServerError, InputError } from './util/errors'

const NORMAL_ERRORS = [AuthenticationError, ForbiddenError, InputError]
const NORMAL_CODES = ['GRAPHQL_VALIDATION_FAILED']
const shouldReport = e =>
  !NORMAL_ERRORS.includes(e.originalError) &&
  !NORMAL_CODES.includes(get(e, 'extensions.code'))

export default error => {
  if (inProduction) {
    if (shouldReport(error)) {
      Sentry.captureException(error.originalError)
    }
  } else {
    console.log(error)
    console.log(get(error, 'extensions.exception.stacktrace'))
  }

  ...
}
```

The `error` the function receives is the GraphQL error that's included in the response to the client. To get the Node.js error object (which is what Sentry expects), we do `error.originalError`. We also use `shouldReport()` to avoid reporting normal errors, like auth and query format errors, since we don't need to track and fix them. 

> If we had a public API, we might want to track query parsing errors in case we find that developers consistently make certain mistakes, in which case we could try to improve our schema or documentation.

To test, we can run `NODE_ENV=production npm run dev` and add an error to `Query.hello`:

`src/resolvers/index.js`

```js
const resolvers = {
  Query: {
    hello: () => '🌍🌏🌎' && myUndefinedFunction(),
    isoString: (_, { date }) => date.toISOString()
  }
}
```

![Sentry website with a list of 2 errors](img/sentry-formatError.png)

We can see the error message is the same, but the new entry shows a different function and file: `hello(resolvers:index)`.

If we want to track more information in Sentry, like details about the request and context (such as the current user), then we need to use a plugin instead of `formatError`. We use the `plugins` option:

```
const server = new ApolloServer({
  typeDefs,
  resolvers,
  dataSources,
  context,
  formatError,
  cache,
  plugins: [sentryPlugin]
})
```

And we create `sentryPlugin` according to the [plugin docs](https://www.apollographql.com/docs/apollo-server/integrations/plugins/), defining the [`didEncounterErrors()`](https://www.apollographql.com/docs/apollo-server/integrations/plugins/#didencountererrors) method and using [`Sentry.withScope()`](https://docs.sentry.io/enriching-error-data/scopes/?platform=node#local-scopes).

One last thing to consider is that if our server is not running—if something happened to our Node.js process or our machine—we won't be receiving errors in Sentry. In many cases we won't need to worry about this: for instance a Node.js PaaS will automatically monitor and restart the process, and for a FaaS it's irrelevant. But if it is relevant for our deployment setup, we can use an uptime / monitoring service that pings our server to see if it's still reachable over the internet and responsive. The URL we can use for that (as well as for a load balancer, if we're using one) is `/.well-known/apollo/server-health`, which should return status 200 and this JSON:

![Chrome navigated to the health check path on localhost:4000 and showing {status: "pass"}](img/health-check.png)

# More data sources

* [SQL](11.md#sql)
  * [SQL setup](11.md#sql-setup)
  * [SQL data source](11.md#sql-data-source)
  * [SQL testing](11.md#sql-testing)
  * [SQL performance](11.md#sql-performance)
* [REST](11.md#rest)
* [GraphQL](11.md#graphql)
* [Custom data source](11.md#custom-data-source)
* [Prisma](11.md#prisma)

There are lots of other sources of data out there we might want to use in our GraphQL servers, and when we want to query one, we use a *data source*. Usually in this chapter when we use the term "data source", we're talking about a JavaScript class that has Apollo's `DataSource` class as an ancestor, like the `MongoDataSource` we [used earlier](#data-sources). There are data sources on npm that others have written, and we can write our own. There are also alternatives, one of which we'll cover at the end, Prisma.

## SQL

Background: [SQL](bg.md#sql)

Contents:

* [SQL setup](11.md#sql-setup)
* [SQL data source](11.md#sql-data-source)
* [SQL testing](11.md#sql-testing)
* [SQL performance](11.md#sql-performance)

In this section we replace our use of MongoDB with SQL. In the first part we'll get our SQL database and table schemas set up. Then we'll replace our use of `MongoDataSource` with `SQLDataSource`. Then in [SQL testing](11.md#sql-testing) we update our tests, and finally in [SQL performance](11.md#sql-performance) we improve our server's database querying.

### SQL setup

> If you’re jumping in here, `git checkout 25_0.1.0` (tag [25_0.1.0](https://github.com/GraphQLGuide/guide-api/tree/25_0.1.0), or compare [25...sql](https://github.com/GraphQLGuide/guide-api/compare/25_0.1.0...sql_0.1.0))

A [SQL database](bg.md#sql) takes more setup than the MongoDB database we've been using: we need to write *migrations*—code that creates or alters tables and their schemas. The most popular Node library for SQL is [Knex](https://knexjs.org/), and it includes the ability to write and run migrations. To start using it, we run `knex init`. Since we already have it in our `node_modules/`, we can run `npx knex init` in a new directory within our repository:

```sh
$ mkdir sql
$ cd sql/
$ npx knex init
```

This creates a config file:

`sql/knexfile.js`

```js
// Update with your config settings.

module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './dev.sqlite3'
    }
  },

  staging: {
    client: 'postgresql',
    connection: {
      database: 'my_db',
      user: 'username',
      password: 'password'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  production: {
    client: 'postgresql',
    ...
  }
}
```

By default it uses **SQLite** and **PostgreSQL** (two types of SQL databases) for development and deployment, respectively.

One aspect of database setup that's easier with SQL than MongoDB is running the database in development—SQLite doesn't need to be installed with Homebrew and run as a service. Instead it can be installed with a Node library and can run off of a single file. So unless we're using a special feature that PostgreSQL supports but SQLite doesn't, we can use SQLite in development. 

We also won't be deploying, so all we need is:

`sql/knexfile.js`

```js
module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './dev.sqlite3'
    },
    useNullAsDefault: true
  }
}
```

(We added `useNullAsDefault: true` to avoid a warning message.)

Now we can use Knex to create a migration that will set up our users and reviews tables:

```sh
$ npx knex migrate:make users_and_reviews
```

This generates a file in the following format:

`sql/migrations/[timestamp]_users_and_reviews.js`

```js
exports.up = function(knex) {

}

exports.down = function(knex) {
  
}
```

Inside the `up` function, we create the two tables, and inside the `down`, we *drop* (delete) them. To do all that we use Knex's [schema-building API](https://knexjs.org/#Schema):

`sql/migrations/20191228233250_users_and_reviews.js`

```js
exports.up = async knex => {
  await knex.schema.createTable('users', table => {
    table.increments('id')
    table.string('first_name').notNullable()
    table.string('last_name').notNullable()
    table.string('username').notNullable()
    table.string('email')
    table
      .string('auth_id')
      .notNullable()
      .unique()
    table.datetime('suspended_at')
    table.datetime('deleted_at')
    table.integer('duration_in_days')
    table.timestamps()
  })
}
```

- `knex.schema.createTable('users'` creates a table named `users`.
- `table.increments('id')` creates a primary index column named `id`. It's auto-incrementing, meaning that the first record that's inserted is given an `id` of 1, and the second record gets an `id` of 2, etc.
- `table.string('first_name').notNullable()` creates a `first_name` column that can hold a string and can't be null.
- `table.string('auth_id').notNullable().unique()` creates an `auth_id` non-nullable string column that has to be unique among all records in the table.
- `table.datetime('suspended_at')` creates a `suspended_at` column that can hold a datetime.
- `table.timestamps()` creates `created_at` and `updated_at` datetime columns.

Similarly, we can create the `reviews` table:

```js
exports.up = async knex => {
  await knex.schema.createTable('users', table => { ... })
  await knex.schema.createTable('reviews', table => {
    table.increments('id')
    table
      .integer('author_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
    table.string('text').notNullable()
    table.integer('stars').unsigned()
    table.timestamps()
  })
}
```

The below part sets up a *foreign key constraint* on `author_id`, so that the only values that can be stored in this column match an `id` field in the `users` table:

```js
    table
      .integer('author_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
```

Finally, we call `dropTable()` in the `down` function:

`sql/migrations/20191228233250_users_and_reviews.js`

```js
exports.up = async knex => {
  await knex.schema.createTable('users', table => { ... })
  await knex.schema.createTable('reviews', table => { ... })
}

exports.down = async knex => {
  await knex.schema.dropTable('users')
  await knex.schema.dropTable('reviews')
}
```

To run our migration `up` function, we use:

```sh
$ npx knex migrate:latest
```

And to undo, we would do `npx knex migrate:rollback --all`. If in the future we want to make a change to the schema, we would create another migration (with a more recent timestamp), eg `[timestamp]_add_deleted_column_to_reviews.js`, that added a `deleted` column to the `reviews` table, and commit it to git. Then whenever a dev was on that version of the code that used the `reviews.deleted` column, they could migrate to latest version of the database, and code modifying a review's `deleted` field would work.

With MongoDB, we didn't have migrations, and we added or changed documents manually. With SQL, we could run migrations that drop our tables and everything in them, so re-inserting records manually would get tedious. So Knex supports *seed files* that we can run to automatically insert records. We start with `seed:make`, which creates an example seed file:

```sh
$ npx knex seed:make users
```

`sql/seeds/users.js`

```js
exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('table_name').del()
    .then(function () {
      // Inserts seed entries
      return knex('table_name').insert([
        {id: 1, colName: 'rowValue1'},
        {id: 2, colName: 'rowValue2'},
        {id: 3, colName: 'rowValue3'}
      ]);
    });
};
```

Now we modify the example file to use async/await and match our `users` table schema:

```js
exports.seed = async knex => {
  await knex('users').del()
  await knex('users').insert([
    {
      id: 1,
      firstName: 'John',
      lastName: 'Resig',
      username: 'jeresig',
      email: 'john@graphql.guide',
      authId: 'github|1615',
      created_at: new Date(),
      updated_at: new Date()
    }
  ])
}
```

And copy the file for inserting reviews:

`sql/seeds/reviews.js`

```js
exports.seed = async knex => {
  await knex('reviews').del()
  await knex('reviews').insert([
    {
      id: 1,
      author_id: 1,
      text: `Now that's a downtown job!`,
      stars: 5,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 2,
      author_id: 1,
      text: 'Passable',
      stars: 3,
      created_at: new Date(),
      updated_at: new Date()
    }
  ])
}
```

We run the seed files with:

```sh
$ npx knex seed:run
```

We can view whether it worked with either the command-line SQLite client or a GUI. The command-line client, `sqlite3`, is included by default on Macs. We give it the database file `sql/dev.sqlite3` as an argument, and then we can run SQL statements like `SELECT * FROM reviews;`.

```sh
$ sqlite3 sql/dev.sqlite3 
SQLite version 3.30.1 2019-10-10 20:19:45
Enter ".help" for usage hints.
sqlite> SELECT * FROM reviews;
1|1|Now that's a downtown job!|5|1578122461308|1578122461308
2|1|Passable|3|1578122461308|1578122461308
```

There are many SQL GUIs. Our favorite is [TablePlus](https://tableplus.com/), which not only works with different types of SQL databases, but other databases as well, including Redis and MongoDB. When creating a new connection, we select SQLite and then the file `sql/dev.sqlite3`, and hit Connect. Then on the left we see the list of tables in our database, and if we double-click `reviews`, we see the table's contents:

![TablePlus app with review records](img/tableplus-reviews.png)

Lastly, we no longer need to connect to a MongoDB database, so we can remove the call to `connectToDB()` in `src/index.js`.

Before we add and commit our changes, we want to add the below line to `.gitignore`:

```
sql/dev.sqlite3
```

We don't want our database in our code repository—it's meant to be generated and modified by each individual developer using our migration and seed scripts.

### SQL data source

> If you’re jumping in here, `git checkout sql_0.1.0` (tag [sql_0.1.0](https://github.com/GraphQLGuide/guide-api/tree/sql_0.1.0), or compare [sql...sql2](https://github.com/GraphQLGuide/guide-api/compare/sql_0.1.0...sql2_0.1.0))

Now that we've got our SQL database set up and we've inserted records, we need to query them. So we look for a SQL data source class to use, either on the [community data sources list](https://www.apollographql.com/docs/apollo-server/data/data-sources/#community-data-sources) in the Apollo docs or searching "apollo data source sql" on Google or npm. We find [`datasource-sql`](https://github.com/cvburgess/SQLDataSource/) which provides the class `SQLDataSource`. 

`SQLDataSource` is unusual among data sources in that:

- a single instance is created (vs a new instance for each request)
- it does caching only, not batching

It also:

- recommends using a single class for the whole database, instead of a class per table as we did with `MongoDataSource`
- uses a specific library—Knex! 

Let's start by creating our data source class:

`src/data-sources/SQL.js`

```js
import { SQLDataSource } from 'datasource-sql'

class SQL extends SQLDataSource {
  // TODO
}

export default SQL
```

Our job will be to fill in the class with methods needed by our resolvers. To know what those methods are, let's go at it from the other direction: creating and using the data source as if it were complete. 

First let's create it. Instead of our current data sources creation:

`src/data-sources/index.js`

```js
import Reviews from './Reviews'
import Users from './Users'
import Github from './Github'
import { db } from '../db'

export default () => ({
  reviews: new Reviews(db.collection('reviews')),
  users: new Users(db.collection('users'))
})

export { Reviews, Users, Github }
```

We do:

```js
import Github from './Github'
import SQL from './SQL'

export const knexConfig = {
  client: 'sqlite3',
  connection: {
    filename: './sql/dev.sqlite3'
  },
  useNullAsDefault: true
}

export const db = new SQL(knexConfig)

export default () => ({ db })

export { Github }
```

The `SQLDataSource` constructor takes the same config we have in our `sql/knexfile.js`. Since we only want a single instance, we move the creation (`new SQL(knexConfig)`) outside of the exported function. Instead of the data source instances being named `reviews` and `users`, it's named `db` (as it is the way to access the whole SQL database).

Now in resolvers, we can use functions like `context.dataSources.db.getReviews()` instead of `context.dataSources.reviews.all()`. And we also need to replace `camelCase` fields with `snake_case`, like `deletedAt -> deleted_at`.

`src/resolvers/User.js`

```js
export default {
  Query: {
    me: ...,
    user: (_, { id }, { dataSources: { db } }) => db.getUser({ id }),
    searchUsers: (_, { term }, { dataSources: { db } }) => db.searchUsers(term)
  },
  UserResult: {
    __resolveType: result => {
      if (result.deleted_at) {
        return 'DeletedUser'
      } else if (result.suspended_at) {
        return 'SuspendedUser'
      } else {
        return 'User'
      }
    }
  },
  SuspendedUser: {
    daysLeft: user => {
      const end = addDays(user.suspended_at, user.duration_in_days)
      return differenceInDays(end, new Date())
    }
  },
  User: {
    firstName: user => user.first_name,
    lastName: user => user.last_name,
    email: ...,
    photo(user) {
      // user.auth_id: 'github|1615'
      const githubId = user.auth_id.split('|')[1]
      return `https://avatars.githubusercontent.com/u/${githubId}`
    },
    createdAt: user => user.created_at,
    updatedAt: user => user.updated_at
  },
  Mutation: {
    createUser(_, { user, secretKey }, { dataSources: { db } }) {
      if (secretKey !== process.env.SECRET_KEY) {
        throw new AuthenticationError('wrong secretKey')
      }

      return db.createUser(user)
    }
  }
}
```

So the `db.*` methods we needed and named are:

```js
db.getUser()
db.searchUsers()
db.createUser()
```

Note that we needed to add resolvers for `firstName`, `lastName`, and `updatedAt` because we no longer have database fields with those exact names (instead we have `first_name`, `last_name`, and `updated_at`).

Next let's update our Review resolvers:

`src/resolvers/Review.js`

```js
export default {
  Query: {
    reviews: (_, __, { dataSources: { db } }) => db.getReviews()
  },
  Review: {
    author: (review, _, { dataSources: { db } }) =>
      db.getUser({ id: review.author_id }),
    fullReview: async (review, _, { dataSources: { db } }) => {
      const author = await db.getUser({ id: review.author_id })
      return `${author.first_name} ${author.last_name} gave ${review.stars} stars, saying: "${review.text}"`
    },
    createdAt: review => review.created_at,
    updatedAt: review => review.updated_at
  },
  Mutation: {
    createReview: (_, { review }, { dataSources: { db }, user }) => {
      ...

      const newReview = db.createReview(review)

      pubsub.publish('reviewCreated', {
        reviewCreated: newReview
      })

      return newReview
    }
  },
  Subscription: {
    reviewCreated: ...
  }
}
```

We reused the `db.getUser()` function and we used two new ones:

```js
db.getReviews()
db.createReview()
```

The Users and Reviews resolvers were the only place we used `context.dataSources`, but we can do a workspace text search for `db.collection` to find any other uses of our MongoDB database. The only match is from our context function in `src/context.js`:

```js
  const user = await db.collection('users').findOne({ authId })
```

In order to update this, we need access to our SQL data source. In `src/data-sources/index.js`, we have this line:

```js
export const db = new SQL(knexConfig)
```

So we can import our new `db` from there.

`src/context.js`

```js
import { db } from './data-sources/'

export default async ({ req }) => {
  ...

    const user = await db.getUser({ auth_id: authId })

  ...
  
  return context
}
```

Now we can implement all the data source methods we're using:

```js
db.getReviews()
db.createReview()
db.createUser()
db.getUser()
db.searchUsers()
```

Inside methods we have access to `this.context`, which has the current user, and `this.knex`, our [Knex instance](http://knexjs.org/#Builder), which we use to construct SQL statements. For example here's `SELECT * FROM reviews;`:

`src/data-sources/SQL.js`

```js
import { SQLDataSource } from 'datasource-sql'

const REVIEW_TTL = 60 // minute

class SQL extends SQLDataSource {
  getReviews() {
    return this.knex
      .select('*')
      .from('reviews')
      .cache(REVIEW_TTL)
  }

  async createReview(review) { ... }
  async createUser(user) { ... }
  async getUser(where) { ... }
  searchUsers(term) { ... }
}

export default SQL
```

The added `.cache()` tells `SQLDataSource` to cache the response for the provided number of seconds.

Next up is `createReview()`, where we get a review from client, need to add the current user's ID as well as timestamps:

```js
class SQL extends SQLDataSource {
  getReviews() { ... }

  async createReview(review) {
    review.author_id = this.context.user.id
    review.created_at = Date.now()
    review.updated_at = Date.now()
    const [id] = await this.knex
      .returning('id')
      .insert(review)
      .into('reviews')
    review.id = id
    return review
  }

  async createUser(user) { ... }
  async getUser(where) { ... }
  searchUsers(term) { ... }
}
```

We tell Knex to return the inserted ID (`.returning('id')`) so that we can add it to the review object and return it. (We weren't doing this before because MongoDB's `collection.insertOne(review)` automatically added an `_id` to `review`.) We do the same for `createUser()`:

```js
class SQL extends SQLDataSource {
  getReviews() { ... }
  async createReview() { ... }

  async createUser(user) {
    const newUser = {
      first_name: user.firstName,
      last_name: user.lastName,
      username: user.username,
      email: user.email,
      auth_id: user.authId,
      created_at: Date.now(),
      updated_at: Date.now()
    }

    const [id] = await this.knex
      .returning('id')
      .insert(newUser)
      .into('users')
    newUser.id = id

    return newUser
  }

  async getUser(where) { ... }
  searchUsers(term) { ... }
}
```

Here we just take the fields out of the user argument (which matches the GraphQL schema) and put them into a `newUser` object that matches the SQL `users` table schema. 

Lastly we have `getUser()` and `searchUser()`. `getUser()` receives an object like `{id: 1}` or `{auth_id: 'github|1615'}`, which can be passed directly to Knex's `.where()`:

```js
const REVIEW_TTL = 60 // minute
const USER_TTL = 60 * 60 // hour

class SQL extends SQLDataSource {
  getReviews() { ... }
  async createReview(review) { ... }
  async createUser(user) { ... }

  async getUser(where) {
    const [user] = await this.knex
      .select('*')
      .from('users')
      .where(where)
      .cache(USER_TTL)

    return user
  }

  searchUsers(term) {
    return this.knex
      .select('*')
      .from('users')
      .where('first_name', 'like', `%${term}%`)
      .orWhere('last_name', 'like', `%${term}%`)
      .orWhere('username', 'like', `%${term}%`)
      .cache(USER_TTL)
  }
}
```

We use a longer TTL for users with the idea that they'll change less often than reviews will. SQL's `like` syntax is followed by a search pattern that can include the `%` wildcard, which takes the place of zero or more characters.

Now let's see if it works by running `npm run dev` and making queries in Playground:

![successful reviews query](img/sql-reviews.png)

😃 Looks like it's working! ...but not if we select a Date field:

![error requesting reviews.createdAt](img/sql-date-error.png)

😞 The stacktrace points to this part of `src/resolvers/Date.js`:

```js
  serialize(date) {
    if (!(date instanceof Date)) {
      throw new Error(
        'Resolvers for Date scalars must return JavaScript Date objects'
      )
    }

    if (!isValid(date)) {
      throw new Error('Invalid Date scalar')
    }

    return date.getTime()
  }
```

Remember when we [wrote that](#custom-scalars)? A custom scalar's `serialize()` function is called when a value is returned from a resolver, and it formats the value for being sent to the client. When we were querying MongoDB, our results—for instance `review.createdAt`—were JavaScript Date objects, and we formatted them as integers. But when we query SQL datetime fields, we get them as integers, so we don't need to format them differently for sending to the client. Similarly, when we receive values from the client, we don't need to convert them to Date objects in `parseValue()` and `parseLiteral()`. However, we can still check to make sure they're valid date integers:

`src/resolvers.Date.js`

```js
import { GraphQLScalarType } from 'graphql'
import { Kind } from 'graphql/language'

const isValid = date => !isNaN(date.getTime())

export default {
  Date: new GraphQLScalarType({
    name: 'Date',
    description:
      'The `Date` scalar type represents a single moment in time. It is serialized as an integer, equal to the number of milliseconds since the Unix epoch.',

    parseValue(value) {
      if (!Number.isInteger(value)) {
        throw new Error('Date values must be integers')
      }

      const date = new Date(value)
      if (!isValid(date)) {
        throw new Error('Invalid Date value')
      }

      return value
    },

    parseLiteral(ast) {
      if (ast.kind !== Kind.INT) {
        throw new Error('Date literals must be integers')
      }

      const dateInt = parseInt(ast.value)
      const date = new Date(dateInt)
      if (!isValid(date)) {
        throw new Error('Invalid Date literal')
      }

      return dateInt
    },

    serialize(date) {
      if (!Number.isInteger(date)) {
        throw new Error('Resolvers for Date scalars must return integers')
      }

      if (!isValid(new Date(date))) {
        throw new Error('Invalid Date scalar')
      }

      return date
    }
  })
}
```

For `parseValue()`, the value is already an integer. For `parseLiteral()`, we get a string, so we use `parseInt()`. 

The last thing we need to update is our root query field `isoString(date: Date)`:

```js
    isoString: (_, { date }) => date.toISOString()
```

`date` used to be a Date instance, but now it's an integer, so we can't call `toISOString()` until we create a Date object. But strangely enough, we can't create a Date object because the `Date` identifier is being used later in the file:

```js
import Date from './Date'
```

So we also need to change what we call the Date resolvers we're importing:

```js
import { merge } from 'lodash'

const resolvers = {
  Query: {
    hello: () => '🌍🌏🌎',
    isoString: (_, { date }) => new Date(date).toISOString()
  }
}

import Review from './Review'
import User from './User'
import DateResolvers from './Date'
import Github from './Github'

const resolversByType = [Review, User, DateResolvers, Github]

resolversByType.forEach(type => merge(resolvers, type))

export default resolvers
```

Now all our dates are working:

![isoString query and reviews.createdAt working](img/sql-time-working.png)

### SQL testing

> If you’re jumping in here, `git checkout sql2_0.1.0` (tag [sql2_0.1.0](https://github.com/GraphQLGuide/guide-api/tree/sql2_0.1.0), or compare [sql2...sql3](https://github.com/GraphQLGuide/guide-api/compare/sql2_0.1.0...sql3_0.1.0))

In the last section we implemented and used (okay, more like used then implemented 😄) our SQL data source. We also made a couple queries to see if it worked, and the queries did work (eventually), but it wasn't a comprehensive test. Let's update our automated tests (which are currently broken) so that we can have a higher level of confidence in our code's correctness. 

The place to start updating is in the code at the base of all our tests, `test/guide-test-utils.js`. We need to:

- Update mocked data field names (`_id -> id` and `firstName -> first_name`) and values
- Mock our new SQL data source
- Remove our old data sources and database connection code

`test/guide-test-utils.js`

```js
import { ApolloServer } from 'apollo-server'
import { promisify } from 'util'
import { HttpLink } from 'apollo-link-http'
import fetch from 'node-fetch'
import { execute, toPromise } from 'apollo-link'

import {
  server,
  typeDefs,
  resolvers,
  context as defaultContext,
  formatError
} from '../src/'

const created_at = new Date('2020-01-01').getTime()
const updated_at = created_at

export const mockUser = {
  id: 1,
  first_name: 'First',
  last_name: 'Last',
  username: 'mockA',
  auth_id: 'mockA|1',
  email: 'mockA@gmail.com',
  created_at,
  updated_at
}

const mockUsers = [mockUser]

const reviewA = {
  id: 1,
  text: 'A+',
  stars: 5,
  created_at,
  updated_at,
  author_id: mockUser.id
}

const reviewB = {
  id: 2,
  text: 'Passable',
  stars: 3,
  created_at,
  updated_at,
  author_id: mockUser._id
}

const mockReviews = [reviewA, reviewB]

class SQL {
  getReviews() {
    return mockReviews
  }
  createReview() {
    return reviewA
  }
  createUser() {
    return mockUser
  }
  getUser() {
    return mockUser
  }
  searchUsers() {
    return mockUsers
  }
}

export const db = new SQL()

export const createTestServer = ({ context = defaultContext } = {}) => {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    dataSources: () => ({ db }),
    context,
    formatError,
    engine: false
  })

  return { server, dataSources: { db } }
}

export const startE2EServer = async () => {
  const e2eServer = await server.listen({ port: 0 })

  const stopServer = promisify(e2eServer.server.close.bind(e2eServer.server))

  const link = new HttpLink({
    uri: e2eServer.url,
    fetch
  })

  return {
    stop: stopServer,
    request: operation => toPromise(execute(link, operation))
  }
}

export { createTestClient } from 'apollo-server-testing'
export { default as gql } from 'graphql-tag'
```

In our User resolver tests, we also need to update field names:

`src/resolvers/User.test.js`

```js
import {
  createTestServer,
  createTestClient,
  gql,
  mockUser
} from 'guide-test-utils'

const ME = gql`
  query {
    me {
      id
    }
  }
`

test('me', async () => {
  const { server } = createTestServer({
    context: () => ({ user: { id: 'itme' } })
  })
  const { query } = createTestClient(server)

  const result = await query({ query: ME })
  expect(result.data.me.id).toEqual('itme')
})

const USER = gql`
  query User($id: ID!) {
    user(id: $id) {
      id
    }
  }
`

test('user', async () => {
  const { server } = createTestServer()
  const { query } = createTestClient(server)

  const id = mockUser.id
  const result = await query({
    query: USER,
    variables: { id }
  })
  expect(result.data.user.id).toEqual(id.toString())
})

const CREATE_USER = gql`
  mutation CreateUser($user: CreateUserInput!, $secretKey: String!) {
    createUser(user: $user, secretKey: $secretKey) {
      id
    }
  }
`

test('createUser', async () => {
  const { server } = createTestServer()
  const { mutate } = createTestClient(server)

  const user = {
    firstName: mockUser.first_name,
    lastName: mockUser.last_name,
    username: mockUser.username,
    email: mockUser.email,
    authId: mockUser.auth_id
  }

  const result = await mutate({
    mutation: CREATE_USER,
    variables: {
      user,
      secretKey: process.env.SECRET_KEY
    }
  })

  expect(result).toMatchSnapshot()
})
```

Now if we run `npm test` we see that tests fail due to mismatching snapshots, which we can update with `npx jest -u`. 

One thing that we updated in the last section that we don't have a test for is the context function:

`src/context.js`

```js
import { AuthenticationError } from 'apollo-server'

import { getAuthIdFromJWT } from './util/auth'
import { db } from './data-sources/'

export default async ({ req }) => {
  const context = {}

  const jwt = req && req.headers.authorization
  let authId

  if (jwt) {
    try {
      authId = await getAuthIdFromJWT(jwt)
    } catch (e) {
      let message
      if (e.message.includes('jwt expired')) {
        message = 'jwt expired'
      } else {
        message = 'malformed jwt in authorization header'
      }
      throw new AuthenticationError(message)
    }

    const user = await db.getUser({ auth_id: authId })
    if (user) {
      context.user = user
    } else {
      throw new AuthenticationError('no such user')
    }
  }

  return context
}
```

Let's write a test for it! In order to test it, we have two options:

- Using an authorization header that successfully decodes to our mock `auth_id`: `mockA|1`. We can't create such a JWT, and even if we could, it would expire and then our test would start failing.
- Make it a unit test and mock all the functions it calls—in this case `getAuthIdFromJWT()` and `db.getUser()`.

Let's do the second. In order to mock an import, we need to call `jest.mock(file)`:

`src/context.test.js`

```js
import { mockUser } from 'guide-test-utils'

jest.mock('./util/auth', () => ({
  getAuthIdFromJWT: jest.fn(jwt => (jwt === 'valid' ? mockUser.auth_id : null))
}))

jest.mock('./data-sources/', () => ({
  db: {
    getUser: ({ auth_id }) => (auth_id === mockUser.auth_id ? mockUser : null)
  }
}))
```

Now when any code we're testing does the below imports, it will get our mock implementations.

```js
import { getAuthIdFromJWT } from './util/auth'
import { db } from './data-sources/'
```

Let's test the success case first:

```js
import getContext from './context'
import { getAuthIdFromJWT } from './util/auth'

describe('context', () => {
  it('finds a user given a valid jwt', async () => {
    const context = await getContext({
      req: { headers: { authorization: 'valid' } }
    })

    expect(getAuthIdFromJWT.mock.calls.length).toBe(1)
    expect(context.user).toMatchSnapshot()
  })
})
```

We can check our snapshot:

`src/__snapshots__/context.test.js.snap`

```js
// Jest Snapshot v1, https://goo.gl/fbAQLP

exports[`context finds a user given a valid jwt 1`] = `
Object {
  "auth_id": "mockA|1",
  "created_at": 1577836800000,
  "email": "mockA@gmail.com",
  "first_name": "First",
  "id": 1,
  "last_name": "Last",
  "updated_at": 1577836800000,
  "username": "mockA",
}
`;
```

✅ Looks good! Next let's make sure that giving an invalid JWT throws an error:

`src/context.test.js`

```js
import { AuthenticationError } from 'apollo-server'

describe('context', () => {
  it('finds a user given a valid jwt', async () => { ... }

  it('throws error on invalid jwt', async () => {
    const promise = getContext({
      req: { headers: { authorization: 'invalid' } }
    })

    expect(getAuthIdFromJWT.mock.calls.length).toBe(1)
    expect(promise).rejects.toThrow(AuthenticationError)
  })
})
```

We see with `npx jest context` (this limits testing to files with "context" in their names) that the test fails, saying that the `getAuthIdFromJWT` mock was called twice:

![Invalid jwt test fails, receiving 2 instead of 1](img/invalid-jwt-test-failure.png)

The mock calls is cumulative until we clear the mock. Let's do that after each test:

```js
describe('context', () => {
  afterEach(() => {
    getAuthIdFromJWT.mockClear()
  })
  
  it('finds a user given a valid jwt', async () => { ... }

  it('throws error on invalid jwt', async () => {
    const promise = getContext({
      req: { headers: { authorization: 'invalid' } }
    })

    expect(getAuthIdFromJWT.mock.calls.length).toBe(1)
    expect(promise).rejects.toThrow(AuthenticationError)
  })
})
```

✅ And we're back to green. Lastly, let's test a blank auth header:

```js
describe('context', () => {
  afterEach(() => {
    getAuthIdFromJWT.mockClear()
  })
  
  it('finds a user given a valid jwt', async () => { ... }
  it('throws error on invalid jwt', async () => { ... }

  it('is empty without jwt', async () => {
    const context = await getContext({
      req: { headers: {} }
    })

    expect(getAuthIdFromJWT.mock.calls.length).toBe(0)
    expect(context).toEqual({})
  })
})
```

✅ And still green! 💃 All together, that's:

`src/context.test.js`

```js
import { AuthenticationError } from 'apollo-server'
import { mockUser } from 'guide-test-utils'

import getContext from './context'
import { getAuthIdFromJWT } from './util/auth'

jest.mock('./util/auth', () => ({
  getAuthIdFromJWT: jest.fn(jwt => (jwt === 'valid' ? mockUser.auth_id : null))
}))

jest.mock('./data-sources/', () => ({
  db: {
    getUser: ({ auth_id }) => (auth_id === mockUser.auth_id ? mockUser : null)
  }
}))

describe('context', () => {
  afterEach(() => {
    getAuthIdFromJWT.mockClear()
  })

  it('finds a user given a valid jwt', async () => {
    const context = await getContext({
      req: { headers: { authorization: 'valid' } }
    })

    expect(getAuthIdFromJWT.mock.calls.length).toBe(1)
    expect(context.user).toMatchSnapshot()
  })

  it('throws error on invalid jwt', async () => {
    const promise = getContext({
      req: { headers: { authorization: 'invalid' } }
    })

    expect(getAuthIdFromJWT.mock.calls.length).toBe(1)
    expect(promise).rejects.toThrow(AuthenticationError)
  })

  it('is empty without jwt', async () => {
    const context = await getContext({
      req: { headers: {} }
    })

    expect(getAuthIdFromJWT.mock.calls.length).toBe(0)
    expect(context).toEqual({})
  })
})
```

Unfortunately if we run `npm test`, we see that our coverage is down to 40%. If we look at the coverage report (`npm run open-coverage`), we see that not much of our SQL data source is covered:

![Coverage webpage with 12.5% statement coverage of src/data-sources/SQL.js](img/sql-coverage-report.png)

Our old `Users.js` and `Reviews.js` files were 100% covered:

![Coverage web page with 100% coverage of Users.js, Reviews.js, and index.js](img/data-sources-full-coverage.png)

The issue is that before we were mocking the `.find()` and `.insertOne()` methods of MongoDB collections, not the data source methods. Currently we're mocking the data source methods:

`test/guide-test-utils.js`

```js
class SQL {
  getReviews() {
    return mockReviews
  }
  createReview() {
    return reviewA
  }
  createUser() {
    return mockUser
  }
  getUser() {
    return mockUser
  }
  searchUsers() {
    return mockUsers
  }
}
```

If we wanted to cover `SQL.js`, we would need to run the actual methods, which means we would need to instead mock the `this.knex` used by the methods.

### SQL performance

> If you’re jumping in here, `git checkout 25_0.1.0` (tag [25_0.1.0](https://github.com/GraphQLGuide/guide-api/tree/25_0.1.0), or compare [25...sql4](https://github.com/GraphQLGuide/guide-api/compare/25_0.1.0...sql4_0.1.0))

The two main performance factors when it comes to database querying are latency and load. Latency is how quickly we get all the data we need, and load is how much work the database is doing. Latency usually won't be an issue unless we have complex queries or a lot of data. Load won't be an issue unless we have a lot of clients simultaneously using our API. 

When neither latency nor load is an issue for our app, we don't need to concern ourselves with performance, and our current implementation is fine. If either becomes an issue (or if we're certain that it will be when our API is completed and released), then we have different ways we can improve performance. This section is mainly about using SQL JOIN statements, which we're currently not using. We discuss more performance topics in the [Performance section](#performance) later in the chapter.

Let's consider this GraphQL query:

```gql
{
  reviews {
    id
    text
    author {
      firstName
    }
  }
}
```

If we were writing an efficient SQL statement to fetch that data, we'd write:

```sql
SELECT reviews.id, reviews.text, users.first_name
FROM reviews 
LEFT JOIN users 
ON reviews.author_id = users.id
```

Let's compare this statement to what happens with our current server. We can have Knex print out statements it sends by adding a `DEBUG=knex:query` env var. When we do that and make the above GraphQL query, we see these three SQL statements:

```sh
$ DEBUG=knex:query npm run dev
GraphQL server running at http://localhost:4000/
SQL (1.437 ms) select * from `reviews`
SQL (0.364 ms) select * from `users` where `id` = 1
SQL (0.377 ms) select * from `users` where `id` = 1
```

There are three issues with this:

- There are 3 queries instead of 1. (And more generally, there are `N+1` queries, where `N` is the number of reviews.)
- They all select `*` instead of just the fields needed.
- The second two are redundant (they occur because SQLDataSource doesn't do batching).

This probably will result in a higher load on the SQL server than the single efficient statement we wrote. It also has a higher latency, since not all of the three statements are sent at the same time—first the reviews are fetched, then the `author_id`s are used to create the rest of the statements. That's two round trips over the network from the API server to the database instead of the one trip our efficient statement took. 

Let's change our code to use a JOIN like the efficient statement did. Currently the `reviews` root Query field calls the `getReviews()` data source method:

`src/data-sources/SQL.js`

```js
class SQL extends SQLDataSource {
  getReviews() {
    return this.knex
      .select('*')
      .from('reviews')
      .cache(REVIEW_TTL)
  }

  ...
}
```

We can add a `.leftJoin()`:

```js
import { pick } from 'lodash'

class SQL extends SQLDataSource {
  async getReviews() {
    const reviews = await this.knex
      .select(
        'users.*',
        'users.created_at as users__created_at',
        'users.updated_at as users__updated_at',
        'reviews.*'
      )
      .from('reviews')
      .leftJoin('users', 'users.id', 'reviews.author_id')
      .cache(REVIEW_TTL)

    return reviews.map(review => ({
      ...review,
      author: {
        id: review.author_id,
        created_at: review.users__created_at,
        updated_at: review.users__updated_at,
        ...pick(review, 'first_name', 'last_name', 'email', 'photo')
      }
    }))
  }

  ...
}
```

We needed to change our `.select('*')` because both users and reviews have `created_at` and `updated_at` columns. We also needed to use `.map()` to extract out the user fields into an `author` object. 

Finally, we need to stop the `Review.author` resolver from querying the database. We can do so by checking whether the `author` object is already present on the review object:

`src/resolvers/Review.js`

```js
export default {
  Query: ...
  Review: {
    author: (review, _, { dataSources: { db } }) =>
      review.author || db.getUser({ id: review.author_id }),
    ...
}
```

Now when we run the same GraphQL query in playground, we see that this SQL statement is run:

```
SQL (1.873 ms) select `reviews`.*, `users`.`created_at` as `users__created_at`, `users`.`updated_at` as `users__updated_at` from `reviews` left join `users` on `users`.`id` = `reviews`.`author_id`
```

Success! We got from three statements down to one. However, there are still inefficiencies: the SQL statement is overfetching in two ways:

- It's selecting all fields, whereas the GraphQL query only needed `id`, `text`, and `author.firstName`.
- It always does a JOIN, even when the GraphQL query doesn't select `Review.author`.

We can write code to address both of these things—by looking through the fourth argument to resolvers, `info`, which contains information about the current GraphQL query, and seeing which fields are selected. However, it would be easier to use the [Join Monster](https://join-monster.readthedocs.io/en/latest/) library, which does this for us.

To set it up, we create a new file to add the following information to our schema:

`src/joinMonsterAdapter.js`

```js
import joinMonsterAdapt from 'join-monster-graphql-tools-adapter'

export default schema =>
  joinMonsterAdapt(schema, {
    Query: {
      fields: {
        user: {
          where: (users, args) => `${users}.id = ${args.id}`
        }
      }
    },
    Review: {
      sqlTable: 'reviews',
      uniqueKey: 'id',
      fields: {
        author: {
          sqlJoin: (reviews, users) =>
            `${reviews}.author_id = ${users}.id`
        },
        text: { sqlColumn: 'text' },
        stars: { sqlColumn: 'stars' },
        fullReview: { sqlDeps: ['text', 'stars', 'author_id'] },
        createdAt: { sqlColumn: 'created_at' },
        updatedAt: { sqlColumn: 'updated_at' }
      }
    },
    User: {
      sqlTable: 'users',
      uniqueKey: 'id',
      fields: {
        firstName: { sqlColumn: 'first_name' },
        lastName: { sqlColumn: 'last_name' },
        createdAt: { sqlColumn: 'created_at' },
        updatedAt: { sqlColumn: 'updated_at' },
        photo: { sqlDeps: ['auth_id'] }
      }
    }
  })
```

We tell Join Monster which table each type corresponds to, which column fields correspond to, and query information for fields that involve SQL statements (for example, `Query.user`'s WHERE clause matches the `id` argument with the `id` field in the users table, and `Review.author` can be fetched with a JOIN on the users table). 

We also tell it when we need it to fetch fields that aren't in the GraphQL query. For example, if `User.firstName` is in the query, it knows to fetch and return `first_name`:

```js
  firstName: { sqlColumn: 'first_name' },
```

But for `User.photo`, there's no photo column in the users table. So our `User.photo` resolver will run, but it needs access to the user's `auth_id` field, so we need to tell Join Monster that when `User.photo` is in the query, it needs to fetch `auth_id` from the database:

```js
  photo: { sqlDeps: ['auth_id'] }
```

We call our configuration function with a schema created by `makeExecutableSchema`, and then we pass the schema to `ApolloServer()` (whereas before we were passing `typeDefs` and `resolvers`):

`src/index.js`

```js
import { makeExecutableSchema } from 'graphql-tools'

import joinMonsterAdapter from './joinMonsterAdapter'

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers
})

joinMonsterAdapter(schema)

const server = new ApolloServer({
  schema,
  dataSources,
  context,
  formatError
})

...
```

We're also going to need a Knex instance, which we'll add here:

`src/data-sources/index.js`

```js
import Knex from 'knex'

const knexConfig = {
  client: 'sqlite3',
  connection: {
    filename: './sql/dev.sqlite3'
  },
  useNullAsDefault: true
}

export const knex = Knex(knexConfig)
```

And lastly, we update our `Query.user` and `Query.review` resolvers:

`src/resolvers/User.js`

```js
import joinMonster from 'join-monster'

import { knex } from '../data-sources/'

export default {
  Query: {
    me: ...
    user: (_, __, context, info) =>
      joinMonster(info, context, sql => knex.raw(sql), {
        dialect: 'sqlite3'
      }),
    ...
  }
  ...
}
```

`src/resolvers/Review.js`

```js
import joinMonster from 'join-monster'

import { knex } from '../data-sources/'

export default {
  Query: {
    reviews: (_, __, context, info) =>
      joinMonster(info, context, sql => knex.raw(sql), {
        dialect: 'sqlite3'
      })
  },
  ...
}
```

That was certainly simpler than that long `getReviews()` method we wrote! Instead, we give `joinMonster()` the `info` and `context`, and it gives us a SQL statement to run. 

We also get to remove some resolvers that will be taken care of by Join Monster: 

```
User.firstName
User.lastName
User.createdAt
User.updatedAt
Review.author
Review.createdAt
Review.updatedAt
```

Now when we query for a user and select `firstName`, `createdAt`, and `photo`:

![user query in Playground with 3 fields selected](img/user-query-3-fields.png)

this SELECT statement gets run:

```
GraphQL server running at http://localhost:4000/
  knex:query SELECT
  knex:query   "user"."id" AS "id",
  knex:query   "user"."first_name" AS "firstName",
  knex:query   "user"."created_at" AS "createdAt",
  knex:query   "user"."auth_id" AS "auth_id"
  knex:query FROM users "user"
  knex:query WHERE "user".id = 1 +16s
```

Join Monster knows to get `1` from the query argument to use in the WHERE clause, it knows to look in the users table, and it knows exactly which fields to fetch, even `auth_id`. 

Here's another example of `sqlDeps` working. From the config:

```
  fullReview: { sqlDeps: ['text', 'stars', 'author_id'] },
```

When we send this query:

```gql
{
  reviews {
    fullReview
  }
}
```

all three deps are selected:

```
  knex:query SELECT
  knex:query   "reviews"."id" AS "id",
  knex:query   "reviews"."text" AS "text",
  knex:query   "reviews"."stars" AS "stars",
  knex:query   "reviews"."author_id" AS "author_id"
  knex:query FROM reviews "reviews" +0ms
SQL (0.980 ms) select * from `users` where `id` = 1
SQL (0.367 ms) select * from `users` where `id` = 1
```

Join Monster [doesn't yet support](https://github.com/acarl005/join-monster/issues/398) a joined object type as a field dependency, which is why we list `author_id` instead of `author` in `sqlDeps`, and why the `Review.fullReview` resolver still has to call `db.getUser()`.

Lastly, let's see how it handles a reviews query with `author` selected:

```gql
{
  reviews {
    author {
      lastName
    }
  }
}
```

```
  knex:query SELECT
  knex:query   "reviews"."id" AS "id",
  knex:query   "author"."id" AS "author__id",
  knex:query   "author"."last_name" AS "author__lastName"
  knex:query FROM reviews "reviews"
  knex:query LEFT JOIN users "author" ON "reviews".author_id = "author".id +3m
```

✨ Perfect! It only fetched the fields needed, and in a single statement.

## REST

> If you’re jumping in here, `git checkout 25_0.1.0` (tag [25_0.1.0](https://github.com/GraphQLGuide/guide-api/tree/25_0.1.0), or compare [25...rest](https://github.com/GraphQLGuide/guide-api/compare/25_0.1.0...rest_0.1.0))

Instead of fetching our data directly from the database, we may want to make use of our company's legacy REST services (yes, any service that doesn't speak GraphQL and support [Apollo Federation](#apollo-federation) is now a *legacy* service 😉😄). Or we may want to use data from third party REST APIs. In either case, we use `RESTDataSource` to create a data source that makes REST requests.

Users of the Guide site need to be able to purchase the book, so we need to display the price to them. And let's say we wanted to make the book more affordable in locations outside of the United States where it was originally priced. [Purchasing power parity](https://en.wikipedia.org/wiki/Purchasing_power_parity) (PPP) produces a conversion factor based on the actual purchasing power in a different location. For example, if the book is $100 in the U.S., and the conversion factor for India is 0.26, then charging 100 * 0.26 = $26 for the book to customers in India would make it as affordable to them as the $100 book is to Americans.

Let's add a root query field `costInCents` that returns the PPP-adjusted cost of the book. In order to do that, we'll need to query a PPP API. `ppp.graphql.guide` is a REST API that returns PPP information when given a country code (for example, `/?country=IN` for India). We can try it out in the browser:

[ppp.graphql.guide/?country=IN](https://ppp.graphql.guide/?country=IN)

![Chrome showing the JSON response with PPP info](img/ppp-in-browser.png)

The response JSON includes `pppConversionFactor`, which combines the `ppp` value and exchange rate into a number we multiply the USD price by. 

The other thing we need to figure out is how to get the country code of client. We could look at the IP address (which is either `req.headers['x-forwarded-for'] || req.socket.remoteAddress`) and use a GeoIP lookup API (where we send the IP address and get back a location), but the easier way is to use the Cloudflare CDN, which adds a fairly accurate [`cf-ipcountry` HTTP header](https://support.cloudflare.com/hc/en-us/articles/200168236-What-does-Cloudflare-IP-Geolocation-do-) to all incoming requests. We can emulate this by setting the `cf-ipcountry` header in Playground.

We can check the header in our context function, and add the country code to our context object:

`src/context.js`

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

We'll then be able to access the code from our data source, which we create by extending `RESTDataSource` from [`apollo-datasource-rest`](https://www.npmjs.com/package/apollo-datasource-rest). There are five main things to know about `RESTDataSource`:

- Set `this.baseURL` to the REST API's URL in the constructor.
- Use HTTP verb methods like `this.get(path, queryParams, options)`, `this.post()`, etc.
- It [deduplicates](https://khalilstemmler.com/blogs/graphql/how-apollo-rest-data-source-caches-api-calls/) REST requests.
- It caches responses from the REST API based on the responses' cache headers.
- Define a `willSendRequest()` method if you want to modify all outgoing requests, for instance by adding an auth header:

```js
class SomePrivateAPI extends RESTDataSource {
  ...
  
  willSendRequest(request) {
    request.headers.set('Authorization', this.context.token);
  }
}
```

Here's our implementation, using `this.baseURL`, `this.get()`, and `this.context`:

`src/data-sources/PPP.js`

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

We don't need to define `willSendRequest()` because it's a public API. We only need a single method `getConversionFactor()`, which makes a GET request of the form `/?country=[countryCode]`. It defaults to a factor of 1, which results in the full price.

Next we need to add this to our `dataSources` so we can access it from our resolvers:

`src/data-sources/index.js`

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

`src/resolvers/PPP.js`

```js
const BOOK_PRICE = 3900

export default {
  Query: {
    costInCents: async (_, __, { dataSources }) =>
      Math.round((await dataSources.ppp.getConversionFactor()) * BOOK_PRICE)
  }
}
```

`src/resolvers/index.js`

```js
import PPP from './PPP'

const resolversByType = [Review, User, Date, Github, PPP]

...
```

Lastly, we add the `costInCents` root Query field:

`src/schema/PPP.graphql`

```gql
extend type Query {
  costInCents: Int!
}
```

`src/schema/schema.graphql`

```gql
...
#import 'PPP.graphql'
```

Now we should be able to get 3900 in response to a `{ costInCents }` query:

![costInCents query in Playground](img/costInCents.png)

This is defaulting to the US price, since there's no header. When we add a country header, we'll see a different result:

```json
{
  "cf-ipcountry": "IN"
}
```

![costInCents query with cf-ipcountry header](img/costInCents-with-header.png)

It works! 💃 The only thing left to check is caching. `RESTDataSource` only caches responses that contain a `Cache-Control` header. To see whether `ppp.graphql.guide` uses cache headers, we can use a command-line tool called [httpie](https://httpie.org/) (a modern to `wget`):

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

We see at the top a list of headers, which includes a `cache-control` header (HTTP headers aren't case sensitive) instructing the recipient to cache the response for 604800 seconds (one week). So now our data source *should* be saving responses to the cache, but how can we check? If we were still using [Redis as a cache](#redis-caching), we could check Redis, but instead the data source is using the default in-memory cache. Instead, we can use [tcpdump](https://en.wikipedia.org/wiki/Tcpdump) to see when our development machine makes requests to `ppp.graphql.guide` (when a certain country is already cached, it shouldn't make a request). In one terminal, we run this command:

```
$ sudo tcpdump "tcp[tcpflags] & (tcp-syn) != 0 and dst ppp.graphql.guide"
tcpdump: data link type PKTAP
tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
listening on pktap, link-type PKTAP (Apple DLT_PKTAP), capture size 262144 bytes
```

And then we change the country header in Playground to one we haven't used, eg `CN` for China. On the first query, we should see this line printed:

```
04:30:18.705846 IP macbook.fios-router.home.52591 > ec2-3-210-90-207.compute-1.amazonaws.com.https: Flags [S], seq 995289110, win 65535, options [mss 1460,nop,wscale 6,nop,nop,TS val 1101427783 ecr 0,sackOK,eol], length 0
```

which signifies a new request to `ppp.graphql.guide`. If we continue to re-issue the Playground query with the same country header, no more lines should be printed, meaning that the data source used the in-memory cache instead of making a request.

## GraphQL

If there's a GraphQL API that we want to use data from, we have a few options:

- If we want to include parts of the API's schema in our schema:
  - If it supports [federation](#schema-federation), we should use that. For example, FaunaDB supports federation [TODO not yet], and some 3rd party services we use might have a GraphQL API that supports federation. And if we have control over the API (e.g. if it's one of our services), we can add support for federation.
  - We can use [schema stitching](https://www.apollographql.com/docs/graphql-tools/schema-stitching/) if the API doesn't support federation. But unless we want a significant part of the API's schema, it may be easier to use one of the below methods instead.
- If we just want to use data from the API in our resolvers:
  - Use `GraphQLDataSource` from [`apollo-datasource-graphql`](https://github.com/poetic/apollo-datasource-graphql#readme) to create a data source class. Similarly to `RESTDataSource`, we can define a `willSendRequest` method that adds an authorization header to all requests. But in our data fetching methods, instead of `this.get('path')`, we use `this.query(QUERY_DOCUMENT)`.
  - Use `graphql-request` in our resolvers to fetch data from the data source (similar to our [`githubStars`](#githubstars) subscription where we fetch data from GitHub's GraphQL API). While `graphql-request` is nice for extremely simple uses like `githubStars`, usually `GraphQLDataSource` is a better choice.

## Custom data source

When we've been talking about data sources, sometimes we're referring to the classes we create (`PPP` in the below snippet), and sometimes we're referring to the parent classes that we get from an npm library and extend (`RESTDataSource`).

```js
import { RESTDataSource } from 'apollo-datasource-rest'

class PPP extends RESTDataSource {
  ...
}
```

If there's a type of database or API for which we can't find an existing library and parent class, we can write our own! A data source parent class has most or all of the following pieces:

- Extends the `DataSource` class from the `apollo-datasource` library
- Some way of receiving information about the database or API (either a constructor parameter or an instance variable like `RESTDataSource`'s `this.baseURL`)
- An `initialize()` method that receives the context and an optional cache
- Calls lifecycle methods that can be defined by the child class, like `RESTDataSource`'s `willSendRequest()` and `didEncounterError()`
- Methods for fetching data, which use DataLoader and/or the cache
- Methods for changing data, which might invalidate cached data

Let's see all of these in a parent class called `FooDataSource` for an imaginary Foo document database. It's passed a Foo db client, which has these fields:

- `dbClient.connectionURI`: the URI of the database server
- `dbClient.getByIds(ids)`: given an array of IDs, returns the associated documents from the database
- `dbClient.update(id, newDoc)`: update the document with the given `id` to be the `newDoc`

```js
import { DataSource } from 'apollo-datasource'
import { InMemoryLRUCache } from 'apollo-server-caching'
import DataLoader from 'dataloader'

class FooDataSource extends DataSource {
  constructor(dbClient) {
    super()
    this.db = dbClient
    this.loader = new DataLoader(ids => dbClient.getByIds(ids))
  }

  initialize({ context, cache } = {}) {
    this.context = context
    this.cache = cache || new InMemoryLRUCache()
  }

  didEncounterError(error) {
    throw error
  }

  cacheKey(id) {
    return `foo-${this.db.connectionURI}-${id}`
  }

  async get(id, { ttlInSeconds } = {}) {
    const cacheDoc = await cache.get(this.cacheKey(id))
    if (cacheDoc) {
      return JSON.parse(cacheDoc)
    }

    const doc = await this.loader.load(id)

    if (ttlInSeconds) {
      cache.set(this.cacheKey(id), JSON.stringify(doc), { ttl: ttlInSeconds })
    }

    return doc
  }

  async update(id, newDoc) {
    try {
      await this.db.update(id, newDoc)
      this.cache.delete(this.cacheKey(id))
    } catch (error) {
      this.didEncounterError(error)
    }
  }
}
```

Let's look at each part:

```js
  constructor(dbClient) {
    super()
    this.db = dbClient
    this.loader = new DataLoader(ids => dbClient.getByIds(ids))
  }
```

The constructor saves the db client as an instance variable to be used later. It also creates an instance of `DataLoader` to use for this request (a new data source object will be created for each GraphQL request). DataLoader needs to know how to fetch a list of documents by their IDs. Here we're assuming the array of documents that `getByIds()` returns is the same order and length as `ids` (a requirement of DataLoader); otherwise, we'd need to reorder them.

```js
  initialize({ context, cache } = {}) {
    this.context = context
    this.cache = cache || new InMemoryLRUCache()
  }
```

`initialize()` is called automatically by Apollo Server. If Apollo Server has been configured with a global cache, we use that; otherwise, we create an in-memory cache.

```js
  didEncounterError(error) {
    throw error
  }
```

When an error occurs, we call `this.didEncounterError()`, which a child class can overwrite if they want.

```js
  cacheKey(id) {
    return `foo-${this.db.connectionURI}-${id}`
  }
```

We use the `connectionURI` in the cache key to avoid collisions, which could happen if there's a global cache and multiple Foo data sources connected to different Foo databases, and one database has a document with the same ID as a document in another database.

```js
  async get(id, { ttlInSeconds } = {}) {
    const cacheDoc = await cache.get(this.cacheKey(id))
    if (cacheDoc) {
      return JSON.parse(cacheDoc)
    }

    const doc = await this.loader.load(id)

    if (ttlInSeconds) {
      cache.set(this.cacheKey(id), JSON.stringify(doc), { ttl: ttlInSeconds })
    }

    return doc
  }
```

We provide a `get(id)` method to be used in resolvers, with an optional `ttlInSeconds` if the caller wants the result to be cached. First we check if the doc is already in the cache. If it is, we parse it (cache values are always strings) and return it. Then we ask DataLoader to get the document. It will take all the calls to `.load(id)` (the resolver—or other resolvers—might be calling `.get()` around the same time as this is running), deduplicate (when `.get()` is called multiple times with the same ID), and put all the distinct IDs into an array for a batch request (the call to `dbClient.getByIds()` in the constructor). Once the batch request completes, DataLoader returns on this line the one document we need:

```js
    const doc = await this.loader.load(id)
```

Then if `ttlInSeconds` was provided, we cache the document for that length of time. And finally, we return it!

```js
  async update(id, newDoc) {
    try {
      await this.db.update(id, newDoc)
      this.cache.delete(this.cacheKey(id))
    } catch (error) {
      this.didEncounterError(error)
    }
  }
```

We provide an `update(id, newDoc)` method to be used in resolvers. After a successful update, it deletes the old document from the cache. Another possible implementation would be to overwrite the previous cache entry with `newDoc` (in which case we'd need a value for `ttl`, so perhaps we'd add a third argument to `update()` with a `ttlInSeconds`).

Once we have the parent class complete, we can use it by creating one or more child classes (in the case of Foo, one for each database, but with some data sources we might do one for each table or collection). Here's an example child class:

```js
import FooDataSource from './FooDataSource'
import { reportError } from './utils'

export default class MyFooDB extends FooDataSource {
  async updateFields(id, fields) {
    const doc = await this.get(id)
    return this.update(id, {
      ...doc,
      ...fields
    })
  }
  
  didEncounterError(error) {
    reportError(error)
  }
}
```

It overrides `didEncounterError` to use its own error reporting service instead of throwing. It adds a new method that calls the parent's `.get()` and `.update()`. When we create the data source, we give the database client to the constructor:

```js
import FooClient from 'imaginary-foo-library'

import MyFooDB from './MyFooDB'

const fooClient = new FooClient({ uri: 'https://foo.graphql.guide:9001' })

const dataSources = () => ({
  myFoos: new MyFooDB(fooClient)
})
```

And now inside our resolvers, we can use `context.dataSources.myFoos`, and we can use all the methods defined in the parent class, `FooDataSource`, and in the child class, `MyFooDB`:

```js
const resolvers = {
  Query: {
    getFoo: (_, { id }, context) => 
      context.dataSources.myFoos.get(id, { ttlInSeconds: 60 })
  },
  Mutation: {
    updateFoo: async (_, { id, fields }, context) => {
      if (context.isAdmin) {
        context.dataSources.myFoos.updateFields(id, fields)
      }
    }
  }
}
```

These example resolvers use `.get()` from `FooDataSource` and `.updateFields()` from `MyFooDB`.

## Prisma

This section will be written after the release of [Prisma 2](https://www.notion.so/Is-Prisma-2-Ready-8b3fba3eaf5b4bf3ab7102fd94f56148).

# Extended topics

* [Mocking](11.md#mocking)
* [Pagination](11.md#pagination)
* [File uploads](11.md#file-uploads)
* [Schema design](11.md#schema-design)
* [Apollo federation](11.md#apollo-federation)
* [Schema change validation](11.md#schema-change-validation)
* [Subscription design](11.md#subscription-design)
* [Auth options](11.md#auth-options)
* [Security](11.md#security)
* [Caching](11.md#caching)
* [Custom schema directives](11.md#custom-schema-directives)
* [Performance](11.md#performance)
* [Future](11.md#future)

This section includes miscellaneous server topics that we didn't get to in the main-line [Building](11.md#building) tutorial, the [Testing](11.md#testing) sequence, the [Production](11.md#production) section, or the [data sources](#more-data-sources) section. Some topics are short, and some are long (yes, we know—the length of this chapter is ridiculous 😆). Most of the code will be branched off of 25, the end of the Testing sequence.

## Mocking

> If you’re jumping in here, `git checkout 25_0.1.0` (tag [25_0.1.0](https://github.com/GraphQLGuide/guide-api/tree/25_0.1.0), or compare [25...mocking](https://github.com/GraphQLGuide/guide-api/compare/25_0.1.0...mocking_0.1.0))

Mocking API responses—providing the client with fake (mock) data—is easy in GraphQL because we have a schema that tells us the structure of the data and the type of each field. And it's super easy with Apollo Server—we just add `mock: true`:

```js
const server = new ApolloServer({
  typeDefs,
  resolvers,
  mock: true
})
```

It needs to know how to mock custom types, so for our app we need a mock `Date`:

`src/index.js`

```js
const mocks = {
  Date: () => new Date()
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  dataSources,
  context,
  formatError,
  mocks
})
```

Now when we make a `reviews` query, all the fields we select get returned with mock data:

![reviews query with mock strings and numbers](img/mocking-default.png)

If we want them to look more like real data, we can use the [`casual`](https://github.com/boo1ean/casual) library for fake data generation:

```js
import casual from 'casual'

const mocks = {
  Date: () => new Date(),
  Review: () => ({
    text: casual.sentence,
    stars: () => casual.integer(0, 5)
  }),
  User: () => ({
    firstName: casual.first_name,
    lastName: casual.last_name,
    username: casual.username,
    email: casual.email,
    photo: `https://placekitten.com/100/100`
  })
}
```

![reviews query with data generated by casual](img/mocking-casual.png)

To make the results array have a variable number of results (the default is two items for all lists), we could add this to make it return between 0 and 3 items:

```js
import { ApolloServer, MockList } from 'apollo-server'

const mocks = {
  ...
  Query: () => ({
    reviews: () => new MockList([0, 3])
  })
```

TODO pic 
https://github.com/apollographql/graphql-tools/issues/1283

If we were starting out mocking a new app, and then we wanted to start writing real resolvers, we could add `resolvers` and `mockEntireSchema: false`:

```js
const server = new ApolloServer({
  typeDefs,
  mocks,
  resolvers,
  mockEntireSchema: false
})
```

Then our resolvers would be used first, and mocks would be used for all the fields for which we hadn't yet written resolvers.

We can also mock a schema written in a different language than JavaScript or a schema from a 3rd party GraphQL API. First we download `graphql-cli`, and then we use it to download the target API's schema:

```sh
$ npm i -g graphql-cli
$ graphql get-schema -e https://api.spacex.land/graphql -o schema.json
```

Then we start a simple Apollo server:

```js
const { buildClientSchema } = require('graphql')
const introspectionResult = require('./schema.json')
const { ApolloServer } = require('apollo-server')

const schema = buildClientSchema(introspectionResult.data)

const server = new ApolloServer({
  schema,
  mocks: true
})

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`)
})
```

To test it, we do:

```sh
$ git clone https://github.com/GraphQLGuide/mock-external-schema.git
$ cd mock-external-schema
$ npm install
$ npm start
```

And we open [localhost:4000](http://localhost:4000) to issue a query:

![SpaceX query with mocked results](img/mocking-external.png)

## Pagination

* [Offset-based](#offset-based)
* [Cursors](#cursors)
  * [after an ID](#after-an-id)
  * [Relay cursor connections](#relay-cursor-connections)

Pagination is the general term for requesting chunks of a list of data instead of the whole list, because requesting the whole list would take too much time or resources. In [Chapter 6: Paginating](6.md#paginating), we covered different types of pagination from the client's perspective. In this section, we'll cover them from the server's perspective: defining the schema and writing code that fetches the requested chunk of data from the database.

These are the main types of pagination:

- *Offset-based*: Request a chunk at an offset from the beginning of the list.
  - *Pages*: Request Nth page of a certain size. For instance, `page: 3, size: 10` would be items 21-30.
  - *Skip & limit*: Request *limit* items after skipping *skip* items. For instance `skip: 40, limit: 20` would be items 41-60.
- *Cursor-based*: Request a chunk before or after a *cursor*. Conceptually, a cursor is a pointer to a location in a query's result set. There's a range of ways to implement it, both in terms of what arguments are used and how the schema looks, but here are a couple options:
  - *after an ID*: Request *limit* items *after* some sortable field, like `id` (in MongoDB, ObjectIds sort by the time they were created, like a createdAt timestamp). This is the simplified, cursor-like system used in [Chapter 6: Cursors](6.md#cursors). For instance `after: '5d3202c4a044280cac1e2f60', limit: 10` would be the 10 items after that `id`.
  - *Relay cursor connections*: Request the *first* N items *after* an opaque cursor (or *last* N items *before* a cursor). For instance, `first: 10, after: 'abcabcabc'`, where `'abcabcabc'` contains an encoded result set location.

> In Chapter 6 we used `[id]:[sort order]` as the cursor format (like `'100:createdAt_DESC'`). However, it's best practice for the client to treat cursors as opaque strings, and that's usually facilitated by the server Base64-encoding the string. So the server would return `'MTAwOmNyZWF0ZWRBdF9ERVND'` as the cursor instead of `'100:createdAt_DESC'`.

The downsides to offset-based are:

- When the result set changes (items added or removed), we might miss or get duplicate results. (We discuss this scenario in [Chapter 6: skip & limit](6.md#skip-&-limit).)
- The performance of a `LIMIT x OFFSET y` query does not scale well for large data sets in many databases, including PostgreSQL, MySQL, and MongoDB. (Note that depending on the flexibility of our collection structure, we might be able to use [the bucket pattern](https://www.mongodb.com/blog/post/paging-with-the-bucket-pattern--part-1) in MongoDB to scale this query well.)

The downsides to cursor-based are:

- We can't jump ahead, for example from page 1 to page 5.
- The implementation is a little more complex.

In [Offset-based](#offset-based), we'll implement skip & limit. Then in [Cursor-based](#cursor-based) we'll implement [after an ID](#after-an-id) and [Relay cursor connections](#relay-cursor-connections).

### Offset-based

> If you’re jumping in here, `git checkout 25_0.1.0` (tag [25_0.1.0](https://github.com/GraphQLGuide/guide-api/tree/25_0.1.0), or compare [25...pagination](https://github.com/GraphQLGuide/guide-api/compare/25_0.1.0...pagination_0.1.0))

In skip & limit, we have three arguments: `skip`, `limit`, and `orderBy`. The first thing to do is update the schema, and then we'll update the resolver, and lastly the data source.

For `orderBy` we need a new enum type. `skip` and `limit` are integers. We can set default values for each so that we can make each argument nullable.

Here's the current `reviews` Query:

`src/schema/Review.graphql`

```gql
extend type Query {
  reviews: [Review!]!
}
```

Here we add the arguments:

```gql
enum ReviewOrderBy {
  createdAt_ASC 
  createdAt_DESC
}

extend type Query {
  reviews(skip: Int, limit: Int, orderBy: ReviewOrderBy): [Review!]!
}
```

The convention for enum values is `ALL_CAPS`, but `createdAt_ASC` makes it more clear than `CREATED_AT_ASC` that it's sorting by the `Review.createdAt` field, and the subsequent underscore and capital `ASC/DESC` still clues us into the fact that they're enum values.

> Learn the rules so you know how to break them properly.
> —The Dalai Lama's Fifth Rule of Living

Our resolver is currently very simple:

`src/resolvers/Review.js`

```js
export default {
  Query: {
    reviews: (_, __, { dataSources }) => dataSources.reviews.all()
  },
  ...
}
```

We need to add the arguments and check them. GraphQL execution adequately checks `orderBy` (so we know it will either be the string `'createdAt_DESC'` or `'createdAt_ASC'`), but it only checks that `skip` and `limit` are integers—we need to make sure that they're not invalid or restricted values. It doesn't make sense for `skip` to be less than 0, nor for `limit` to be less than 1. We'll also prevent large values of `limit` to limit the load on our server.

```js
const MAX_PAGE_SIZE = 100

export default {
  Query: {
    reviews: (
      _,
      { skip = 0, limit = 10, orderBy = 'createdAt_DESC' },
      { dataSources }
    ) => {
      const errors = {}

      if (skip < 0) {
        errors.skip = `must be non-negative`
      }

      if (limit < 1) {
        errors.limit = `must be positive`
      }

      if (limit > MAX_PAGE_SIZE) {
        errors.limit = `cannot be greater than ${MAX_PAGE_SIZE}`
      }

      if (!isEmpty(errors)) {
        throw new InputError({ review: errors })
      }

      return dataSources.reviews.getPage({ skip, limit, orderBy })
    }
  },
  ...
}
```

Lastly, call a new data source method `getPage`, which we'll define next. Here's our old `.all()` method:

`src/data-sources/Reviews.js`

```js
export default class Reviews extends MongoDataSource {
  all() {
    return this.collection.find().toArray()
  }
  ...
}
```

We replace it with:

```js
export default class Reviews extends MongoDataSource {
  getPage({ skip, limit, orderBy }) {
    return this.collection
      .find()
      .sort({ _id: orderBy === 'createdAt_DESC' ? -1 : 1 })
      .skip(skip)
      .limit(limit)
      .toArray()
  }
  
  ...
}
```

> `_id` is an ObjectId, so sorting by `_id` is equivalent to sorting by a `createdAt` timestamp.

Let's first test the error case in Playground:

![Errors with skip: -1 and limit: 101](img/skiplimit-invalid-args.png)

And with default arguments, we see the most recent 10 reviews:

![reviews query response has reviews #12 through #3](img/skiplimit-default-args.png)

And with `skip: 5, limit: 3, orderBy: createdAt_ASC`, we see the 6th through 8th reviews: 

![reviews query response has reviews #6, #7, and #8](img/skiplimit-all-args.png)

### Cursors

There are a number of ways to do cursor-based pagination. We will cover the first and the last:

- [after an ID](#after-an-id): Use 3 arguments to support cursor-like pagination for queries sorted by a single field (`createdAt`).
- `first/after & last/before`: `first` and `last` are equivalent to `limit`, and `after/before` is the cursor. These are added as arguments, but the client has to get the cursor from the server, which requires adding a `cursor` field to the schema, which can be done in various ways:
  1. Add `cursor` to each object.
  2. Have each paginated query return a `startCursor`, `endCursor`, and `nodes`.
  3. Use Relay cursor connections, where the paginated query returns edges which each contain a `cursor` and a `node`.

#1 would have `Review.cursor`:

```gql
type Review {
  id: ID!
  author: User!
  text: String!
  stars: Int
  fullReview: String!
  createdAt: Date!
  updatedAt: Date!
  cursor: String
}

enum ReviewOrderBy {
  createdAt_ASC
  createdAt_DESC
}

extend type Query {
  reviews(first: Int, after: String): [Review!]!
  get(id: ID!): Review
}
```

One downside to this is that the cursor isn't really part of a Review's data. For instance, it would be blank when doing a `get` Query where we're just getting a single Review by ID.

#2 would fix that issue, since the cursor is no longer a Review field:

```gql
type ReviewsResult {
  nodes: [Review!]!
  startCursor: String!
  endCursor: String!
}

extend type Query {
  reviews(first: Int, after: String, last: Int, before: String): ReviewsResult!
  get(id: ID!): Review
}
```

We could also add information about the data set—the total number of items and whether there are more items available to query:

```gql
type ReviewsResult {
  nodes: [Review!]!
  startCursor: String!
  endCursor: String!
  totalCount: Int!
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
}
```

#3 has the most involved schema, which we'll go over in [the last section](#relay-cursor-connections):

```gql
type ReviewEdge {
  cursor: String!
  node: Review
}

type PageInfo {
  startCursor: String!
  endCursor: String!
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
}

type ReviewsConnection {
  edges: [ReviewEdge]
  pageInfo: PageInfo!
  totalCount: Int!
}

extend type Query {
  reviews(first: Int, after: String, last: Int, before: String): ReviewsConnection!
  get(id: ID!): Review
}
```

The main two benefits to #3 over #2 are:

- We have the cursor of every object—not just the start and end cursors—so we can request the next page starting at any location in the list.
- We can add more information to the edge. For instance if we had a social platform with a paginated `User.friends` field returning a `FriendsConnection` with `edges: [FriendEdge]`, a `FriendEdge` could include:

```gql
type FriendEdge {
  cursor: String!
  node: Friend
  becameFriendsOn: Date
  mutualFriends: [Friends]
  photosInCommon: [Photo]
}
```

#### after an ID

> If you’re jumping in here, `git checkout pagination_0.1.0` (tag [pagination_0.1.0](https://github.com/GraphQLGuide/guide-api/tree/pagination_0.1.0), or compare [pagination...pagination2](https://github.com/GraphQLGuide/guide-api/compare/pagination_0.1.0...pagination2_0.1.0))

In this section we'll do a limited cursor-like pagination with these three arguments:

`src/schema/Review.graphql`

```gql
extend type Query {
  reviews(after: ID, limit: Int, orderBy: ReviewOrderBy): [Review!]!
}
```

The only change from [skip & limit](#skip-&-limit) is instead of *skip*ing a number of results, we return those *after* an ID. In our resolver, we change `skip -> after` and remove `skip`'s error checking:

`src/resolvers/Review.js`

```js
export default {
  Query: {
    reviews: (
      _,
      { after, limit = 10, orderBy = 'createdAt_DESC' },
      { dataSources }
    ) => {
      const errors = {}

      if (limit < 0) {
        errors.limit = `must be non-negative`
      }

      if (limit > MAX_PAGE_SIZE) {
        errors.limit = `cannot be greater than ${MAX_PAGE_SIZE}`
      }

      if (!isEmpty(errors)) {
        throw new InputError({ review: errors })
      }

      return dataSources.reviews.getPage({ after, limit, orderBy })
    }
  },
  ...
}
```

> We could also check whether `after` is a valid `ObjectId` (as we do in the `Query.user` resolver).

In the data source, if `after` is provided (it's optional), we filter using either `$lt` or `$gt` (less than / greater than):

`src/data-sources/Review.js`

```js
import { ObjectId } from 'mongodb'

export default class Reviews extends MongoDataSource {
  getPage({ after, limit, orderBy }) {
    const filter = {}
    if (after) {
      const afterId = ObjectId(after)
      filter._id =
        orderBy === 'createdAt_DESC' ? { $lt: afterId } : { $gt: afterId }
    }

    return this.collection
      .find(filter)
      .sort({ _id: orderBy === 'createdAt_DESC' ? -1 : 1 })
      .limit(limit)
      .toArray()
  }

  ...
}
```

To test, first let's get the first 5 reviews with their IDs:

![reviews query with limit: 5, showing reviews #12 – #8](img/afterlimit-initial.png)

Then we take the last ID and use it for the `after` argument:

![reviews query with after, showing reviews #7 — #3](img/afterlimit-after.png)

It works! If we wanted to paginate the other way from review #7, we would switch the `orderBy`:

![reviews query with after and orderBy, showing reviews #8 — #12](img/afterlimit-after-orderby.png)

#### Relay cursor connections

> If you’re jumping in here, `git checkout pagination2_0.1.0` (tag [pagination2_0.1.0](https://github.com/GraphQLGuide/guide-api/tree/pagination2_0.1.0), or compare [pagination2...pagination3](https://github.com/GraphQLGuide/guide-api/compare/pagination2_0.1.0...pagination3_0.1.0))

Relay cursor connections are defined by the [Relay Cursor Connections spec](https://facebook.github.io/relay/graphql/connections.htm). It specifies a standard way of implementing cursor pagination so that different clients and tools (like the Relay client library) can depend on that specific schema structure. Its benefits over other cursor structures are listed at the end of the [Cursors](#cursors) section above. Its cost is a more complex schema, like this one:

`src/schema/Review.graphql`

```gql
type ReviewEdge {
  cursor: String!
  node: Review
}

type PageInfo {
  startCursor: String!
  endCursor: String!
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
}

type ReviewsConnection {
  edges: [ReviewEdge]
  pageInfo: PageInfo!
  totalCount: Int!
}

extend type Query {
  reviews(first: Int, after: String, last: Int, before: String): ReviewsConnection!
}
```

Including both `first/after` and `last/before` is optional—according to the spec, only one is required. Also, we can add fields—for instance, `totalCount` isn't in the spec—and add arguments to `Query.reviews` (for instance filtering and sorting arguments). Common added arguments include a `filterBy` object type and `orderBy`, which can be an `enum` as we've been doing or a list (for example `orderBy: [stars_DESC, createdAt_ASC]`). Let's do just `first/after`, `orderBy`, and a single filter field—`stars`:

```gql
extend type Query {
  reviews(first: Int, after: String, orderBy: ReviewOrderBy, stars: Int): ReviewsConnection!
}
```

For implementing the resolver, first we check arguments:

`src/resolvers/Review.js`

```js
export default {
  Query: {
    reviews: async (
      _,
      { first = 10, after, orderBy = 'createdAt_DESC', stars },
      { dataSources }
    ) => {
      const errors = {}

      if (first !== undefined && first < 1) {
        errors.first = `must be non-negative`
      }

      if (first > MAX_PAGE_SIZE) {
        errors.first = `cannot be greater than ${MAX_PAGE_SIZE}`
      }

      if (stars !== undefined && ![0, 1, 2, 3, 4, 5].includes(stars)) {
        errors.stars = `must be an integer between 0 and 5, inclusive`
      }

      if (!isEmpty(errors)) {
        throw new InputError({ review: errors })
      }

      ...

      return {
        edges,
        pageInfo: {
          startCursor,
          endCursor,
          hasNextPage,
          hasPreviousPage
        },
        totalCount
      }
    }
  },
  ...
}
```

Then after some `...` work (which will include one or more calls to `dataSources.reviews.*`), we return an object matching the `ReviewsConnection` in our schema:

```gql
type ReviewsConnection {
  edges: [ReviewEdge]
  pageInfo: PageInfo!
  totalCount: Int!
}
```

Here's how to construct that object:

```js
import { encodeCursor } from '../util/pagination'

export default {
  Query: {
    reviews: async (
      _,
      { first = 10, after, orderBy = 'createdAt_DESC', stars },
      { dataSources }
    ) => {
      ...

      const {
        reviews,
        hasNextPage,
        hasPreviousPagePromise
      } = await dataSources.reviews.getPage({ first, after, orderBy, stars })

      const edges = reviews.map(review => ({
        cursor: encodeCursor(review),
        node: review
      }))

      return {
        edges,
        pageInfo: {
          startCursor: encodeCursor(reviews[0]),
          endCursor: encodeCursor(reviews[reviews.length - 1]),
          hasNextPage,
          hasPreviousPage: hasPreviousPagePromise
        },
        totalCount: dataSources.reviews.getCount({ stars })
      }
    }
  },
```

`dataSources.reviews.getPage()` returns an object with three things. We use `reviews` to create the edges and cursors. Each field returned from a resolver can either be a value or a promise that resolves to a value (Apollo server will resolve the promise for us if that field is selected in the query). Instead of a boolean for `hasPreviousPage`, we return a promise. And for `totalCount`, we call a new data source method `getCount()`:

`src/data-sources/Reviews.js`

```js
export default class Reviews extends MongoDataSource {
  getCount(filter) {
    return this.collection.find(filter).count()
  }

  ...
}
```

The code for `getPage()` is a bit complex. We'll make three database queries to fetch the list of reviews and determine whether there are next and previous pages:

```js
import { decodeCursor } from '../util/pagination'

export default class Reviews extends MongoDataSource {
  getPage({ first, after, orderBy, stars }) {
    const isDescending = orderBy === 'createdAt_DESC'
    const filter = {}
    const prevFilter = {}

    if (after) {
      const afterId = decodeCursor(after)
      filter._id = isDescending ? { $lt: afterId } : { $gt: afterId }
      prevFilter._id = isDescending ? { $gte: afterId } : { $lte: afterId }
    }

    if (stars) {
      filter.stars = stars
    }

    const sort = { _id: isDescending ? -1 : 1 }

    const reviewsPromise = this.collection
      .find(filter)
      .sort(sort)
      .limit(first)
      .toArray()

    const hasNextPagePromise = this.collection
      .find(filter)
      .sort(sort)
      .skip(first)
      .hasNext()

    const hasPreviousPagePromise =
      !!after &&
      this.collection
        .find(prevFilter)
        .sort(sort)
        .hasNext()

    return { reviewsPromise, hasNextPagePromise, hasPreviousPagePromise }
  }
  
  ...
}
```

The reviews query has:

```js
  .limit(first)
  .toArray()
```

whereas to see if there's a next item, we do:

```js
  .skip(first)
  .hasNext()
```

And to check if there's a previous item, we use the opposite `filter` (`$gte`/`$lte` are greater/less than or equal to) and `hasNext()`:

```js
  prevFilter._id = isDescending ? { $gte: afterId } : { $lte: afterId }
  ...
  this.collection
    .find(prevFilter)
    .sort(sort)
    .hasNext()
```

If the number of database queries became a performance problem, we could remove the need for the second by changing `.limit(first)` in the reviews query to `.limit(first + 1)`. Then if we receive `first + 1` results, we know there's a next page:

```js
    ...

    const reviews = await this.collection
      .find(filter)
      .sort(sort)
      .limit(first + 1)
      .toArray()

    const hasNextPage = reviews.length > first
    if (hasNextPage) {
      reviews.pop()
    }

    const hasPreviousPagePromise =
      !!after &&
      this.collection
        .find(prevFilter)
        .sort(sort)
        .hasNext()

    return { reviews, hasNextPage, hasPreviousPagePromise }
  }
```

We do `reviews.pop()` to take the extra last review (which the client didn't request) off the list. 

Now we have a new issue: our latency has gone up, since we're now making two database queries in serial (`await`ing one before starting the other) instead of three queries in parallel (initiating them all at the same time). To fix this, we can create the `hasPreviousPagePromise` before the `await`:

```js
    const hasPreviousPagePromise =
      !!after &&
      this.collection
        .find(prevFilter)
        .sort(sort)
        .hasNext()

    const reviews = await this.collection
      .find(filter)
      .sort(sort)
      .limit(first + 1)
      .toArray()

    const hasNextPage = reviews.length > first
    if (hasNextPage) {
      reviews.pop()
    }

    return { reviews, hasNextPage, hasPreviousPagePromise }
  }
```

If, however, we were more concerned with database load than latency, and reviews queries were made frequently without selecting `Query.reviews.pageInfo.hasPreviousPage`, then we could make those queries only trigger a single database query. The method is by moving `hasPreviousPage` from a property in an object returned by the `Query.reviews` resolver (what we're currently doing) to a `PageInfo` type resolver:

```js
    const getHasPreviousPage = () =>
      !!after &&
      this.collection
        .find(prevFilter)
        .sort(sort)
        .hasNext()

    return { reviews, hasNextPage, getHasPreviousPage }
  }
```

And then we update the resolvers:

`src/resolvers/Review.js`

```js
export default {
  Query: {
    reviews: async (
      _,
      { first = 10, after, orderBy = 'createdAt_DESC', stars },
      { dataSources }
    ) => {
      ...

      const {
        reviews,
        hasNextPage,
        getHasPreviousPage
      } = await dataSources.reviews.getPage({ first, after, orderBy, stars })

      const edges = reviews.map(review => ({
        cursor: encodeCursor(review),
        node: review
      }))

      return {
        edges,
        pageInfo: {
          startCursor: encodeCursor(reviews[0]),
          endCursor: encodeCursor(reviews[reviews.length - 1]),
          hasNextPage,
          getHasPreviousPage
        },
        totalCount: dataSources.reviews.getCount({ stars })
      }
    }
  },
  PageInfo: {
    hasPreviousPage: ({ getHasPreviousPage }) => getHasPreviousPage()
  },
  ...
}
```

Apollo server first calls the `Query.reviews` resolver, which returns a `ReviewsConnection` which includes a `PageInfo` object without a `hasPreviousPage` property. Instead, Apollo server will call the `PageInfo.hasPreviousPage` resolver. This resolver receives as its first argument the `pageInfo` sub-object that the resolver above returned, so it can call the `getHasPreviousPage()` function, which either immediately returns a boolean (when there's no `after` argument) or initiates a database query and returns a Promise. And if the `hasPreviousPage` field isn't selected in the GraphQL query, the resolver won't be called, and the database query won't be sent.

Let's try out a query:

![reviews query with first: 3, stars: 5](img/connections-initial.png)

We see that there are 11 total reviews with 5 stars, starting with review #2, and there are no previous pages (`pageInfo.hasPreviousPage` is false). And if we want to request the next 3 after review #4, we use `pageInfo.endCursor` as the next query's `after`:

![reviews query with first, after, and stars](img/connections-after.png)

And we get reviews #5–7 💃☺️.

Lastly, let's look at the cursor creating and decoding:

`src/util/pagination.js`

```js
import { ObjectId } from 'mongodb'

export const encodeCursor = review =>
  Buffer.from(review._id.toString()).toString('base64')

export const decodeCursor = cursor =>
  ObjectId(Buffer.from(cursor, 'base64').toString('ascii'))
```

We take the review's `_id` property and base64-encode it, and then decode it back to an [ASCII](https://en.wikipedia.org/wiki/ASCII) string, which we convert to an ObjectId. 

Using the `_id` works because we only support ordering by createdAt. If we had `orderBy: updatedAt_DESC`, then the cursor would need to contain the review's `updatedAt` property. To differentiate between the two, we could encode an object instead of just an ID string:

```js
export const encodeCursor = (review, orderBy) => {
  const cursorData = ['updatedAt_DESC', 'updatedAt_ASC'].includes(orderBy)
    ? { updatedAt: review.updatedAt }
    : { _id: review._id }

  return Buffer.from(JSON.stringify(cursorData)).toString('base64')
}

export const decodeCursor = cursor =>
  JSON.parse(Buffer.from(cursor, 'base64').toString('ascii'))
```

Also, for either of our encoding systems to work, the client has to continue sending the `orderBy` and `stars` arguments (so that the server know what MongoDB query filter and sort to use). If we wanted the client to be able to just send `first` and `after`, then we would need to encode the ordering and filtering arguments in cursors, so that the server could decode the information later when receiving a cursor as an `after` argument:

```js
export const encodeCursor = (review, orderBy, stars) => {
  const cursorData = {
    _id: review._id,
    updatedAt: review.updatedAt,
    orderBy,
    stars
  }

  return Buffer.from(JSON.stringify(cursorData)).toString('base64')
}
```

## File uploads

Originally web servers saved files to their hard drives or to colocated file servers. Most modern web servers use a third party file storage service like Amazon S3 or Cloudinary. When a user wants to upload a file, there are a few different ways the client can get it to a storage service:

- [Client-side](#client-side): The client sends the file directly to the storage service.
  - Signed: Our API server gives a signature to the client to give to the storage service along with the file. If our API server doesn't give the client a signature (for any reason—for example the client isn't logged in, or the logged-in user doesn't have upload permissions), then the storage service won't accept the file.
  - Unsigned: Our server is not involved, and the storage service accepts any file from any client.
- [Server-side](#server-side): The client sends the file to our server, and we forward it to the storage service.
  - Through GraphQL: The file goes through our GraphQL endpoint.
  - Outside GraphQL: We create a separate endpoint or separate server for the file to go through.

We recommend unsigned client-side file uploads unless the lack of signatures becomes a problem, and if it does, switching to signed. We recommend unsigned because it's the easiest to set up, and we recommend client-side over server-side because the client-side upload process is faster reduces load on the GraphQL server.

Not all storage services support client-side uploads, and among those that do, only some support unsigned uploads. S3, for instance, doesn't really support it (we can configure an S3 bucket for public write access, but then anyone can delete others' uploads). Cloudinary not only supports unsigned uploads, but they also take security measures to prevent abuse.

In the first section we'll go over client-side uploads, and in [the second](#server-side) we'll do server-side through GraphQL.

### Client-side

> If you’re jumping in here, `git checkout 25_0.1.0` (tag [25_0.1.0](https://github.com/GraphQLGuide/guide-api/tree/25_0.1.0), or compare [25...files](https://github.com/GraphQLGuide/guide-api/compare/25_0.1.0...files_0.1.0))

In this section we'll add the server code to support an unsigned client-side upload. (And at the end show the additional code needed for a signed upload.) All we need is a mutation for the client to tell the server the filename, ID, or path, depending on which file storage service we're using. If we wanted to make it general-purpose, we could use the file's full URL instead. For the Guide, we'll use Cloudinary, which gives the client the file's path after the upload is complete (the client-side upload process is [described in Chapter 6](6.md#client-side)). The path—for example `v1551850855/jeresig.jpg`—is then combined by the server with our account URL `https://res.cloudinary.com/graphql/` to form the full URL: 

[https://res.cloudinary.com/graphql/v1551850855/jeresig.jpg](https://res.cloudinary.com/graphql/v1551850855/jeresig.jpg)

We'll use the file upload feature to allow users to add a profile photo (instead of the current use of their GitHub photo), so we'll call the mutation `setMyPhoto` and add it to `User.graphql`:

`src/schema/User.graphql`

```gql
extend type Mutation {
  ...
  setMyPhoto(path: String!): User!
}
```

Since it will be changing a `User` field, we return the modified `User` object.

In the resolver, we checked whether the client is logged in and call a new data source method `setPhoto()`:

`src/resolvers/User.js`

```js
export default {
  ...
  Mutation: {
    createUser: ...,
    setMyPhoto(_, { path }, { user, dataSources }) {
      if (!user) {
        throw new ForbiddenError('must be logged in')
      }

      return dataSources.users.setPhoto(path)
    }
  }
}
```

The method constructs the full photo URL, saves it to the database, and returns the updated user object: 

`src/data-sources/Users.js`

```js
export default class Users extends MongoDataSource {
  ...

  async setPhoto(path) {
    const { user } = this.context
    const photo = `https://res.cloudinary.com/graphql/${path}`
    await this.collection.updateOne({ _id: user._id }, { $set: { photo } })
    return {
      ...user,
      photo
    }
  }
}
```

Now that some user documents will contain a `photo` field, we need to update our resolver:

`src/resolvers/User.js`

```js
export default {
  ...
  User: {
    id: ...,
    email: ...,
    photo(user) {
      if (user.photo) {
        return user.photo
      }

      // user.authId: 'github|1615'
      const githubId = user.authId.split('|')[1]
      return `https://avatars.githubusercontent.com/u/${githubId}`
    },
    createdAt: ...
  },
  Mutation: {
    createUser: ...,
    setMyPhoto: ...
  }
}
```

We return early if the `user` object fetched from the database has a `photo` property. 

We can test out the mutation in Playground with either a valid Authorization header or by hard coding the `authId` in `src/context.js`:

![setMyPhoto mutation in Playground](img/setMyPhoto.png)

If we wanted to do signed client-side upload, then we'd need to make a Query for the client to fetch the signature. Our resolver would call [cloudinary.utils.api_sign_request()](https://cloudinary.com/documentation/upload_images#using_cloudinary_server_side_sdks_to_generate_authentication_signatures) like this:


```js
export default {
  Query: {
    ...
    uploadSignature(_, { uploadParams }, { user }) {
      if (!user) {
        throw new ForbiddenError('must be logged in')
      }

      return cloudinary.utils.api_sign_request(uploadParams, CLOUDINARY_API_SECRET)
    }
  }
}
```

Then the client would send the signature along with the file to Cloudinary's servers (and we would disable unsigned uploads in our Cloudinary account settings). 

If we were using Amazon S3, then we'd use the [`s3.createPresignedPost()`](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#createPresignedPost-property) function to create the signature.

### Server-side

> If you’re jumping in here, `git checkout files_0.1.0` (tag [files_0.1.0](https://github.com/GraphQLGuide/guide-api/tree/files_0.1.0), or compare [files...files2](https://github.com/GraphQLGuide/guide-api/compare/files_0.1.0...files2_0.1.0))

We go over the differences between client-side and server-side [above](#file-uploads). In this section, we'll do server-side file uploads, where the client sends the file to the GraphQL server, which sends it to the storage service (we could send to Cloudinary again, but we'll use Amazon S3 this time for diversity). There are different methods for the client to send the file, and the most common is a multipart HTTP request, which works through:

- an [`Upload`](https://www.apollographql.com/docs/apollo-server/data/file-uploads/) scalar provided by Apollo Server
- the Apollo Link [`apollo-upload-client`](https://github.com/jaydenseric/apollo-upload-client) on the client side

We create a mutation with an argument of type `Upload`:

`src/schema/User.graphql`

```gql
extend type Mutation {
  createUser(user: CreateUserInput!, secretKey: String!): User
  setMyPhoto(path: String!): User!
  uploadMyPhoto(file: Upload!): User!
}
```

We'll need an instance of the AWS S3 client library ([`aws-sdk`](https://aws.amazon.com/sdk-for-node-js/)) to upload to S3:

`src/util/s3.js`

```js
import AWS from 'aws-sdk'

export default new AWS.S3()
```

We'll import and use it in the resolver:

`src/resolvers/User.js`

```js
import s3 from '../util/s3'

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export default {
  ...
  Mutation: {
    ...
    uploadMyPhoto: async (_, { file }, { user, dataSources }) => {
      if (!user) {
        throw new ForbiddenError('must be logged in')
      }

      const { createReadStream, filename, mimetype } = await file

      if (!IMAGE_MIME_TYPES.includes(mimetype)) {
        throw new InputError({ file: 'must be an image file' })
      }

      const stream = createReadStream()
      const { Location: fileUrl } = await s3
        .upload({
          Bucket: 'guide-user-photos',
          Key: filename,
          Body: stream
        })
        .promise()

      return dataSources.users.setPhoto(fileUrl)
    }
  }
}
```

We first check if the user is logged in, then we check the file type (valid values taken from a [list of MIME types](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types)), and then we create a Node.js file stream, which we pass to [`s3.upload()`](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#upload-property) along with the S3 *bucket* (the top-level folder in S3, and the subdomain of the file's URL) and the filename. Finally, we call the data source `setPhoto()` method, which used to take a path, but let's refactor it to take a full URL:

`src/data-sources/Users.js`

```js
export default class Users extends MongoDataSource {
  ...
  
  async setPhoto(photo) {
    const { user } = this.context
    await this.collection.updateOne({ _id: user._id }, { $set: { photo } })
    return {
      ...user,
      photo
    }
  }
}
```

Changing the parameter means we need to update where we used it previously:

`src/resolvers/User.js`

```js
export default {
  ...
  Mutation: {
    createUser...
    setMyPhoto(_, { path }, { user, dataSources }) {
      if (!user) {
        throw new ForbiddenError('must be logged in')
      }

      return dataSources.users.setPhoto(
        `https://res.cloudinary.com/graphql/${path}`
      )
    },
    uploadMyPhoto...
  }
}
```

We pass the full cloudinary URL instead of just the path.

In order for the AWS SDK to authenticate our account, we need to add `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` to our `.env`.

> To test this section yourself, you need an AWS account, a bucket created in the [S3 management console](https://s3.console.aws.amazon.com/s3/home), and access keys created in the [Identity and Access Management console](https://console.aws.amazon.com/iam/home). You'd replace `'guide-user-photos'` in `src/resolvers/User.js` with your bucket name, and you'd put your own access keys in `.env`. Then you'd write [a test like this](https://github.com/jaydenseric/graphql-upload/blob/b70a67dd4d0aee4eeccbd261ae6105a2bace418e/test/lib/graphqlUploadExpress.test.js#L37-L64) or create a small web app that used [`apollo-upload-client`](https://github.com/jaydenseric/apollo-upload-client) to send a file in a `uploadMyPhoto` Mutation.

When the `uploadMyPhoto` Mutation is run, the upload is successful, and the server saves a URL like this in the `photo` field of the current user's MongoDB document:

`https://guide-user-photos.s3.amazonaws.com/filename.jpg`

## Schema validation

In this section we'll go over schema validation and how to set it up using [Apollo Graph Manager](https://www.apollographql.com/docs/graph-manager/). 

There are three places where our server is currently doing things that we might call schema validation: 

- `gql` parses our [SDL](https://www.apollographql.com/docs/apollo-server/schema/schema/#the-schema-definition-language) strings and throws errors when they're invalid.
- On startup, `ApolloServer` checks the `typeDefs` it receives to see if our whole schema is valid, according to the GraphQL spec. 
- While running, `ApolloServer` validates queries against the schema.

However, usually the term *schema validation* refers to something else: schema change validation, whether a *change* to a schema is valid. That is, when we create a deploy a schema, and clients use it, and we make changes to the schema, and want to deploy the new schema, then we first use schema validation to check whether the change is valid. "Valid" in this context can have different meanings. We could say it's invalid if any of the changes are backward incompatible. However, sometimes we want to make backward incompatible changes. So often "valid" means that the changes will work with X% of queries in the last N days. The default for Apollo Graph Manager is 100% of queries in the last 7 days. This way backward-incompatible changes can be made as long as there aren't any clients currently (in the past week) using them.

`graphql-inspector` is a command-line tool for [finding breaking or dangerous changes](https://graphql-inspector.com/docs/essentials/diff) and [GraphQL Doctor](https://github.com/cap-collectif/graphql-doctor) is a GitHub app that does the same for pull requests, comparing the PR's schema against the schema in `master`. However, we recommend Graph Manager if you can (the validation feature requires a paid plan). Its method of validating against the query patterns of our clients is more broadly useful, and it's easy to use from the command line, in continuous integration, and in GitHub PRs.

The first step to setting up Graph Manager is setting the env var `ENGINE_API_KEY` to the value we get from our [Graph Manger account](https://engine.apollographql.com/). We already added it to our `.env` in the [Analytics](#analytics) section. Having `ENGINE_API_KEY` configures the `apollo` command-line tool, which we use for schema registration and validation, and it enables metrics reporting (which we need for validation, because validation is based on clients' queries, which are collected metrics).

The second step we also did in the Analytics section: registering our schema with Graph Manager. Let's assume we have our app running in production at `api.graphql.guide`. We would register the production schema with:

```
$ npx apollo service:push --endpoint="https://api.graphql.guide/graphql" --tag=prod
```

We use `--tag` to denote which *variant*—Graph Manager tracks variants of schemas, each with their own metrics and schema history. So the above command says to apollo: "introspect the schema at `api.graphql.guide` and save it as the latest version of our 'prod' schema variant." 

> Registration has other uses beyond validation—it also powers the [Apollo VS Code extension](https://marketplace.visualstudio.com/items?itemName=apollographql.vscode-apollo) Graph Manager's schema history and analytics.

Then when we make changes to our schema, before we push to production, we check to see whether the change is valid by running `npm run dev` in one terminal and the following in another:

```
$ npx apollo service:check --endpoint="http://localhost:4000/graphql" --tag=prod
```

This says "introspect the schema of the server running on port 4000 of my machine and validate it against the latest production schema." It will output either success or a list of which changes fail validation, like this:

```
$ npx apollo service:check ...
  ✔ Loading Apollo Project
  ✔ Validated local schema against tag prod on service engine
  ✔ Compared 8 schema changes against 110 operations over the last 7 days
  ✖ Found 2 breaking changes and 3 compatible changes
    → breaking changes found

FAIL    ARG_REMOVED                `Query.searchUsers` arg `term` was removed
FAIL    FIELD_REMOVED              `Review.stars` was removed

PASS    FIELD_ADDED                `Review.starCount` was added
PASS    ARG_ADDED                  `Query.searchUsers` arg `partialName` was added
PASS    TYPE_REMOVED               `ReviewComment` removed
PASS    FIELD_DEPRECATION_REMOVED  `Review.text` is no longer deprecated

View full details at: https://engine.apollographql.com/service/example-123/check/foo
```

Given the validation failure, we would know to not push to production. 

We can save ourselves time and the risk of forgetting to run the validation command by automating it—for instance with the [Apollo Engine GitHub App](https://github.com/apps/apollo-engine) or with a continuous integration service like CircleCI:

`.circleci/config.yml`

```yml
version: 2

jobs:
  validate_against_production:
    docker:
      - image: circleci/node:8

    steps:
      - checkout

      - run: npm install

      - run:
          name: Starting server
          command: npm start
          background: true

      # Wait for server to start up
      - run: sleep 5

      - run: npx apollo service:check --endpoint="http://localhost/graphql" --serviceName=users --tag=prod
```

Validating Apollo federation services is similar, and we'll see how in the [Managed federation](#managed-federation) section below.

## Apollo federation

- [Federated service](11.md#federated-service)
- [Federated gateway](11.md#federated-gateway)
- [Extending entities](11.md#extending-entities)
- [Managed federation](11.md#managed-federation)
- [Deploying federation](11.md#deploying-federation)

In the [Introduction](#introduction) to this chapter, we talk about microservices versus monoliths. If we go down the microservice route, then the best way to do it is with Apollo federation. 

Apollo federation is a specification for how to divide our schema across different services. Each service describes which parts of the schema it implements, and a gateway combines all the parts into one larger schema. The gateway stands between the client and the services, receiving requests from the client and automatically resolving them through one or more requests to services.

The Apollo federation specification can be implemented in any language, and has been added to many [existing GraphQL server libraries](https://www.apollographql.com/docs/apollo-server/federation/other-servers/). Those servers that follow the specification are the services, and the gateway is is a special instance of Apollo server that uses the [`@apollo/gateway`](https://www.apollographql.com/docs/apollo-server/api/apollo-gateway/) library.

In the first three sections we'll rebuild our Guide server monolith using federation: we'll start with a users service, then the gateway, and then the reviews service. Then in [Managed federation](11.md#managed-federation) we'll see how we can benefit from Apollo's Graph Manager SaaS product, and finally in [Deploying federation](11.md#deploying-federation) we'll discuss the deployment of the gateway and services.

### Federated service

> If you’re jumping in here, `git checkout federation_0.1.0` (tag [federation_0.1.0](https://github.com/GraphQLGuide/guide-api/tree/federation_0.1.0), or compare [federation...federation2](https://github.com/GraphQLGuide/guide-api/compare/federation_0.1.0...federation2_0.1.0))

In this section we'll build a users service: a GraphQL server that supports Apollo federation and handles queries related to the `User` type. We'll start from a new tag:

```sh
$ git checkout federation_0.1.0
```
Here is our starting file structure:

```sh
$ tree -L 3
.
├── babel.config.json
├── lerna.json
├── lib
│   ├── Date.js
│   ├── auth.js
│   ├── db.js
│   └── errors.js
├── package.json
└── services
    ├── reviews
    │   └── package.json
    └── users
        └── package.json
```

The two services will go in the `services/` folder, and `lib/` contains code to share between the services (taken from the monolith we built earlier). Let's install all the modules we need:

```sh
$ npm install
```

This creates a `node_modules/` at the root—which has modules for the gateway code that we'll place at the root—and it also creates `node_modules/` folders inside `services/reviews/` and `services/users/` thanks to the [Lerna library](https://lerna.js.org/), which we configure in `lerna.json` and use in a `postinstall` script in `package.json`:

```json
{
  "name": "guide-api",
  "version": "0.1.0",
  "scripts": {
    "start": "babel-watch gateway.js",
    "start-service-users": "babel-watch services/users/index.js",
    "start-service-reviews": "babel-watch services/reviews/index.js",
    "start-services": "concurrently \"npm:start-service-*\"",
    "postinstall": "lerna bootstrap"
  },
  ...
}
```

We also see from the scripts where we'll locate the main server files: 

```
gateway.js
services/users/index.js
services/reviews/index.js
```

`concurrently` runs multiple other scripts in the same terminal—in this case, both `start-service-users` and `start-service-reviews`.

In this section we'll be filling in `services/users/*`. There are three main parts to a federated service:

- `buildFederatedSchema()`: Instead of passing `typeDefs` and `resolvers` directly to `ApolloServer()`, we give them to the `buildFederatedSchema()` from the `@apollo/federation` library.
- *Entities*: Types defined in one service that can be referenced or extended by other services.
  - `@key` directive: Each entity requires a `@key` directive denoting the primary key.
  - `__resolveReference()`: For each entity, we must write a reference resolver, which fetches an entity object by its `@key` field(s).

As usual, let's start with the schema:

`services/users/schema.js`

```js
import { gql } from 'apollo-server'

export default gql`
  scalar Date

  extend type Query {
    me: User
    user(id: ID!): User
  }

  type User @key(fields: "id") {
    id: ID!
    firstName: String!
    lastName: String!
    username: String!
    email: String
    photo: String!
    createdAt: Date!
    updatedAt: Date!
  }
`
```

We include shared types like custom scalars in the schema of each service. Also, the `Query` and `Mutation` types will be initially defined in the gateway, so the services `extend` them. Finally, our `User` type has this directive: `@key(fields: "id")`, which tells the gateway that the `User` type is a federation entity and the `id` field is its primary key.

We copy the below from our monolith's `src/resolvers/User.js`, with a couple additions:

- Adding the `Date` resolvers, imported from `lib/Date.js`
- Adding `User.__resolveReference`

`services/users/resolvers.js`

```js
import { ForbiddenError } from 'apollo-server'
import { ObjectId } from 'mongodb'

import { InputError } from '../../lib/errors'
import Date from '../../lib/Date'

const OBJECT_ID_ERROR =
  'Argument passed in must be a single String of 12 bytes or a string of 24 hex characters'

export default {
  ...Date,
  Query: {
    me: (_, __, context) => context.user,
    user: (_, { id }, { dataSources }) => {
      try {
        return dataSources.users.findOneById(ObjectId(id))
      } catch (error) {
        if (error.message === OBJECT_ID_ERROR) {
          throw new InputError({ id: 'not a valid Mongo ObjectId' })
        } else {
          throw error
        }
      }
    }
  },
  User: {
    __resolveReference: (reference, { dataSources }) =>
      dataSources.users.findOneById(ObjectId(reference.id)),
    id: ({ _id }) => _id,
    email(user, _, { user: currentUser }) {
      if (!currentUser || !user._id.equals(currentUser._id)) {
        throw new ForbiddenError(`cannot access others' emails`)
      }

      return user.email
    },
    photo(user) {
      // user.authId: 'github|1615'
      const githubId = user.authId.split('|')[1]
      return `https://avatars.githubusercontent.com/u/${githubId}`
    },
    createdAt: user => user._id.getTimestamp()
  }
}
```

The first argument to `__resolveReference` is the reference: an object containing the primary key field(s)—in this case, just the `id`—which we resolve to the user object.

Now we put the resolvers and schema together to create the server:

```js
import { ApolloServer } from 'apollo-server'
import { buildFederatedSchema } from '@apollo/federation'
import { MongoDataSource } from 'apollo-datasource-mongodb'

import resolvers from './resolvers'
import typeDefs from './schema'
import { mongoClient } from '../../lib/db'
import context from '../../lib/userContext'

const server = new ApolloServer({
  schema: buildFederatedSchema([
    {
      typeDefs,
      resolvers
    }
  ]),
  dataSources: () => ({
    users: new MongoDataSource(mongoClient.db().collection('users'))
  }),
  context
})

mongoClient.connect()

server.listen({ port: 4001 }).then(({ url }) => {
  console.log(`🚀 Users service ready at ${url}`)
})
```

Here we see the use of `buildFederatedSchema()`. Also, the only data source method we use is `.findOneById()`, so we can use `MongoDataSource` directly instead of defining a subclass. `mongoClient` we get from `db.js`:

`lib/db.js`

```js
import { MongoClient } from 'mongodb'

const URL = 'mongodb://localhost:27017/guide'

export const mongoClient = new MongoClient(URL)
```

Finally, our `context` function needs to provide a `user` object for the `Query.me` resolver. Our monolith context function looked at the `authorization` header, decoded the `authId`, and fetched the user object. Instead of having each of our services repeat this process, we can have our gateway do part or all of it. We can either do:

1. Gateway decodes `authId` and passes it to services as an `auth-id` header. Services read the header and fetch the user document.
2. Gateway decodes `authId`, connects to the user database to fetch the user document, and passes it to services as a `user` header. 
3. The JWT that's sent in the authorization header from the client can be created to contain the whole user document, so that when it's decoded, no database query is required.

Our JWTs don't have the whole user document, so we can't do #3. Between #1 and #2, #2 is more efficient as it reduces the number of database calls. Note that #2 isn't possible when the user document is large: the maximum header size is set by the receiving server, for instance Nginx has a maximum 4KB, which is ~4,000 ASCII characters. (We can check the length of a user document by doing `JSON.stringify(user).length`.) Here is the service side of #2:

`lib/userContext.js`

```js
module.exports = async ({ req }) => {
  const context = {}

  const userDocString = req && req.headers['user']
  if (userDocString) {
    context.user = JSON.parse(userDocString)
  }

  return context
}
```

Now we can set the `user` HTTP header and both `Query.user` and `Query.me` work:

```
$ npm run start-service-users

> guide-api@0.1.0 start-service-users /guide-api
> babel-watch services/users/index.js

🚀 Users service ready at http://localhost:4001/
```

![user and me queries with user HTTP header](img/user-service.png)

### Federated gateway

> If you’re jumping in here, `git checkout federation2_0.1.0` (tag [federation2_0.1.0](https://github.com/GraphQLGuide/guide-api/tree/federation2_0.1.0), or compare [federation2...federation3](https://github.com/GraphQLGuide/guide-api/compare/federation2_0.1.0...federation3_0.1.0))

In the last section we implemented the users service. In this section, we'll implement the gateway. The basic process is creating an `ApolloGateway()` the points to a list of the services, and then giving that to `ApolloServer()`:

`gateway.js`

```js
import { ApolloServer } from 'apollo-server'
import { ApolloGateway } from '@apollo/gateway'

const gateway = new ApolloGateway({
  serviceList: [
    { name: 'users', url: 'http://localhost:4001/graphql' },
  ]
})

const server = new ApolloServer({
  gateway,
  subscriptions: false
})

server.listen().then(({ url }) => {
  console.log(`🚀 Gateway ready at ${url}`)
})
```

We disable subscriptions because they don't yet work with `ApolloGateway`. This works, but it's not yet sending the `user` HTTP header our users service expects. This takes two steps: copying our monolith's context function to give to `ApolloServer()` and defining a `buildService()` function to add the header in requests to services:

```js
import { ApolloServer } from 'apollo-server'
import { ApolloGateway, RemoteGraphQLDataSource } from '@apollo/gateway'

import context from './context'
import { mongoClient } from './lib/db'

class AuthenticatedDataSource extends RemoteGraphQLDataSource {
  willSendRequest({ request, context }) {
    request.http.headers.set('user', JSON.stringify(context && context.user))
  }
}

const gateway = new ApolloGateway({
  serviceList: [
    { name: 'users', url: 'http://localhost:4001/graphql' },
    { name: 'reviews', url: 'http://localhost:4002/graphql' }
  ],
  buildService({ url }) {
    return new AuthenticatedDataSource({ url })
  }
})

const server = new ApolloServer({
  gateway,
  context,
  subscriptions: false
})

mongoClient.connect()

server.listen().then(({ url }) => {
  console.log(`🚀 Gateway ready at ${url}`)
})
```

`buildService()` returns an `AuthenticatedDataSource` which sets the stringified user doc from the context as a header. `willSendRequest()` is then called for each request from the gateway to the services. We also import `mongoClient` in order to initiate the connection, and context from:

`context.js`

```js
import { AuthenticationError } from 'apollo-server'

import { getAuthIdFromJWT } from './lib/auth'
import { mongoClient } from './lib/db'

export default async ({ req }) => {
  const context = {}

  const jwt = req && req.headers.authorization
  let authId

  if (jwt) {
    try {
      authId = await getAuthIdFromJWT(jwt)
    } catch (e) {
      let message
      if (e.message.includes('jwt expired')) {
        message = 'jwt expired'
      } else {
        message = 'malformed jwt in authorization header'
      }
      throw new AuthenticationError(message)
    }

    const user = await mongoClient
      .db()
      .collection('users')
      .findOne({ authId })
    if (user) {
      context.user = user
    } else {
      throw new AuthenticationError('no such user')
    }
  }

  return context
}
```

The only difference between this and the monolith's version is importing `mongoClient` instead of the `db` directly.

We can now run our users service and gateway in two different terminals:

```sh
$ npm run start-service-users

> guide-api@0.1.0 start-service-users /guide-api
> babel-watch services/users/index.js

🚀 Users service ready at http://localhost:4001/
```

```sh
$ npm start

> guide-api@0.1.0 start /guide-api
> babel-watch gateway.js

🚀 Gateway ready at http://localhost:4000/
[INFO] Wed Mar 1 2020 04:55:43 GMT-0400 (EST) apollo-gateway: Gateway successfully loaded schema.
        * Mode: unmanaged
```

When we open the gateway URL, set our authorization header, and query, it works! 💃

![user and me queries with authorization header](img/user-through-gateway.png)

### Extending entities

> If you’re jumping in here, `git checkout federation3_0.1.0` (tag [federation3_0.1.0](https://github.com/GraphQLGuide/guide-api/tree/federation3_0.1.0), or compare [federation3...federation4](https://github.com/GraphQLGuide/guide-api/compare/federation2_0.1.0...federation4_0.1.0))

In this section we'll build another service—this one for reviews—and we'll see how to extend entities created by other services. Then we'll add the reviews service to the gateway and see how the gateway resolves queries involving both services.

Let's start with the schema. First we take the `Review` type and `reviews` query from our monolith for our new schema, and then we add a few things:

`services/reviews/schema.js`

```js
import { gql } from 'apollo-server'

export default gql`
  scalar Date

  type Review @key(fields: "id") {
    id: ID!
    text: String!
    stars: Int
    author: User!
    createdAt: Date!
    updatedAt: Date!
  }

  extend type Query {
    reviews: [Review!]!
  }

  extend type User @key(fields: "id") {
    id: ID! @external
    reviews: [Review!]!
  }
`
```

- `scalar Date`, as we did in the users service
- `@key` directive for `type Review`, to declare it as a federation entity
- `extend type User`: Here we're extending the `User` type originally defined externally. We have to include both the `@key` directive as well as the primary key fields—in this case just `User.id`—with the `@external` directive (signifying that this field was originally defined in another service). The `reviews` field doesn't have `@external`, which means it's being added to the `User` type, and we'll need to write a resolver for it:

`services/reviews/resolvers.js`

```js
import { ObjectId } from 'mongodb'

import Date from '../../lib/Date'

export default {
  ...Date,
  Query: {
    reviews: (_, __, { dataSources }) => dataSources.reviews.all()
  },
  Review: {
    __resolveReference: (reference, { dataSources }) =>
      dataSources.reviews.findOneById(ObjectId(reference.id)),
    id: review => review._id,
    author: review => ({ id: review.authorId }),
    createdAt: review => review._id.getTimestamp()
  },
  User: {
    reviews: (user, _, { dataSources }) =>
      dataSources.reviews.all({ authorId: ObjectId(user.id) })
  }
}
```

These resolvers are taken from our monolith with four additions:

- The `Date` custom scalar resolver.
- The `Review.__resolveReference` resolver, required because this service is the origin of the `Review` entity.
- The `Review.author` resolver, which returns a `reference` (the same reference passed to `__resolveReference` above)—an object with an entity's primary key. The gateway takes this reference and provides it to the `User.__resolveReference` resolver to get the user object.
- The `User.reviews` resolver, which uses the data source `review.all()` method with a MongoDB selector. Speaking of which, we need a `Reviews` data source with a `.all()` method:

`services/reviews/Reviews.js`

```js
import { MongoDataSource } from 'apollo-datasource-mongodb'

export default class Reviews extends MongoDataSource {
  all(query) {
    return this.collection.find(query).toArray()
  }
}
```

We'll include this, along with our schema and resolvers, when creating the server:

`services/reviews/index.js`

```js
import { ApolloServer } from 'apollo-server'
import { buildFederatedSchema } from '@apollo/federation'

import resolvers from './resolvers'
import typeDefs from './schema'
import Reviews from './Reviews'
import { mongoClient } from '../../lib/db'
import context from '../../lib/userContext'

const server = new ApolloServer({
  schema: buildFederatedSchema([
    {
      typeDefs,
      resolvers
    }
  ]),
  dataSources: () => ({
    reviews: new Reviews(mongoClient.db().collection('reviews'))
  }),
  context
})

mongoClient.connect()

server.listen({ port: 4002 }).then(({ url }) => {
  console.log(`🚀 Reviews service ready at ${url}`)
})
```

We use the same context function that the users service uses and a new port (4002, versus 4001 for the users service and the default 4000 for the gateway).

One piece of our old schema that we're missing is `Review.fullReview`. Since it involves the author's name, we need to query the users collection. And the service that is responsible for querying the users collection is the users service. So let's add the field to the users service:

`services/users/schema.js`

```js
export default gql`
  ...

  extend type Review @key(fields: "id") {
    id: ID! @external
    fullReview: String!
  }
`
```

Like with `extend type User`, when we `extend type Review` we repeat the directive and include the primary key field. However, we have an issue: the `fullReview` resolver needs data from the review document (`authorId`, `text`, and `stars`). By default, the resolver will only receive an object with the review's `id` field. 

We can solve this issue with the `@requires` directive:

```js
export default gql`
  ...

  extend type Review @key(fields: "id") {
    id: ID! @external
    text: String! @external
    stars: Int @external
    authorId: ID! @external
    fullReview: String! @requires(fields: "authorId text stars")
  }
`
```

We list the fields we require in order to resolve `fullReview` using `@requires`, and we list those fields above with `@external`. The last issue is that `authorId` isn't currently part of the `Review` type, so let's add it to the reviews service schema:

`services/reviews/schema.js`

```js
export default gql`
  scalar Date

  type Review @key(fields: "id") {
    id: ID!
    text: String!
    stars: Int
    authorId: ID!
    author: User!
    createdAt: Date!
    updatedAt: Date!
  }

  ...
`
```

This has the effect of `authorId` appearing in the public gateway schema as well, which isn't ideal, as it unnecessarily clutters the schema, but the ability to define an private, internal field is [a planned addition](https://github.com/apollographql/apollo-server/issues/2812) to the federation spec.

Finally, we can implement the `fullReview` resolver back in the users service:

`services/users/resolvers.js`

```js
export default {
  ...
  Review: {
    fullReview: async (review, _, { dataSources }) => {
      const author = await dataSources.users.findOneById(
        ObjectId(review.authorId)
      )
      return `${author.firstName} ${author.lastName} gave ${review.stars} stars, saying: "${review.text}"`
    }
  }
}
```

We add the reviews service to our gateway by simply adding it to our `serviceList`:

`gateway.js`

```js
const gateway = new ApolloGateway({
  serviceList: [
    { name: 'users', url: 'http://localhost:4001/graphql' },
    { name: 'reviews', url: 'http://localhost:4002/graphql' }
  ],
  buildService({ url }) {
    return new AuthenticatedDataSource({ url })
  }
})
```

We can run both services with:

```sh
$ npm run start-services
```

And in another terminal run the gateway:

```sh
$ npm start
```

And test! 🙏

![reviews query with author.firstName and fullReview](img/reviews-through-gateway.png)

✅ Here we see both of the jumps from the reviews service to the user service working: the reviews service resolves `Query.reviews` and the `Review.author` reference, and the users service resolves the reference into a user, as well as `User.firstName` and `Review.fullReview`.

Next we can see that going from the users service to the reviews service works: first the users service resolves `Query.user`, and then the reviews service resolves `User.reviews`.

![user query with User.reviews selected](img/user-reviews-through-gateway.png)

To see a more detailed explanation of the *query plan*—the process by which the gateway determines how to get all the data it needs from the services—we can add this last argument to `ApolloGateway()`:

```js
const gateway = new ApolloGateway({
  serviceList...  
  buildService...
  __exposeQueryPlanExperimental: true
})
```

Now inside Playground we can open the QUERY PLAN tab on the bottom-right:

![Query plan tab in Playground](img/user-reviews-through-gateway.png)

```gql
{
  user(id: "5d24f846d2f8635086e55ed3") {
    id
    firstName
    reviews {
      stars
      text
    }
  }
}
```

The above query results in the below query plan:

```gql
QueryPlan {
  Sequence {
    Fetch(service: "users") {
      {
        user(id: "5d24f846d2f8635086e55ed3") {
          id
          firstName
          __typename
        }
      }
    },
    Flatten(path: "user") {
      Fetch(service: "reviews") {
        {
          ... on User {
            __typename
            id
          }
        } =>
        {
          ... on User {
            reviews {
              stars
              text
            }
          }
        }
      },
    },
  },
}
```

`Sequence` means the following queries are done in sequence—one after the other. So first it does a `Fetch` from the users service, and then a fetch from the reviews service.

Our first query involves a `Parallel` in addition to a `Sequence`:

```gql
{
  reviews {
    author {
      firstName
    }
    fullReview
  }
}
```

```gql
QueryPlan {
  Sequence {
    Fetch(service: "reviews") {
      {
        reviews {
          author {
            __typename
            id
          }
          __typename
          id
          authorId
          text
          stars
        }
      }
    },
    Parallel {
      Flatten(path: "reviews.@") {
        Fetch(service: "users") {
          {
            ... on Review {
              __typename
              id
              authorId
              text
              stars
            }
          } =>
          {
            ... on Review {
              fullReview
            }
          }
        },
      },
      Flatten(path: "reviews.@.author") {
        Fetch(service: "users") {
          {
            ... on User {
              __typename
              id
            }
          } =>
          {
            ... on User {
              firstName
            }
          }
        },
      },
    },
  },
}
```

The gateway first fetches from the reviews service and then does two fetches from the users service for each review, all in parallel. 

We can look at the query plan to diagnose performance issues—it's possible that the query plan will show a lot of fetches in series (`Sequence`), which increases latency. In the case of bugs, it might also help us discover why it's not working as we expect. 

Another tool we have for diagnosing bugs is our gateway's `RemoteGraphQLDataSource`, to which we can add the `didReceiveResponse` method, where we can log responses from the services:

```js
class AuthenticatedDataSource extends RemoteGraphQLDataSource {
  willSendRequest...

  didReceiveResponse({ response, request, context }) {
    console.log('response data:', response.data)
    return response
  }
}
```

Here are further capabilities we aren't using:

- Having [multiple primary keys](https://www.apollographql.com/docs/apollo-server/federation/entities/#defining-multiple-primary-keys) or [compound primary keys](https://www.apollographql.com/docs/apollo-server/federation/entities/#defining-a-compound-primary-key)
- Resolving other services' fields with the [`@provides`](https://www.apollographql.com/docs/apollo-server/federation/entities/#resolving-another-services-field-advanced) directive
- [Modifying the gateway's response](https://www.apollographql.com/docs/apollo-server/federation/implementing/#customizing-outgoing-responses)
- Using [custom directives](https://www.apollographql.com/docs/apollo-server/federation/implementing/#implementing-custom-directives)

### Managed federation

As we've been running the gateway, we've been seeing the output:

```
        * Mode: unmanaged
```

The default gateway mode is unmanaged. A gateway is *managed* when it's connected to Apollo Graph Manager, the SaaS tool we've used previously for [Analytics](#analytics) and [Schema validation](#schema-validation). `ApolloGateway` will connect to Graph Manager if we set `ENGINE_API_KEY` and make one change to the code—remove the `serviceList` argument in the constructor:

`gateway.js`

```js
const gateway = new ApolloGateway({
  serviceList: [
    { name: 'users', url: 'http://localhost:4001/graphql' },
    { name: 'reviews', url: 'http://localhost:4002/graphql' }
  ],
  buildService({ url }) {
    return new AuthenticatedDataSource({ url })
  },
  __exposeQueryPlanExperimental: true
})
```

In managed federation, instead of listing the service URLs in the gateway, we register each service with Graph Manager, and the gateway gets the service info from Graph Manager. This has two main benefits: 

1. When we add services, change service URLs, or change service schemas, we don't need to redeploy the gateway.
2. When there's an error with one of the changes in #1, the gateway can automatically fall back to the last working configuration.

We register a service in the same way we registered our monolith's schema in [Analytics](#analytics) and [Schema validation](#schema-validation)—with the `apollo service:push` command:

```sh
$ npx apollo service:push \
    --serviceName=users \
    --serviceURL="http://users.svc.cluster.local:4001/" \
    --endpoint="http://localhost:4001/"
```

We can view the list of services we've pushed:

```sh
$ npx apollo service:list
  ✔ Loading Apollo Project
  ✔ Fetching list of services for graph guide-api

name       URL                                      last updated
─────────  ───────────────────────────────────────  ────────────────────────
Users      http://users.svc.cluster.local:4001/    5 March 2020 (5 days ago)
Reviews    http://reviews.svc.cluster.local:4002/  5 March 2020 (5 days ago)

View full details at: https://engine.apollographql.com/graph/guide-api/service-list
```

To validate the service, we use `--serviceName` with the `apollo service:check` command we used in the [Schema validation](#schema-validation) section:

```sh
$ npx apollo service:check \
    --serviceName=users \
    --endpoint="http://localhost:4001/" \
    --tag=prod \
```

> Just as monolith schemas can have multiple *variants*, denoted by the `--tag` option, so can federated schemas.

This command not only validates the service's schema against recent usage data, but also checks failed composition—that is, a failure in the ability to compose the whole federated schema. 

Now we know how to set up Graph Manager with federation and to validate changes to services to make sure they don't break clients and to make sure they continue to fit into the whole data graph.

### Deploying federation

The gateway and our services are all just Node.js servers, so we can use any of the deployment options we discussed in the main [Deployment section](#deployment). And Apollo gateway doesn't yet support subscriptions, so FaaS websocket support isn't an issue like it was before. One new issue is the recommendation that services not be publicly accessible. Federation services need to expose extra information to work with the gateway (note the added `_service` and `_entities` root query fields), and we might not want people to be able to access it. 

There are a number of different options for deploying services privately, including:

- IaaS or Faas: Amazon's VPC ([Virtual Private Cloud](https://aws.amazon.com/vpc/)) with either EC2 or Lambda
- Paas: Heroku's [Private Spaces](https://www.heroku.com/private-spaces) (requires an Enterprise account)
- Kubernetes [private clusters](https://cloud.google.com/kubernetes-engine/docs/concepts/private-cluster-concept)

And if we didn't care about the information exposure, we could use public-only options like Zeit Now.

There are three steps we usually do around deployment:

- Schema validation (`apollo service:check`)
- Code deployment (various)
- Push new service information to Graph Manager (`apollo service:push`)

Normally it's best to do them in the order listed—first checking if the service's schema will fit in the graph and not break queries, then deploying the code, and finally, once the production servers are ready to receive requests, telling the gateway about the updated service. In CircleCI, it would look something like this:

`.circleci/config.yml`

```yml
version: 2

jobs:
  deploy_to_prod:
    docker:
      - image: circleci/node:8

    steps:
      - checkout

      - run: npm install

      - run:
          name: Starting server
          command: npm start
          background: true

      # Wait for server to start up
      - run: sleep 5

      - run: npx apollo service:check --serviceName=users --endpoint="http://localhost/graphql" --tag=prod

      - run: npm run deploy

      # Wait for production servers to restart
      - run: sleep 5

      - run: npx apollo service:push --serviceName=users --endpoint="http://localhost/graphql/" --tag=prod
```

If the `service:check` command fails, the CircleCI build will fail, and `npm run deploy` and subsequent commands won't get run.

When a `service:push` is not backward compatible with our gateway's query planner (for instance when we change `@key @requires @provides` directives), then we should do the `service:push` *before* deploying. And generally, when we make modifications that affect the query planner, we need to do things in steps like these: [Apollo Docs: Modifying query-planning logic](https://www.apollographql.com/docs/graph-manager/federation/#modifying-query-planning-logic). The article has different instructions for *in-place* versus *atomic* changes. In-place is when we deploy a service to the same domain, whereas atomic is when we deploy a service to a new domain and `service:push` to point the gateway at the new domain. Let's look at the difference using Zeit Now, which creates unique URL with every deployment. 

In-place, deploying to the existing `serviceUrl`:

```sh
$ apollo service:push \
    --tag=prod 
    --serviceName=users 
    --endpoint="http://localhost:4001"
$ now --prod
> https://users.api.graphql.guide
> Success! Deployment ready
```

Atomic, changing the `serviceUrl`:

```sh
$ now
> https://users-61h1hvwis.now.sh/
> Success! Deployment ready
$ apollo service:push \
    --tag=prod \
    --serviceName=users \
    --endpoint="http://localhost:4001" \
    --serviceUrl="https://users-61h1hvwis.now.sh/"
```

-------

In summary, we started out this Apollo federation section by building a [users service](11.md#federated-service) and connecting it to [a gateway](11.md#federated-gateway). Then we built a [second service](#extending-entities) for reviews and extended entities. Finally, we learned how to set up [managed federation](11.md#managed-federation) and [how to deploy](11.md#deploying-federation). 🚀

## Hasura

TODO

## Schema design

* [One schema](11.md#one-schema)
* [User centric](11.md#user-centric)
* [Easy to understand](11.md#easy-to-understand)
* [Easy to use](11.md#easy-to-use)
* [Mutations](11.md#mutations)
  * [Arguments](11.md#arguments)
  * [Payloads](11.md#payloads)
* [Versioning](11.md#versioning)

### One schema

> Ash graph durbatulûk,
> ash graph gimbatul,
> ash graph thrakatulûk,
> agh gateway-ishi krimpatul.
> 
> Inscription upon the Ring of Byron, written in Black Speech. Translates as:
> 
> One graph to rule them all, 
> one graph to find them,
> one graph to bring them all, 
> and in the gateway bind them.

The first principle of schema design is there should only be one schema! While we can *implement* it as smaller schemas and a [federation gateway](11.md#apollo-federation), from the perspective of the client there should only be one schema (or *data graph*). And while this may seem obvious, there are many large companies whose GraphQL adoption began by independent teams creating their own GraphQL APIs. This results in a lot of duplication of effort—not only duplicated resolvers where the schemas overlap, but also management of the APIs. We also might wind up with clients that need to make requests from two separate endpoints, which our frontend devs might find... inconvenient 😄. Which brings us to the first principle of design in general, which is:

### User centric

**Design things for the people who will be using them.**

The people who will be using our schema are primarily our frontend devs (or, in the case of a public API, the world's frontend devs 😊), so we want to design the schema for them—we want our API to be:

- Easy to understand 
- Easy to use 
- Hard to make mistakes or create bugs with

Secondarily, our schema is used by our end users (the people using the software written by the frontend devs) and ourselves (the backend devs). For our end users, we take into consideration things like latency (maybe having a single mutation that did two things would get results to the user faster than two mutations that had to be executed serially) or the clarity of error types. For ourselves, we take into consideration how difficult our schema will be to run, secure, and update. For instance, we might decide to not include a query field that would take too much server resources to resolve. Or we might structure parts of the schema to make it easier to add fields later on.

Once we've read this section, we can have a meeting with our frontend devs, UX designers, product managers, etc. to create the core types and queries based on what data the frontend needs and mutations based on the user action flows. We do *not* want to start writing the schema based on backend implementation / naming / structure / tech details. It shouldn't look like our REST APIs or be a mirror of our database tables.

> One good option for how to structure your schema creation meeting is [event storming](https://khalilstemmler.com/articles/graphql/ddd/schema-design/).

Our schema also shouldn't be perfect or comprehensive. It should only cover the use cases for which it's needed right now—we shouldn't design it based on hypothetical future requirements:

> Fields shouldn't be added to the schema speculatively. Ideally, each field should be added only in response to a concrete need by a consumer for additional functionality, while being designed for maximum reuse by other consumers that have similar needs.
>
> Updating the graph should be a continuous process. Rather than releasing a new “version” of the graph periodically, such as every 6 or 12 months, it should be possible to change the graph many times a day if necessary. New fields can be added at any time. To remove a field, it is first deprecated, and then removed when no consumers use it.
> —[Principled GraphQL](https://principledgraphql.com/agility)

### Easy to understand

We want others to be able to understand our schema just by reading it. We don't want them to read it, not fully get it, and then have to talk to us or learn through trial and error. Ideally we don't even want them to have to read schema descriptions—just the types themselves. It's the same reason why it's easier to understand readable code than commented code, for example:

```js
const resolvers = {
  Mutation: {
    addWineToCart(_, { wineId }, { user }) {
      // first check if user is allowed to drink
      if (new Date(Date.now() - user.dateOfBirth.getTime()).getUTCFullYear() - 1970 < 21) {
        throw new ForbiddenError()
      }

      ...
    }
  }
}
```

The `if` statement condition is complicated and not *readable* (i.e. we don't immediately understand what it means by glancing at it), so we read the comment above it to learn what the `if` statement is for. Versus in the below code, we can just read it:

```js
const US_DRINKING_AGE = 21

const context = async ({ req }) => {
  const user = await getUser(req.headers.authorization)

  user.age = function() {
    const millisecondsSinceBirth = Date.now() - this.dateOfBirth.getTime()
    return new Date(millisecondsSinceBirth).getUTCFullYear() - 1970
  }
  user.isAllowedToDrink = function() {
    return user.age() >= US_DRINKING_AGE
  }

  return { user }
}

const resolvers = {
  Mutation: {
    addWineToCart(_, { wineId }, { user }) {
      if (!user.isAllowedToDrink()) {
        throw new ForbiddenError()
      }

      ...
    }
  }
}
```

While this is many more lines of code, that's not as important as readability. And all we need to read now is `if (!user.isAllowedToDrink())`, which is readily understandable. At most we may need to mentally move the location of the "not" from "if not user is allowed to drink" to "if user is not allowed to drink."

For a schema example of this concept, let's imagine we were building an online store, and we had this mutation:

```gql
type Mutation {
  add(productId: ID!): Cart
  checkout: Order
}
```

Then we realized that while people could probably infer that the `add` mutation meant add a product to the cart (given the argument name and return type), it would be clearer if we added a field description:

```gql
type Mutation {
  # add product to cart
  add(productId: ID!): Cart
  checkout: Order
}
```

While the new "add product to cart" description now appears in Playground autocomplete (and in the DOCS tab after clicking `add`), it has a couple downsides:

- It takes us another step to look for and read the description, versus just reading the field name.
- When we read a query document in the client code, we just see the mutation name—not the description.

We can remove the need for a comment by making the mutation name clearer:

```gql
type Mutation {
  addProductToCart(productId: ID!): Cart
  checkout: Order
}
```

Readability starts with giving clear names to things. In this case, it was giving a full, specific name—not just `add` or `addProduct`, but `addProductToCart`. Here are a few more examples of specificity:

- Instead of just a `Review` type, use `ProductReview`. Then schema readers know what the review is for, and in the future we can add other review types, like `StoreReview`, without confusion.
- If we have two types of reviews, we shouldn't try to fit them both into a single type. Instead of `Review`, with the 3rd field for product reviews and the 4th and 5th fields for store reviews, we should have two types with different fields:

```gql
# 👎
type Review {
  id: ID!
  stars: Int!
  productReviewText: String
  storeDeliveryRating: Int
  storeCustomerSupportRating: Int
}

# 👍
type ProductReview {
  id: ID!
  stars: Int!
  text: String!
}

type StoreReview {
  id: ID!
  stars: Int!
  deliveryRating: Int!
  customerSupportRating: Int
}
```

And if we want to handle them together, we could have them both implement a `Review` interface and reference that:

```
type Query {
  searchReviews(term: String!): [Review!]!
}

interface Review {
  id: ID!
  stars: Int!
}

type ProductReview implements Review {
  id: ID!
  stars: Int!
  text: String!
}

type StoreReview implements Review {
  id: ID!
  stars: Int!
  deliveryRating: Int!
  customerSupportRating: Int
}
```

- Instead of a generic query with a generic argument or a list of optional arguments, make multiple specific queries with non-null arguments:

```gql
# 👎
type Query {
  user(fields: UserFieldInput): User!
}

input UserFieldInput {
  id: ID
  username: String
}

# 👍
type Query {
  userById(id: ID!): User!
  userByUsername(username: String!): User!
}
```

- The Guide schema uses a `Date` type for milliseconds since epoch. However, it would be more specific to call it a `DateTime`, since it includes both the date and the time. That would allow us to add `Date` (e.g. `1/1/2000`) and `Time` (e.g. `13:37`) types in the future. It would also be clearer for devs coming from a background of systems that handled both Dates and DateTimes.

Using specific naming is part of a broader category of being explicit—we want to know what fields and types mean, how to use them, and how they behave, without guessing or trial and error. Here are a few further areas in which we can be explicit:

- Using custom scalars instead of default scalars. Instead of `createdAt: Int`, `createdAt: DateTime`. Instead of `phone: String`, `phone: PhoneNumber`. It explicitly shows what type of value it is, and we can trust that the [custom scalar code](11.md#custom-scalars) will validate `DateTime`s and `PhoneNumber`s wherever they're used in the schema.
- Include default arguments:

```js
type Query {
  reviews(
    skip: Int = 0,
    limit: Int = 10,
    orderBy: ReviewOrderBy = createdAt_DESC
  ): [Review!]!
}

enum ReviewOrderBy {
  createdAt_ASC 
  createdAt_DESC
}
```

- Use non-null (`!`) to be explicit about what values will always be returned, or which arguments are required. However, in some cases it's better to not use it:
  - If clients use multiple root query fields in a single document, then leave them all nullable (because if one is non-null and null is returned, e.g. due to an error, it will [null cascade](#nullability) all the way up to a `{ "data": null }` response, preventing the client from receiving the other root query fields).
  - If there's any chance a field will be occasionally not be available, for instance a `User.githubRepositories` field whose resolver relies on the GitHub API being accessible, make it null. We do this so that when we can't reach the GitHub API (their servers are down, or there's a network issue, or we hit our API quota), queries for user data can receive the other fields.
- Build expected errors into the schema. Then devs will know what error responses look like and will be able to handle them more easily than if they were in the `"errors"` JSON response property.
  - In the below [Mutations](#mutations) section, we'll include expected errors in the response type.
  - Earlier in the [Union errors](#union-errors) section, we included deleted and suspended users in the search results:

```gql
type Query {
  searchUsers(term: String!): [UserResult!]!
}

union UserResult = User | DeletedUser | SuspendedUser
```

  - We can also prevent errors from happening with our schema structure. For instance, if there are some queries that are public and some that the client must be logged in for, we can avoid them receiving unauthorized errors by having the public queries as root fields and the logged-in queries as `Viewer` fields:

```gql
# 👎
type Query {
  me: User
  teams: [Team]

  # must be logged in
  projects: [Project]

  # must be logged in
  reports: [Report]
}

# 👍
type Query {
  me: Viewer
  teams: [Team]
}

type Viewer {
  id: ID
  name: String
  projects: [Project]
  reports: [Report]
}
```

Only when we can't make a meaning or behavior explicit should we add a description to the schema.

Lastly, a couple more things that are helpful for readability: 

- Consistency in naming. For instance how we name queries for a single item versus a list:

```gql
# 👎
type Query {
  project(id: ID): Project
  projects: [Project]

  getReport(id: ID): Report
  listReports: [Report]
}

# 👍
type Query {
  project(id: ID): Project
  projects: [Project]

  report(id: ID): Report
  reports: [Report]
}
```

Or the verbs we use with mutations:

```gql
# 👎
type Mutation {
  deleteProject(id: ID): DeleteProjectPayload
  removeReport(id: ID): RemoveReportPayload
}

# 👍
type Mutation {
  deleteProject(id: ID): DeleteProjectPayload
  deleteReport(id: ID): DeleteReportPayload
}
```

- Grouping fields into sub-objects: when a group of fields are related, we can create a new object type. Imagine our reviews had comments that rated the helpfulness of the review:

```gql
# 👎
type Review {
  id: ID!
  text: String!
  stars: Int
  commentCount: Int!
  averageCommentRating: Int
  averageCommentLength: Int
}

# 👍
type Review {
  id: ID!
  text: String!
  stars: Int
  commentStats: CommentStats!
}

type CommentStats {
  count: Int!
  averageRating: Int
  averageLength: Int
}
```

### Easy to use

While the majority of ease of use is determined by ease of understanding, there are other factors that can contribute:

- Include fields that save the client from having to go through computation, logic, or other processing. For instance, we provide Review.fullReview:

```js
const resolvers = {
  Review: {
    fullReview: async (review, _, { dataSources }) => {
      const author = await dataSources.users.findOneById(
        review.authorId,
        USER_TTL
      )
      return `${author.firstName} ${author.lastName} gave ${review.stars} stars, saying: "${review.text}"`
    },
  }
}
```

If the client wants the whole review text in a sentence like that, they could construct it themselves by querying for all the pieces of information and putting it together, but instead we do it for them, saving them the effort. Similarly, if our clients often want the total comment count, we can include that in the connection so they don't have to do the work of requesting all the comments and counting them:

```gql
type Review {
  id: ID!
  text: String!
  comments: CommentsConnection!
}

type CommentsConnection {
  nodes: [Comment]
  totalCount: Int!
}
```

Or if we have a purchasing app where orders have complex states and business logic around when they're ready to be submitted, we could include a `readyForSubmission` field so the client doesn't have to write the logic code:

```gql
type Order {
  id: ID!
  ...
  readyForSubmission: Boolean!
}
```

- Make fields easy to use. For instance when dealing with money, fractional amounts are often more difficult to work with than integers, so we can provide `Int` fields:

```gql
# 👎
type Charge {
  dollars: Float!
}

# 👍
type Charge {
  cents: Int!
}
```

- If we have a public API for third parties to integrate with, then we can make integration easier by supporting their preferred libraries. In the case of GraphQL, the only common library with schema requirements is Relay. The [list of requirements](https://relay.dev/docs/en/graphql-server-specification.html) includes the cursor connections we [discussed earlier](11.md#relay-cursor-connections), a particular structure to mutations, and a common `Node` interface for object types:

```gql
interface Node {
  id: ID!
}

type User implements Node {
  id: ID!
  firstName: String!
}

type Review implements Node {
  id: ID!
  text: String!
}
```

### Mutations

As with the rest of the schema, the first thing to think about for mutations is their names. While some choose to do `typeVerb` (like `reviewCreate`, `reviewUpdate`, and `reviewDelete`) so that GraphiQL's alphabetical schema docs will group mutations by type, we recommend the more readable `verbType`: `createReview`, `updateReview`, and `deleteReview`. And, as mentioned before, being consistent with the verbs—so `deleteUser`, matching `deleteReview`, instead of `removeUser`. 

However, we don't recommend uniformly implementing `create|update|delete` mutations for each type; instead, provide mutations according to the needs of the client—which actions will they be performing? In some cases, types are never deleted, or they're created automatically, or the update step should be named something else or should happen in stages. For instance imagine a store checkout process in which the server needs to do something (save data, validate, talk to an API, etc) for each of these steps:

- Create a cart
- Add products to the cart
- Apply a coupon code
- Add shipping address
- Add payment information
- Submit order

We could have the client use `createCart` for the first step and a single generic `updateCart` mutation for each of the rest. (First they'd call `updateCart(productId)`, and then `updateCart(couponCode)`, etc.) However, it would require a large amount of optional arguments, and we would have to write a long field description telling the dev which arguments to use in which order. Instead, we should write multiple mutations with specific names:

```gql
type Mutation {
  createCart: Cart!
  addProductsToCart(input: AddProductsToCartInput): Cart!
  applyCoupon(input: ApplyCouponInput): Cart!
  addShippingAddressToCart(input: AddShippingAddressToCartInput): Cart!
  addPaymentToCart(input: AddPaymentToCartInput): Cart!
  createOrder(cartId: ID!): Order!
}

input AddProductsToCartInput {
  cartId: ID!
  productIds: [ID!]!
}

input ApplyCouponInput {
  cartId: ID!
  code: String!
}

input AddShippingAddressToCartInput {
  cartId: ID!
  address: AddressInput!
}

input AddPaymentToCartInput {
  cartId: ID!
  payment: PaymentMethodInput!
}
```

- For most of the mutations, we end with `ToCart` to be specific. Just `addProducts` could be adding them to a wishlist, or `addPayment` could be adding a payment method to your account. And if there's any possible thing in our application that a coupon might be applied to that's not a cart, we should change `applyCoupon` to `applyCouponToCart`!
- We do `addProductsToCart` instead of the singular `addProductToCart` in case the client might want to add multiple products at a time (it's easier for them to send a single mutation with an array of IDs than a single-ID mutation many times).

#### Arguments

The most common pattern for mutation arguments is a single input object type. Some people choose to instead have a two-argument limit, when one argument is an ID, like this:

```gql
type Mutation {
  applyCoupon(cartId: ID!, coupon: String!): Cart!
  addShippingAddressToCart(cartId: ID!, address: AddressInput!): Cart!
}
```

A couple benefits of a single argument are:

- The mutation is more readable with a single argument input object type than a long list of scalars and input objects.
- The input object is more evolvable (we can't deprecate an argument, but we can deprecate an input object field).

Here are a few more considerations when it comes to mutation arguments:

- While earlier we recommended creating specific scalar types over using built-in generics, we may want to avoid that for mutation arguments: if we use our own scalar types, then the client may have to go through two requests to discover all the errors. If there are both errors in the scalar validation (for instance an invalid phone number) and in the business logic (for instance order size is too large), then the client's first request will only receive the validation error, and when they send a second request with a fixed phone number, they'll receive the business logic error. We can improve the client's experience by allowing them to receive all errors at once, which we do by using `String` instead of our own `PhoneNumber` scalar, and doing both the phone number validation and the business logic checks in our resolver code. Then our resolver can return all the errors together. We also have more flexibility on how we return the error—a scalar validation error shows up in the `"errors"` attribute of the JSON response, whereas in our resolver, we can either throw an error *or* return an error—an option we'll see in the next section.
- The client can generate and provide a unique `clientMutationId` for mutations they want to make sure are *idempotent*—that don't get executed multiple times. For instance, if the client sent the below mutation and lost network connection and resent, and the server received it twice, our server code could check to see if the `clientMutationId` on the second mutation matched the first, and if it did, we wouldn't process the second mutation.

```gql
mutation { 
  buyStock(input: { ticker: "TSLA", shares: 10, clientMutationId: "mvvAb9sDGnPYNtZm" }) { 
    id 
  } 
}
```

```gql
type Mutation {
  buyStock(input: BuyStockInput): Order
}

input BuyStockInput {
  ticker: String!
  shares: Int!
  clientMutationId: ID!
}
```

- While it's tempting to [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) our code by sharing input types between create and update mutations, we don't recommend it. We have to use at least one non-null field for the ID (since it's not used during creation), and if we want the update mutation to only provide the fields it wants to change, we have to make all fields non-null. And doing that removes the clarity around which fields are required when creating.

```gql
# 👎
mutation {
  createReview(input: ReviewInput!): Review!
  updateReview(input: ReviewInput!): Review!
}

input ReviewInput {
  # only provide when updating
  id: ID
  # required when creating
  text: String
  stars: Int
}

# 👍
mutation {
  createReview(input: CreateReviewInput!): Review!
  updateReview(input: UpdateReviewInput!): Review!
}

input CreateReviewInput {
  text: String!
  stars: Int
}

input UpdateReviewInput! {
  id: ID!
  text: String
  stars: Int
}
```

#### Payloads

So far our mutations have been returning the object they alter or throwing errors. For instance `createReview` might return a `Review` object or throw an `InputError` that's serialized in the response JSON's `"errors"` attribute. However, there are a couple issues with this:

- Returning a single type is inflexible—what if multiple types are altered during the mutation, or we want to provide the client with more information about how the mutation went?
- As we discussed in [Union errors](11.md#union-errors), it's better to return expected errors than to throw them: it's easier for client code to handle, and it documents the possible errors and their associated data (whereas thrown errors like the [`InputError` we created](#custom-errors) are undocumented / do not appear in the schema).

We solve both of these issues by returning a payload type:

```gql
type Mutation {
  createReview(input: CreateReviewInput): CreateReviewPayload
}

type CreateReviewPayload {
  review: Review
  user: User
  errors: [Error!]!
}

type Error {
  message: String!
  code: ErrorCode
  field: Field
}
```

When we create a review, our `User.reviews` changes. We can include the user in the payload so that the client can easily update their cached user object. We make both the `review` and `user` optional because we might instead return `errors`. The client's operation would look like:

```gql
mutation {
  createReview(input: { text: "", stars: 6 }) {
    review {
      id
      text
      stars
      createdAt
    }
    user {
      reviews {
        id
      }
    }
    errors {
      message
      code
      field
    }
  }
}
```

And the response would be:

```json
{
  "data": {
    "createReview": {
      "errors": [{
        "message": "Text cannot be empty",
        "code": 105,
        "field": "input.text"
      }, {
        "message": "Stars must be an integer between 0 and 5, inclusive",
        "code": 106,
        "field": "input.stars"
      }]
    }
  }
}
```

In cases when the mutation alters an unknown set of types, we can use the Query type to allow the client to get back whatever data they'd like after the mutation is complete:

```gql
type Mutation {
  performArbitraryOperation(operation: ArbitraryOperation): PerformArbitraryOperationPayload
}

type CreateReviewPayload {
  query: Query
  errors: [Error!]!
}
```

### Versioning

Most APIs change over time. We can deploy *backward-compatible* changes at any time. *Breaking* changes—changes that may break client code using that part of the API—we usually try to avoid making. However, sometimes we want to make a breaking change because it would be a significant improvement. If our API is only used by our clients, and all our clients are web apps, then we can publish a new version of the client at the same time as a breaking API change, and we can force all the currently-loaded webpages (now out of date) to reload, and nothing will be broken. However, if we don't want to force reload our web app, or if we have mobile apps (which we can't force reload), or if we have a public API (which is used by third parties, whose code we don't have control over), then we have two options:

- **Global versioning**. Publish a new version of the API at a different URL, like `api.graphql.guide/v2/`. Then clients using the original URL will continue to work.
- **Deprecation**: 
  - Add a deprecation notice so that, going forward, devs don't use the field.
  - Notify existing API consumers of the deprecation so they can change their code.
  - Monitor the usage of the field.
  - When the field usage falls under a tolerable threshold of (number of will-be-broken requests), remove it.

Here are a couple examples of deprecation:

```gql
type User {
  id: ID!
  name: String @deprecated(
    reason: "Replaced by field `fullName`"
  )
  fullName: String
}

type Mutation {
  createReview(text: String!, stars: Int): Review @deprecated(
    reason: "Replaced by field `createReviewV2`"
  )
  createReviewV2(input: CreateReviewInput): CreateReviewPayload  
}
```

While only the deprecation option includes making the breaking change as a step, it usually eventually happens for global versioning as well. There is always a cost of maintaining the old code—whether the code is backing an earlier global version or a deprecated field—and at some point that cost outweighs the cost of breaking old clients. For instance, we could have a globally-versioned API that's currently on version 5, and almost all of the clients are using v2–v5, and we decide that we'd rather break the few clients still using v1 than continue maintaining it.

We recommend using the deprecation process (also called **continuous evolution**) in lieu of versioning. The downside of deprecating is the schema getting cluttered with deprecated fields. The downside of versioning is the large cost of maintaining old server versions and the increased time it takes to make changes—given the complexity of deploying and maintaining a new version of the API, we batch changes and create new versions infrequently. Whereas we can deprecate at any time.

There are a few reasons why continuous evolution is the best practice compared to versioning, which was common with REST APIs:

- Adding is backward-compatible. With REST APIs that don't have control over what data is returned from an endpoint, any changes, even returning more data than the client expects, can be breaking. With GraphQL APIs, adding a new field doesn't affect current clients—they only receive the fields specified in their query document.
- Deprecation is built into the GraphQL spec, and GraphQL tooling will show developers when they're using a deprecated field, so clients will update their code more easily and sooner.
- Since all the fields requested are in the query document, we can know how many clients are using deprecated fields. If we added a `fullName` field to the user REST endpoint, we wouldn't know how many clients were still using the `name` field. With GraphQL, we know!

We can currently deprecate fields and enum values, and deprecating arguments and input fields will likely be added to the spec in the near future.

We deprecate a field instead of removing it, because removing a field is a breaking change. But there are other breaking changes to watch out for as well:

- Removing fields, enum values, union members, interfaces
- Changing the type of a field
- Making an argument or input field non-null
- Adding a new non-null argument or input field
- Making a non-null argument nullable
- Changing a field from non-null to nullable isn't automatically breaking, but if the server ever does return null for that field, the client can break

Finally, it's possible to break clients by adding new enum values, union members, and interface implementations if the client logic depends on all the data they receive fitting their (outdated) set of values/members/implementations. (Ideally clients would always leave open the possibility that those things could be added.)

## Custom schema directives

Background: [Directives](2.md#directives)

> If you’re jumping in here, `git checkout 25_0.1.0` (tag [25_0.1.0](https://github.com/GraphQLGuide/guide-api/tree/25_0.1.0), or compare [25...directives](https://github.com/GraphQLGuide/guide-api/compare/25_0.1.0...directives_0.1.0))

Apollo server includes the [default directives](2.md#directives) `@deprecated @skip @include`. `@skip` and `@include` are *query directives*, so they don't appear in our schema; instead, they're included in query documents and can be used on any field. `@deprecated` is a *schema directive*, and when we add it after a field or enum value in our schema, the directive will be included in responses to introspection queries. 

We can make our own schema directives in Apollo server. When we add them to specific places in our schema, those parts of the schema are modified or evaluated differently when resolving requests. Three examples we'll code are `@tshirt`, which modifies an enum value's description, `@upper`, which takes the result of a field resolver and returns the uppercase version instead, and `@auth`, which throws an error if the user isn't authorized to view that object or field.

- [@tshirt](#@tshirt)
- [@upper](#@upper)
- [@auth](#@auth)

### @tshirt

Schema directives are implemented by subclassing `SchemaDirectiveVisitor` and overriding one or more methods of the format `visitFoo()`, where Foo is part of the schema the directive is applied to. Possible parts of the schema are:

- Whole schema
- Scalar
- Object
- Field definition
- Argument definition
- Interface
- Union
- Enum
- Enum value
- Input object
- Input field definition

For example if it were applied to an enum value:

`src/schema/schema.graphql`

```gql
directive @tshirt on ENUM_VALUE

enum Package {
  BASIC
  PRO 
  FULL @tshirt
  TRAINING @tshirt

  # Group license.
  TEAM @tshirt
}
```

then our subclass would override `visitEnumValue()`:

`src/directives/TshirtDirective.js`

```js
import { SchemaDirectiveVisitor } from 'apollo-server'

class TshirtDirective extends SchemaDirectiveVisitor {
  visitEnumValue(value) {
    ...
    return value
  }
}
```

To determine the structure of `value`, we can either use `console.log()` or look up the type definition of an enum value in the `graphql-js` library. All type definitions are in [`src/type/definition.js`](https://github.com/graphql/graphql-js/blob/688f93c9153c1b69d522c130200373e75d0cfc7e/src/type/definition.js#L1419-L1427), where we can find:

```js
export type GraphQLEnumValue /* <T> */ = {|
  name: string,
  description: ?string,
  value: any /* T */,
  isDeprecated: boolean,
  deprecationReason: ?string,
  extensions: ?ReadOnlyObjMap<mixed>,
  astNode: ?EnumValueDefinitionNode,
|};
```

> `isDeprecated` and `deprecationReason` are the fields that are used by the `@deprecated` directive.

It has an optional `description` field, to which we can add a note about T-shirts 😄:

`src/directives/TshirtDirective.js`

```js
import { SchemaDirectiveVisitor } from 'apollo-server'

export default class TshirtDirective extends SchemaDirectiveVisitor {
  visitEnumValue(value) {
    value.description += ' Includes a T-shirt.'
    return value
  }
}
```

Then we need to get it to `ApolloServer()`:

`src/directives/index.js`

```js
import TshirtDirective from './TshirtDirective'

export default {
  tshirt: TshirtDirective
}
```

`src/index.js`

```js
import schemaDirectives from './directives'

const server = new ApolloServer({
  typeDefs,
  schemaDirectives,
  resolvers,
  dataSources,
  context,
  formatError
})
```

Now we can check the description by using the search box inside Playground's docs tab:

![Package enum with "Includes a T-shirt" descriptions](img/tshirt-directive.png)

### @upper

When we're making a directive for use on fields, oftentimes what we want to do is call the resolver and modify the result, like this:

```js
import { SchemaDirectiveVisitor } from 'apollo-server'
import { defaultFieldResolver } from 'graphql'

class MyDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const { resolve = defaultFieldResolver } = field
    field.resolve = async function(...args) {
      const result = await resolve.apply(null, args)
      // modify result
      // ...
      return result
    }
  }
}
```

Here we override the `visitFieldDefinition()` function, which receives a `field` object that [has a `resolve` property](https://github.com/graphql/graphql-js/blob/688f93c9153c1b69d522c130200373e75d0cfc7e/src/type/definition.js#L959-L974):

```js
export type GraphQLField<
  TSource,
  TContext,
  TArgs = { [argument: string]: any, ... },
> = {|
  name: string,
  description: ?string,
  type: GraphQLOutputType,
  args: Array<GraphQLArgument>,
  resolve?: GraphQLFieldResolver<TSource, TContext, TArgs>,
  subscribe?: GraphQLFieldResolver<TSource, TContext, TArgs>,
  isDeprecated: boolean,
  deprecationReason: ?string,
  extensions: ?ReadOnlyObjMap<mixed>,
  astNode: ?FieldDefinitionNode,
|};
```

We redefine `field.resolve`, calling the original resolve (or the `defaultFieldResolver`—which resolves the field as a property on the parent object, e.g. `User: { firstName: (user, _, context) => user.firstName }`—when there is no resolver function) and modifying and returning the result. 

Let's use this format to implement an `@upper` resolver which transforms the result to uppercase:

`src/schema/schema.graphql`

```gql
directive @upper on FIELD_DEFINITION

type Query {
  hello(date: Date): String! @upper
  isoString(date: Date!): String!
}
```

And now, since we can't convert emoji to uppercase, we need `Query.hello` to return lowercase ASCII:

`src/resolvers/index.js`

```js
const resolvers = {
  Query: {
    hello: () => 'world ',
    ...
  }
}
```

As above, we redefine the field's `resolve` function, calling the original. This time we check if the result is a string and call `.toUpperCase()`:

`src/directives/UppercaseDirective

```js
import { SchemaDirectiveVisitor } from 'apollo-server'
import { defaultFieldResolver } from 'graphql'

export default class UppercaseDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const { resolve = defaultFieldResolver } = field
    field.resolve = async function(...args) {
      const result = await resolve.apply(this, args)
      if (typeof result === 'string') {
        return result.toUpperCase()
      }
      return result
    }
  }
}
```

We include the directive class by adding it to this object, where the key corresponds with the directive name `@upper`:

`src/directives/index.js`

```js
import TshirtDirective from './TshirtDirective'
import UppercaseDirective from './UppercaseDirective'

export default {
  tshirt: TshirtDirective,
  upper: UppercaseDirective
}
```

![hello query with "WORLD 🌍🌏🌎" result](img/upper-directive.png)

### @auth

Directives can also take arguments, which can be scalars, enums, or input object types. `@deprecated`, for instance, takes a `reason` argument of type `String`:

```gql
type User {
  firstName
  first_name: String @deprecated(reason: "Use `firstName`.")
}
```

We'll be implementing a directive that takes an enum argument:

`src/schema/schema.graphql`

```gql
directive @auth(
  requires: Role = ADMIN,
) on OBJECT | FIELD_DEFINITION

enum Role {
  USER
  MODERATOR
  ADMIN
}
```

Our `@auth` directive is for specifying which objects or fields (`on OBJECT | FIELD_DEFINITION`) require a `Role`. If the `requires` argument isn't used, then the default `ADMIN` is used.

Our `AuthDirective` class is similar to `UppercaseDirective` in that we're wrapping the `field.resolve()` function in a new function. However, instead of modifying the result, our wrapping function throws an error if the current user's role doesn't match the required role:

`src/directives/AuthDirective.js`

```js
import { SchemaDirectiveVisitor, ForbiddenError } from 'apollo-server'
import { defaultFieldResolver } from 'graphql'

export default class AuthDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const { resolve = defaultFieldResolver } = field
    field.resolve = (...resolverArgs) => {
      const requiredRole = this.args.requires
      const context = resolverArgs[2]

      if (!context.user.roles.includes(requiredRole)) {
        throw new ForbiddenError(`You don't have permission to view this data.`)
      }

      return resolve.apply(null, resolverArgs)
    }
  }
}
```

The directive's arguments are available at `this.args.*`. `resolverArgs[2]`, the third argument passed to resolvers, is always the context, where we put the user doc. We assume that the user's roles are stored in the user doc as an array of strings (like `roles: ['USER']` or `roles: ['USER', 'ADMIN']`).

Since `@auth` works `on OBJECT | FIELD_DEFINITION`, we also need to implement the `visitObject()` method. It needs to go through each field in the object and wrap the `resolve()` function. We also need to mark whether a field has been wrapped, so that we don't double wrap (if we use `@auth` on both the object and field `foo` in the object, `visitObject()` will wrap all fields, and then `visitFieldDefinition()` will wrap `foo`, which has already been wrapped).

```js
import { SchemaDirectiveVisitor } from 'apollo-server'
import { defaultFieldResolver } from 'graphql'

export default class AuthDirective extends SchemaDirectiveVisitor {
  visitObject(objectType) {
    objectType._requiredRole = this.args.requires

    const fields = objectType.getFields()
    Object.keys(fields).forEach(fieldName => {
      const field = fields[fieldName]
      this._wrapResolveFn(field, objectType)
    })

    objectType._wrappedResolveFn = true
  }

  visitFieldDefinition(field, { objectType }) {
    field._requiredRole = this.args.requires

    const alreadyWrapped = objectType._wrappedResolveFn
    if (!alreadyWrapped) {
      this._wrapResolveFn(field, objectType)
    }
  }

  _wrapResolveFn(field, objectType) {
    const { resolve = defaultFieldResolver } = field

    field.resolve = (...args) => {
      const requiredRole = field._requiredRole || objectType._requiredRole
      const context = args[2]

      if (!context.user.roles.includes(requiredRole)) {
        throw new Error('not authorized')
      }

      return resolve.apply(null, args)
    }
  }
}
```

We save the required role on the field and the object so that inside the wrapper, we can determine which to use (preferencing a role saved on the field over one saved on the object):

```js
const requiredRole = field._requiredRole || objectType._requiredRole
```

We use underscores for data we save (`._requiredRole` and `._wrappedResolveFn`) and for the method we define (`._wrapResolveFn()`) to indicate that they're private (not meant to be used / called by code outside this class).

Note that `visitFieldDefinition()` receives a second argument with that field's object type. Here are [all the methods](https://github.com/apollographql/graphql-tools/blob/87f32f57f014715d6a311793e3929d39205e2578/src/schemaVisitor.ts#L91-L130) that have second arguments: 

- `visitFieldDefinition(field, { objectType })`
- `visitArgumentDefinition(argument, { field, objectType })`
- `visitEnumValue(value, { enumType })`
- `visitInputFieldDefinition(field, { objectType })`
- `visitSchema(schema, visitorSelector)` (see [explanation of `visitorSelector`](https://github.com/apollographql/graphql-tools/blob/87f32f57f014715d6a311793e3929d39205e2578/src/schemaVisitor.ts#L111-L130))

Finally, let's add our new directive class to our server:

`src/directives/index.js`

```js
import TshirtDirective from './TshirtDirective'
import UppercaseDirective from './UppercaseDirective'
import AuthDirective from './AuthDirective'

export default {
  tshirt: TshirtDirective,
  upper: UppercaseDirective,
  auth: AuthDirective
}
```

Now we can test out the directive:

`src/schema/User.graphql`

```gql
type User @auth(requires: USER) {
  id: ID!
  firstName: String!
  lastName: String!
  username: String!
  email: String @auth(requires: ADMIN)
  photo: String!
  createdAt: Date!
  updatedAt: Date!
}
```

Without a `roles` field on our user doc, we get an error and null data:

![user query with error response](img/auth-directive-without-roles.png)

With `"roles": ["USER"]`, we get data and an error:

![user query with firstName and error for email](img/auth-directive-user.png)

With `"roles": ["USER", "ADMIN"]`, we get all the data:

![user query with firstName and email in response](img/auth-directive-admin.png)

## Subscriptions in depth

### Server architecture

Back in the [Deployment options](#options) section, we decided to deploy to a PaaS because our app has subscriptions, which don't work on FaaS. However, we can split our code into two servers: one that handles subscriptions and WebSockets that runs on a PaaS long-running process, and one that handles queries and mutations over HTTP and runs on a FaaS. This way our two tasks, which have very different hosting requirements, can be maintained and scaled independently according to their needs.

Let's recall what our subscription code looks like. When the client sends this operation:

```gql
subscription {
  githubStars
}
```

Our `Subscription.githubStars.subscribe` function is called:

`src/resolvers/Github.js`

```js
import { pubsub } from '../util/pubsub'

export default {
  Subscription: {
    githubStars: {
      subscribe: () => pubsub.asyncIterator('githubStars')
    }
  }
}
```

The server now keeps the WebSocket open, and sends over the WebSocket anything that's published to the `githubStars` iterator (`pubsub.publish('githubStars', foo)`).

When our server starts up, we start polling:

`src/index.js`

```js
const start = () => {
  Github.startPolling()
  ...
}
```

`src/data-sources/Github.js`

```js
export default {
  async fetchStarCount() {
    const data = await githubAPI.request(GUIDE_STARS_QUERY).catch(console.log)
    return data && data.repository.stargazers.totalCount
  },

  startPolling() {
    let lastStarCount

    setInterval(async () => {
      const starCount = await this.fetchStarCount()
      const countChanged = starCount && starCount !== lastStarCount

      if (countChanged) {
        pubsub.publish('githubStars', { githubStars: starCount })
        lastStarCount = starCount
      }
    }, 1000)
  }
}
```

When the number of stars changes, the new count is published to the `githubStars` iterator, and the server sends it out to all the clients who have subscribed. 

All the above code can be separated into its own Node server. In fact, since we switched from the default in-memory pubsub to [Redis PubSub](#redis-pubsub), the code that publishes updates doesn't need to be in the same process that receives subscriptions and handles WebSockets! So if we wanted, we could have three servers:

- Subscription server with WebSockets: PaaS
- Query and mutation server: FaaS
- `githubStars` publishing server: FaaS with scheduled periodic executions

Usually most of an app's publishing comes from the mutation server: when a mutation changes data, it publishes the change with the new data. When we're publishing data from an external source, then we need a function triggered on a schedule to check for changes or we need the source to notify us when things change (a [webhook](bg.md#webhook)). When our data is changed from places outside our mutation server, we can publish to our subscriptions in three different ways:

- Have those other places (for instance, a legacy application that works with the same business data) publish the changes they make to Redis.
- Have a long-running server poll the database for changes. This can take a significant amount of memory, since the process needs to keep the current state of the data in order to see what has changed.
- Use a special database:
  - [RethinkDB](https://rethinkdb.com/) provides *change feeds* as a way to be notified when the results of a query change (though not all possible queries are supported).
  - MongoDB provides an *oplog*—a log of all database operations—that we can have a server listen to (*tail*). If data changes frequently, it can take a significant amount of CPU to process the oplog, determining which operations are changes that should be published for our subscriptions.

> In the [Meteor](https://www.meteor.com/) framework, you can use a mix of oplog tailing and polling when oplog tailing is too CPU-intensive.

### Subscription design

Our `githubStars` subscription is basic—just a single scalar value.

```gql
type Subscription {
  githubStars: Int
}
```

Usually subscriptions are for getting updates to an object or list of objects. For instance our `createReview` subscription updates clients on objects being added to the list of reviews.

```gql
type Subscription {
  reviewCreated: Review!
}
```

If we wanted to get all types of updates, we have three options:

1) Adding `reviewUpdated` and `reviewDeleted`:

```gql
type Subscription {
  reviewCreated: Review!
  reviewUpdated: Review!
  reviewDeleted: ID!
}
```

2) A single `reviews` subscription:

```gql
type Subscription {
  reviews: ReviewsPayload
}

union ReviewsPayload = 
  CreateReviewPayload | 
  UpdateReviewPayload | 
  DeleteReviewPayload

type CreateReviewPayload {
  review: Review!
}

type UpdateReviewPayload {
  review: Review!
}

type DeleteReviewPayload {
  reviewId: ID!
}
```

Here we could share the same payloads as the `createReview`, `updateReview`, and `deleteReview` mutations.

3) Calling `reviewCreated` and a `review(id)` subscription for each review loaded on the page:

```gql
type Subscription {
  reviewCreated: Review!
  review(id: ID!): ReviewPayload!
}

union ReviewsPayload = 
  UpdateReviewPayload | 
  DeleteReviewPayload
```

1 and 2 are similar in that the client gets updates to the entire list of reviews. In 2, they have to make fewer subscriptions. In 1, they have more flexibility if for some reason they only wanted to subscribe to `reviewCreated` and not the others. In 3, the client makes many more subscriptions, but doesn't have to deal with receiving events about reviews they don't care about. In 1 and 2, unless the user has scrolled enough to load the entire list on the page, they're getting events about review objects that aren't on the page or in the cache, and ignoring them. Given that it takes resources to receive WebSocket messages and check to see if the review is in the cache, we may want to go with 3. In our use case though, editing and deleting reviews happens infrequently, and even if adding reviews happens frequently, those events are usually all relevant, since the default sort order is most recent. So we might go with the simplicity of 2.

If we a review detail page that just showed a single review, we would use the `review(id)` subscription. If the page also had a list of comments, then we might do:

```gql
type Subscription {
  reviewCreated: Review!
  review(id: ID!): ReviewPayload!
  commentsForReview(reviewId: ID!): CommentsPayload!
}

union ReviewsPayload = 
  UpdateReviewPayload | 
  DeleteReviewPayload |

union CommentsPayload = 
  CommentCreatedPayload |
  CommentUpdatedPayload |
  CommentDeletedPayload
```

> Of course, if we had (or thought we might in future have) a different kind of comment elsewhere in our app, we would change all the instances of `Comment*` to `ReviewComment*`.

And if the client were on page `/review/123`, we would subscribe to `review(id: "123")` and `commentsForReview(id: "123")`. As before with the list of reviews, if there might be a lot of comments and comment edit/delete activity, and only some of the comments were shown on the page, we might instead subscribe to updates to each individual comment: `comment(id: "<comment id>")`.

The design of our subscriptions depends on which client views we want realtime updates for, the size of the data set, and the frequency of updates. We take into consideration how much work it takes for the client to make the subscriptions, how much work it takes them to filter out unwanted messages, and also avoiding overfetching data on the messages we do want. For instance we return just the ID of a deleted object instead of the whole object. And if we had a granular `changeReviewStars` mutation, we could union and resolve to a `ChangeReviewStarsPayload` type. The client could then only select the `stars` field instead of the whole review:

```gql
fragment ChangeReviewStars on ChangeReviewStarsPayload {
  review {
    id
    stars
  }
}

fragment CreateReview on CreateReviewPayload {
  review {
    id
    text
    stars
    createdAt
  }
}

fragment DeleteReview on DeleteReviewPayload {
  reviewId
}

subscribe {
  reviews {
    ...ChangeReviewStars
    ...CreateReview
    ...DeleteReview
  }
}
```

## Security

Background: [HTTP](bg.md#http), [Server](bg.md#server), [Databases](bg.md#databases), [Authentication](bg.md#authentication)

* [Auth options](11.md#auth-options)
  * [Authentication](11.md#authentication)
  * [Authorization](11.md#authorization)
* [Denial of service](11.md#denial-of-service)

In this section we'll start out with an overview of general server-side security and then get to a few topics specific to  GraphQL. 

Computer security is protecting against:

- Unauthorized actions
- Theft or damage of data
- Disruption of service

Here are a few levels of vulnerability relevant to securing servers from the above, along with some methods of risk management:

- **People** that have access to our systems **and their devices**: people like employees at our company, hosting companies, and service companies like Auth0 that we use or have some of our data.
  - Train employees on security, including avoiding the most common malware avenues: visiting websites and opening files.
  - Avoid personal use of work devices.
  - Install [antivirus](https://thewirecutter.com/blog/best-antivirus/) on work computers.
  - [Vet](https://checkr.com/) employee candidates.
  - Access production systems and data from a limited number of devices that are not used for email or web browsing.
- **Physical access** to those systems.
  - Make sure device hard drives are encrypted with complex login passwords, or locked away when not in use.
  - Assess risk level of our service companies (for example [AWS perimeter security](https://aws.amazon.com/compliance/data-center/perimeter-layer)).
- **Network**: users being able to access our server over the internet or view data in transit.
  - Keep our server IP addresses private.
  - Use a DNS provider that hides our server IPs and handles DDoS attacks (like [Cloudflare](https://www.cloudflare.com/) or AWS's [Sheild Standard, CloudFront, & Route 53](https://aws.amazon.com/answers/networking/aws-ddos-attack-mitigation/)).
  - Force HTTPS: When a client makes a connection to our server on port 80 (unencrypted), redirect them to port 443, which will ensure all further data sent between us and the client is encrypted.
- **Operating system**: hackers exploiting a vulnerability in our server OS (usually Linux).
  - Apply security patches or use a PaaS or FaaS, where OS security is taken care of for us.
- **Server platform**: Node.js.
  - Apply security updates to Node.js, or use a PaaS or FaaS, where security updates are done automatically.
- **Application layer**: GraphQL execution and our code. The following sections cover this area of security.

After we implement protections, we can hire a firm to do a [security audit](https://en.wikipedia.org/wiki/Information_security_audit) and use [HackerOne](https://www.hackerone.com/) to find areas we didn't sufficiently cover. 

Any system can be hacked—it's just a matter of how much resources are put into hacking. The two largest sources relevant to companies are eCrime (criminal hacking—often financial or identity theft) and the Chinese government (stealing trade secrets from foreign companies). Most large companies have been hacked at some point to some degree.

After we have been hacked, it's important to be able to:

1. Figure out how it happened
2. Ensure the attackers no longer have access
3. Know what data was accessed
4. Recover deleted data

For #1 and #3, we can set up access logs for our production servers, databases, and sensitive services, and for #4 we can set up automatic database backups (MongoDB Atlas has options for either snapshots or continuous backups). #2 depends on #1—if one of our service accounts was compromised, we can change the password. If one of our API user's account was stolen (session token or JWT or password), then we need to delete their session or re-deploy with code that blocks their JWT (and if we're using password authentication, delete their current password hash and send a password reset email).

One important way to mitigate the damage of our database being accessed is hiding sensitive database fields—either by only storing hashes, in the case of passwords, or by storing fields encrypted (using an encryption key that's not stored in the database). Then an attacker won't know the user's password (which they'd likely be able to use to login to the user's accounts on other sites), and the won't know the sensitive data unless they also gain access to the encryption key.

Here are a few application-layer security risks that apply to API servers in general—not just GraphQL servers:

- Parameter manipulation: When clients alter operation arguments. We protect against this by checking arguments to ensure they're valid, and by not trusting them (for instance, we should use the `userId` from the context instead of from an argument).
- Outdated libraries: Our code depends on a lot of libraries, any of which may have security vulnerabilities that affect our app. For Node.js, we can use `npm audit` to check for vulnerabilities in our libraries.
- Database injection like [SQL injection](https://en.wikipedia.org/wiki/SQL_injection) and [MongoDB injection](https://blog.websecurify.com/2014/08/hacking-nodejs-and-mongodb.html)
- [XSS](https://developer.mozilla.org/en-US/docs/Glossary/Cross-site_scripting): On the client, preventing XSS involves sanitizing user-provided data before being added to the DOM, but on the server, we use a [Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy) header.
- [Clickjacking](https://en.wikipedia.org/wiki/Clickjacking): Use [X-Frame-Options headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/
- Race conditions, especially [TOCTOU](https://en.wikipedia.org/wiki/Time-of-check_to_time-of-use): Imagine multiple of our servers are running the same mutation from the same user at the same time. We may need to use database transactions or other logic to prevent this type of attack.
- Number processing: Bugs that involve working with numbers, including conversion, rounding, and overflows.

### Auth options

*Auth* is an imprecise term—sometimes it's used to mean authentication, sometimes authorization, and sometimes both. In this case, we mean both:

- [Authentication](11.md#authentication)
- [Authorization](11.md#authorization)

#### Authentication

Background: [Authentication](bg.md#authentication)

The server receives a JWT or session ID in an HTTP header, which it uses to decode or look up the user. If we're putting our GraphQL server in front of existing REST APIs, then we may want to just pass the header along to the REST APIs—they can continue doing the authentication (and authorization), returning null or returning errors that we can format as GraphQL errors. 

However, usually we'll handle user decoding in the GraphQL server. In the case of federation, we decoded the user [in the gateway](11.md#federated-gateway) and passed the object in a `user` header to the services. In the case of our monolith, we decoded [in the `context` function](11.md#authenticating) and provided `context.user` to the resolvers.

But how does the client get the JWT or session ID in the first place? In our case, we used an external service—we [opened a popup]((6.md#authentication)) to an Auth0 site that did both signup and login and provided the client with a JWT. Other options include:

- hosting our own identity server (for example the free, open-source [Ory server](https://www.ory.sh/kratos/)) 
- adding HTTP endpoints to our GraphQL server (for example with the [Passport library](http://www.passportjs.org/))
- add mutations to our GraphQL server (for example the [accounts-js](https://github.com/accounts-js/accounts) library adds `Mutation.register`, `Mutation.authenticate`, etc. to our schema)
- use our hosting provider's identity service (for example [Netlify Identity](https://docs.netlify.com/functions/functions-and-identity/#access-identity-info-via-clientcontext) if our server is hosted with [Netlify Functions](https://www.apollographql.com/docs/apollo-server/deployment/netlify/), or [Amazon Cognito](https://aws.amazon.com/cognito/) with AWS Lambda)

Hosting our own separate identity server might be the most common solution.

#### Authorization

After we authenticate the client, we either have their decoded token object (in the case of JWTs) or their user object (in the case of sessions). Both the token and the user object should have the user's permissions. Permissions can be stored in different ways—usually a list of roles or scopes, or at its most simple an `admin` boolean field.

Once we have the user's permission info, our server has to determine which data to allow the user to query and which mutations to allow the user to call. There are a number of different places where we can make this determination:

- **REST services**: In the case of putting a GraphQL gateway in front of existing REST services that already do authorization checks, we can continue to let them do the checks.
- **Context**: If we only want logged-in users to be able to use our API, we can throw an `AuthenticationError` in our `context()` function whenever the HTTP header is missing or the decoding/session lookup fails.
- **Model**: We can do the checks in our data-fetching code. This is the best option when we have both a GraphQL and REST API, both of which call the model code. (This way, we don't have to duplicate authorization checks.)
- **Directives**: We can add directives to fields or types in our schema—for instance, `@isAuthenticated` or `@hasRoles(roles: [ADMIN])`. A library we can use that defines these directives for us is [graphql-auth-directives](https://github.com/grand-stack/graphql-auth-directives).
- **Resolvers**: In the server we built in this chapter, we did all of our authorization checks in our resolver functions. The biggest downside to this is repetition as the schema gets larger—for instance we'd probably wind up with a lot of `if (!user) { throw new ForbiddenError('must be logged in') }`. It's also harder to get a broader sense of which parts of the schema have which authorization rules. With directives we easily scan through the schema, and with middleware, we can look at the below `sheild({ ... })` configuration and see everything together.
- **Middleware**: We can use [graphql middleware](https://github.com/prisma-labs/graphql-middleware)—functions that are called before our resolvers are called. In particular, we can configure the [GraphQL Shield](https://github.com/maticzav/graphql-shield) middleware library to run authorization functions before our resolvers like this:

```js
const isAuthenticated = rule({ cache: 'contextual' })(
  async (parent, args, context, info) => {
    return context.user !== null
  }
)

const isAdmin = rule({ cache: 'contextual' })(
  async (_, __, context) => {
    return context.user.roles.includes('admin')
  }
)

const isMe = rule({ cache: 'strict' })(
  async (parent, _, context) => {
    return parent._id.equals(context.user._id)
  }
)

const permissions = shield({
  Query: {
    me: isAuthenticated,
    secrets: isAdmin
  },
  Mutation: {
    createReview: isAuthenticated
  },
  User: {
    email: chain(isAuthenticated, isMe)
  },
  Secret: isAdmin
})
```

The equivalent **directives** schema would be:

```gql
type Query {
  user(id: ID!): User
  me: User @isAuthenticated  
}

type Mutation {
  createReview(review: CreateReviewInput!): Review @isAuthenticated
}

type Secret @hasRole(roles: [ADMIN]) {
  key: String
}
```

And for `User.email`, we could either do a resolver check or create a new directive.

In each of the last three authorization locations—**directives, resolvers, and middleware**—we have to be careful about adding rules just to our root query fields. Since our data graph is interconnected, oftentimes there will be other ways to reach a sensitive type, through a connection from another field. So it's usually necessary to add rules to types, as we do with the `Secret` type above. Unfortunately, we can't do that in resolvers—just directives and middleware.

### Denial of service

Denial of service is a type of attack in which the attacker overloads our servers' capacity to process requests, resulting in legitimate users being unable to use our app. While some attacks are below the application layer (like on TCP or HTTP), those are usually taken care of by our DNS and/or hosting provider (at least in the case of PaaS and FaaS). In this section we'll look at application layer attacks, which can be separated into two buckets: expensive requests and a large number of requests. We want to guard against both. 

First, guarding against expensive requests—requests that take up significant resources while the server processes them:

- [Safelisting](https://www.apollographql.com/docs/graph-manager/operation-registry/): If our API is private—only for use by our own client code—then we can safelist our queries. We'll send Apollo Graph Manager our client queries during a build step in the client repo(s), and then our server will check all incoming requests against the registered queries in Graph Manager and reject any unrecognized queries. If our API is public, we can't safelist, because we want 3rd party devs to able to construct whatever queries they need.
- Validate arguments: Attackers can alter arguments to take up resources. For instance if we have a `username` argument in our `signup` mutation, we don't check the length, and then we save it to the database, then an attacker could provide a long string that took up a gigabyte of hard drive space, and soon our database would be full.
- Add a timeout: If a request isn't done after N milliseconds, terminate it.
- Limit depth: One way to make a query expensive is to make it really deep—continuing to select connection fields (like `query { posts { comments { users { posts { comments { ...etc }}}}}}`). We can use the [`graphql-depth-limit`](https://github.com/stems/graphql-depth-limit) library for this.
- Limit complexity: This is a more advanced technique than just limiting depth, and involves assigning a complexity cost value to each field and limiting the total cost of a query. We can implement this using [`graphql-validation-complexity`](https://github.com/4Catalyzer/graphql-validation-complexity), or if we want more flexibility, [`graphql-cost-analysis`](https://github.com/pa-bru/graphql-cost-analysis) (with which we can multiply costs by arguments or parent multipliers).

We can guard against a large number of requests by rate limiting. GitHub uses a combination of [rate limiting and cost analysis](https://developer.github.com/v4/guides/resource-limitations/#rate-limit) for its public API—we can't make queries with a total cost of more than 5,000 points per hour. There's not yet an open-source library that does this. (If you write one, let us know so that we can link to it!) The [`graphql-rate-limit-directive`](https://github.com/ravangen/graphql-rate-limit) library provides a directive that allows us to limit the number of times a particular field or object is selected within a certain time window.

In addition to blocking requests that are too complex or too frequent, we can reduce the amount of resources each request takes. For instance, instead of doing all the work needed during the request, in some cases we can send a response and then queue a job to be executed by a different server, clearing more room for our API server to handle more requests. Another example is caching—we can reduce the load on our database by using a cache, which we'll get to in the next section, [Performance > Caching](#caching).
