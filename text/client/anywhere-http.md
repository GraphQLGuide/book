---
title: "Anywhere: HTTP"
---

# Anywhere: HTTP

Background: [HTTP](../background/http.md), [JSON](../background/json.md)

Whether we’re writing JavaScript for a website, Swift for an iPhone, C for a
microcontroller, etc., we can make a connection to a server and send an
[HTTP request](../background/http.md). At its base, a GraphQL request is just an HTTP POST
request.

## cURL

When we’re on the command line, we can use
[cURL](https://en.wikipedia.org/wiki/CURL) (“See URL”, a tool for making network
requests, including HTTP requests):

```sh
$ curl -X POST \
-H "Content-Type: application/json" \
-d '{"query": "{ githubStars }"}' \
https://api.graphql.guide/graphql
```

* `-X` specifies which HTTP method to use—in this case POST
* `\` continues the command on the next line
* `-H` sets an HTTP header—in this case the
  [`Content-Type`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type)
  header (where we specify the
  [MIME type](https://en.wikipedia.org/wiki/Media_type) of the request body) to
  `application/json`
* `-d` sets the body of the request—in this case to our [JSON](../background/json.md) query: `{"query":
  "{ githubStars }"}`

`curl` prints the response to the command line:

```json
{"data":{"githubStars":1337}}
```

When talking about GraphQL, we usually skip over:

* the `{"query": "X"}` part of the request body
* the `{"data":Y}` part of the JSON response

Instead we just talk about:

* `X`, the GraphQL [document](../query-language/document.md): `{ githubStars }`
* `Y`, the value of the `"data"` attribute: `{"githubStars":1337}`

## JavaScript

In a browser, we can use
[`fetch()`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)
to make HTTP requests:

```js
const makeGraphqlRequest = async ({ endpoint, document }) => {
  const options = {
    method: 'POST',
    headers: new Headers({
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify({
      query: document
    })
  }

  const response = await fetch(endpoint, options)
  return response.json()
}

const logStars = async () => {
  const response = await makeGraphqlRequest({
    endpoint: 'https://api.graphql.guide/graphql',
    document: '{ githubStars }'
  })

  console.log(response)
}
```

<a class="jsbin-embed" href="http://jsbin.com/hukazic/embed?js,console">Run in browser</a>

Just as we did with cURL, we make an HTTP POST request to our endpoint url with
a Content-Type header and a JSON body. Running `logStars()` prints this to the console:

```json
{
  data: {
    githubStars: 1337
  }
}
```

We can do the same thing in other languages by using their HTTP request
functions with equivalent parameters.

For our in-browser JavaScript example, instead of logging the data, we can
display it on the page:

```js
const displayStars = async () => {
  const response = await makeGraphqlRequest({
    endpoint: 'https://api.graphql.guide/graphql', 
    document: '{ githubStars }'
  })
  const starCount = response.data.githubStars
  const el = document.getElementById('github-stars')
  el.innerText = `The Guide has ${starCount} stars on GitHub!`
}

displayStars()
```

[Run in browser](https://codesandbox.io/s/m322q18958?module=%2Fsrc%2Findex.js)

This method of displaying data (finding a DOM node with `document.getElementById` or `document.querySelector` and setting its `innerText`) is straightforward and great for simple tasks. However, most web apps we build are complex enough that they benefit greatly
from a user interface library like React—in the [next chapter](../react/index.md), we’ll learn
the best way to put GraphQL data into our React components.

