# Setting up the server

As we discussed in [Chapter 11: Server dev > Deployment](../server/#deployment), we can have a node process running our code on the server, or we can do serverless. The simplest is [serverless with Vercel](https://vercel.com/docs/serverless-functions/introduction). Vercel hosts serverless functions and static sites, and its command-line tool does deployment and is a development server. We install it with:

```sh
npm i -g vercel
```

And we get our starter code with:

```sh
git clone https://github.com/GraphQLGuide/guide.git
cd guide/
git checkout ssr_1.0.0
npm install
```

Let’s create a `server/` directory to run `vercel` in:

```sh
mkdir server
cd server/
mkdir api
```

Within `server/`, Vercel recognizes serverless functions in the `api/` directory:

[`server/api/server.js`](https://github.com/GraphQLGuide/guide/blob/ssr2_1.0.0/server/api/server.js)

```js
export default (req, res) => res.status(200).send(`👋🌎🌍🌏`)
```

`req`, short for *request*, is an instance of Node’s [http.IncomingMessage](https://nodejs.org/api/http.html#http_class_http_incomingmessage), and `res` or *response* is a [http.ServerResponse](https://nodejs.org/api/http.html#http_class_http_serverresponse). In this function, we’re setting the HTTP status code to 200 and sending an emoji response.

We can run our function with `vercel dev` inside `server/`. The first time we run `vercel` in a directory, it will ask us about the project (and save the configuration to `.vercel/`)

```sh
$ cd server/
$ vercel dev
Vercel CLI 21.2.1 dev (beta) — https://vercel.com/feedback
? Set up and develop “~/gh/guide/server”? [Y/n] y
? Which scope should contain your project? GraphQL Guide
? Link to existing project? [y/N] n
? What’s your project’s name? guide-ssr
? In which directory is your code located? ./
No framework detected. Default Project Settings:
- Build Command: `npm run vercel-build` or `npm run build`
- Output Directory: `public` if it exists, or `.`
- Development Command: None
? Want to override the settings? [y/N] n
🔗  Linked to graphql-guide/guide-ssr (created .vercel and added it to .gitignore)
> Ready! Available at http://localhost:3000
```

We run our function by visiting its path within `server/`, in this case [localhost:3000/api/server](http://localhost:3000/api/server):

![White webpage with hello world emoji at the top left](../img/ssr-hello-world.png)

We want to server-render all the URLs our [SPA](../background/spa.md) uses, like `https://graphql.guide`, `https://graphql.guide/me`, and `https://graphql.guide/0-Background/1-JavaScript`. We can change Vercel’s default routing in `vercel.json`:

[`server/vercel.json`](https://github.com/GraphQLGuide/guide/blob/ssr2_1.0.0/server/vercel.json)

```json
{
  "rewrites": [{ "source": "/(.*)?", "destination": "/api/server" }]
}
```

This resolves any path to our single serverless function. (The `source` format uses [`path-to-regexp`](https://github.com/pillarjs/path-to-regexp/#parameters).) Now when we visit [localhost:3000](http://localhost:3000) or [localhost:3000/0-Background/1-JavaScript](http://localhost:3000/0-Background/1-JavaScript), we see the hello world emoji instead of the 404 page.

Let’s update our function to return an HTML document instead of just an emoji string:

[`server/api/server.js`](https://github.com/GraphQLGuide/guide/blob/ssr2_1.0.0/server/api/server.js)

```js
export default (req, res) => {
  res.status(200).send(`
    <!doctype html>
    <html lang="en">
    
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
      <title>The GraphQL Guide</title>
    </head>
    
    <body>
      Server-side rendered: ${req.headers['user-agent']}
    </body>
    
    </html>
  `)
}
```

Browsers send a [`User-Agent`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent) header with each HTTP request that identifies the browser family, name, and version. Here we’re including that header in the body of our HTML page.

![Webpage with the text “Server-side rendered: [user agent]”](../img/ssr-user-agent.png)

