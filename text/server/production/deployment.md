---
title: Deployment
description: How to deploy our GraphQL server
---

## Deployment

* [Options](#options)
* [Deploying](#deploying)
* [Environment variables](#environment-variables)

### Options

For our GraphQL API to be accessible, we need our code to run on a server that is *publicly addressable*—i.e., it can be reached via a public IP address. Our dev computer usually can’t be reached because it has a local (non-public) IP address (often starting with `192.168.*.*`), and the router that connects us to the internet (which does have a public IP) usually doesn’t respond to HTTP requests. While we could set the router up to forward requests to our dev computer, we then would have to leave our computer there and powered on, as well as do a number of other things to keep it working (like [DDNS](https://en.wikipedia.org/wiki/Dynamic_DNS)). Given the trouble and unreliability of that solution, we usually run our server code on a different computer—a production server—that’s been built, set up, and maintained for that purpose.

The *deployment* process is copying the latest version of our code to the production server and running it. There are four main types of production servers we can use:

- **On-prem**: In *on premises*, we buy our own server, plug it into a power outlet, connect it to the internet, and then maintain it ourselves.
- **IaaS**: In *infrastructure as a service*, a company (like Amazon with its EC2 service) houses and maintains the physical servers, and we choose the operating system. We connect to the operating system over SSH to get a command prompt and then install Node, copy our code to the machine, and run it.
- **PaaS**: *Platform as a service* is like IaaS, except in addition to maintaining the physical servers, the company also maintains the operating system and software server. For example, a Node PaaS company would install and update Node.js, and we would send them our code, and they would run it with their version of Node.
- **FaaS**: *Function as a service* (also known as *serverless*) is like PaaS, except instead of sending them Node server code (which runs continuously and responds to any path / route), we send them individual JavaScript functions and configure which route triggers which function. Then, when we get HTTP requests, their server runs the right function. The function returns the response, which their server forwards to the client. Once the function returns, our code stops running—with FaaS, we don’t have a continuously running server process.

These options appear in:

- decreasing order of complexity to use. It’s most difficult to run our own server, and it’s easiest to write and upload a single function.
- increasing time order:
  - 1970s: On-prem was the original type of server since the beginning of the internet.
  - 2006: Amazon Web Services (AWS) came out with EC2, the most popular IaaS.
  - 2009: Heroku, which popularized PaaS, publicly launched.
  - 2014: AWS came out with Lambda, the most popular FaaS.

Currently, PaaS seems to be the most popular option in modern web development. However, FaaS is rising and may eclipse PaaS. Notably, the most popular PaaS in the Node community ([Vercel Now](https://vercel.com/home), formerly Zeit Now), switched to FaaS. While FaaS might be better for many applications, there are some disadvantages:

- **No continuous server process**: When we have a process (as we do with on-prem, IaaS, and PaaS), we can do things like:
  - Store data in memory between requests. The alternative that usually suffices is using an independent memory store, like a Redis server, which adds a small network latency (only ~0.2ms if it’s inside the same AWS Availability Zone).
  - Open and maintain a WebSocket connection. However, some FaaS providers have added the ability to use WebSockets: At the end of 2018, AWS added support for WebSockets to its API Gateway, which can call a Lambda function when each message arrives over the socket.
- **Database limitations**: Since there’s no continuous server process, our database client library can’t maintain a pool of connections for our requests to go out on; instead, each function makes its own connection. So the database has to be able to accept many connections over SSL.
- **Latency**: When there’s not an existing server process, the FaaS provider has to start a new process (with a copy of our code and npm packages) to handle an incoming request, and that takes time, which increases the latency (i.e., total response time of the server). For example, Lambda usually takes under 500ms to create a new instance to handle a request (also called a *cold start*). Once the function returns, the instance continues running and immediately handles the next request that arrives. If there are no requests for about ten seconds, it shuts down, and the next request is subject to the 500ms instance startup latency. Also, if there’s an existing instance handling a request and a second request arrives while the existing instance is busy, a second instance is cold-started.
- **Resource limits**: FaaS providers usually limit how much memory and CPU can be used and how long the function can run. One of the more flexible providers is Lambda. By default, it limits memory and duration to 128 MB and 3 seconds. The limits can be raised to a maximum 3,008 MB and 15 minutes, which costs more. CPU speed scales linearly with memory size.

An example of an application that isn’t well-suited to FaaS is a [Meteor](https://www.meteor.com) app, which: 

- Keeps a WebSocket open to every client.
- Stores in memory a cache of each client’s data.
- Can use a lot of CPU to determine what data updates to send to each client.

Apollo Server [doesn’t yet support](https://github.com/apollographql/apollo-server/issues/2129) GraphQL subscriptions on Lambda. [`aws-lambda-graphql`](https://github.com/michalkvasnicak/aws-lambda-graphql) is a different GraphQL server that does support subscriptions on Lambda. Aside from subscriptions, FaaS is 
a great fit for GraphQL because:

- GraphQL only has a single route, so we only need one function.
- The only thing stored in memory between requests is the data source cache, and that’s easy to swap out with a Redis cache.

Since our app uses subscriptions, let’s use Heroku, a PaaS that supports Node. 

It’s worth noting that another option would be to split our application layer between two servers: 

- One that handles Queries and Mutations over HTTP, hosted on a FaaS.
- One that handles Subscriptions over WebSockets, hosted on a PaaS.

The former could publish subscription events to Redis, which the latter could subscribe to.

### Deploying

> If you’re jumping in here, `git checkout 25_0.2.0` (tag [25_0.2.0](https://github.com/GraphQLGuide/guide-api/tree/25_0.2.0), or compare [25...26](https://github.com/GraphQLGuide/guide-api/compare/25_0.2.0...26_0.2.0))

In this section we’ll deploy our server to the Heroku PaaS, see how it breaks, and then fix it 🤓. 

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
2. `heroku login`—Log in using the account we just created.
3. `heroku create`—Create a new Heroku app. This registers our server with Heroku and reserves a name (which is used in the deployed URL: `https://app-name.herokuapp.com/`). It also adds a Git remote named `heroku`.
4. `git push heroku 25:master`—Git push to the master branch of the Heroku remote. When Heroku receives the updated code, it builds and runs the server. This command assumes we currently have branch 25 checked out on our machine. If we were on `master`, we could just run `git push heroku master`.
5. `heroku open`—Open the deployed URL in the browser.

On the page that’s opened (`https://app-name.herokuapp.com/`), we see “Application error,” which we can investigate by viewing the logs:

```sh
$ heroku logs
```

This prints a lot of logs, including:

```
2019-10-30T12:50:33.923678+00:00 heroku[web.1]: Error R10 (Boot timeout) -> Web process failed to bind to $PORT within 60 seconds of launch
2019-10-30T12:50:33.951435+00:00 heroku[web.1]: Stopping process with SIGKILL
```

When Heroku runs our code, it provides a `PORT` environment variable and waits for our code to start a server on that port. If our code doesn’t do so within a minute, Heroku kills the process. We’re running our server on port 4000, so it killed us. 💀😞

To resolve this problem, let’s update our code to use `PORT`:

[`src/index.js`](https://github.com/GraphQLGuide/guide-api/compare/25_0.2.0...26_0.2.0)

```js
server
  .listen({ port: process.env.PORT || 4000 })
  .then(({ url }) => console.log(`GraphQL server running at ${url}`))
```

We fall back to `4000` in development, where there is no `PORT` environment variable. Now to test, we can run `heroku logs --tail` in one terminal (`--tail` keeps the command running, displaying log lines in real time) and deploy in another. Since the deployment process for Heroku is `git push`, we have to create a new commit, so that the updated code is part of the push.

```sh
$ git add src/index.js
$ git commit -m 'Listen on process.env.PORT in production'
$ git push heroku 25:master
```

After the last command, we should start seeing log lines like this (plus timestamps) in the first terminal:

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

Heroku didn’t kill us! 🎉💃 

> We can kill the logs process by hitting `Ctrl-C`.

The label `[web.1]` identifies which *dyno* (Heroku’s term for a container) the log comes from. By default, our app only has one dyno, but we could scale up to multiple if we wanted. The lines labeled `heroku` are the dyno’s general state changes:

```
heroku[web.1]: State changed from crashed to starting
heroku[web.1]: Starting process with command `npm start`
heroku[web.1]: State changed from starting to up
```

The lines labeled `app` are more granular and include all the output from our server process. The last two lines are errors that we’ll fix in the next two sections:

```
app[web.1]: (node:23) UnhandledPromiseRejectionWarning: MongoNetworkError: failed to connect to server [localhost:27017] on first connect [Error: connect ECONNREFUSED 127.0.0.1:27017

app[web.1]: Error: GraphQL Error (Code: 401): {"response":{"message":"Bad credentials","documentation_url":"https://developer.github.com/v4","status":401},"request":{"query":"\nquery GuideStars {\n  repository(owner: \"GraphQLGuide\", name: \"guide\") {\n    stargazers {\n      totalCount\n    }\n  }\n}\n"}}
```

### Environment variables

> If you’re jumping in here, `git checkout 26_0.2.0` (tag [26_0.2.0](https://github.com/GraphQLGuide/guide-api/tree/26_0.2.0)).

There are a couple outstanding errors with our deployment. Let’s look at this one:

```
app[web.1]: Error: GraphQL Error (Code: 401): {"response":{"message":"Bad credentials","documentation_url":"https://developer.github.com/v4","status":401},"request":{"query":"\nquery GuideStars {\n  repository(owner: \"GraphQLGuide\", name: \"guide\") {\n    stargazers {\n      totalCount\n    }\n  }\n}\n"}}
```

It’s an error response from our `GuideStars` query which our server is sending to GitHub’s API. The error message is `Bad credentials`. Credentials are provided in the authorization header:

[`src/data-sources/Github.js`](https://github.com/GraphQLGuide/guide-api/blob/26_0.2.0/src/data-sources/Github.js)

```js
const githubAPI = new GraphQLClient('https://api.github.com/graphql', {
  headers: {
    authorization: `bearer ${process.env.GITHUB_TOKEN}`
  }
})
```

The problem is the `GITHUB_TOKEN` *environment variable* (env var) isn’t defined, because our `.env` file isn’t in Git, which means Heroku didn’t get a copy of the file when we did `git push`. To set environment variables, PaaS and FaaS providers have a web UI and/or command-line tool. Heroku has both—let’s fix our problem with its command-line tool:

```
$ heroku config:set GITHUB_TOKEN=...
Setting GITHUB_TOKEN and restarting ⬢ graphql-guide... done, v5
GITHUB_TOKEN: ...
```

> Replace `...` with the value from our `.env` file.

Then, Heroku restarts the server to provide the new environment variable. We can now see with `heroku logs` that the `Bad credentials` error doesn’t appear after the restart. 

We need to also set our other environment variable from `.env`:

```
$ heroku config:set SECRET_KEY=...
```

