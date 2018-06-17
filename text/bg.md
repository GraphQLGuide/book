# Chapter: Background

Chapter contents:

* [JavaScript](bg.md#javascript)
* [JSON](bg.md#json)
* [Git](bg.md#git)
* [Node & npm & nvm](bg.md#node-&-npm-&-nvm)
* [SPA](bg.md#spa)
* [SSR](bg.md#ssr)
* [HTTP](bg.md#http)
* [Latency](bg.md#latency)
* [Webhooks](bg.md#webhooks)  
* [Authentication](bg.md#authentication)
  * [Tokens vs. sessions](bg.md#tokens-vs-sessions)
  * [localStorage vs. cookies](bg.md#localstorage-vs-cookies)

---

This chapter provides concise introductions to various background topics. You’re welcome to either read them all up front or individually as you go along—at the beginning of a section, you’ll find a list of topics it assumes knowledge of, like the [Anywhere: HTTP](5.md#anywhere-http) section, which has two listed:

Background: [HTTP](bg.md#http), [JSON](bg.md#json)

Some topics, like Git and Node, are necessary for following along with the coding. Others, like Tokens vs. sessions, are nice to know, but not necessary.

# JavaScript

Most of the code in the book is in modern JavaScript. If you’re new to JS, you can learn through interactive [courses](https://www.codecademy.com/learn/introduction-to-javascript), video ([intro](https://www.leveluptutorials.com/tutorials/javascript-tutorials?ref=guide) and [intermediate](https://javascript30.com/?ref=guide)), or [a combination](https://www.khanacademy.org/computing/computer-programming/programming).

If you know traditional JS, but some of the new syntax is unfamiliar (for instance [async/await]((https://codeburst.io/javascript-es-2017-learn-async-await-by-example-48acc58bad65)), here’s a [course on ES6](https://es6.io/?ref=guide).

# JSON

JSON is a file format for data objects. The objects are structured in attribute–value pairs, where the attribute is a string and the value can be one of the following types:

- Number: `1.14`
- String: `"foo"`
- Boolean: `true`
- null: `null` 😄
- Array of other types: `["foo", true, 1.14]`
- Object: `{ "name": "john" }`

In JSON documents, whitespace doesn’t matter, and commas go between attribute–value pairs and between items in arrays. Here’s an example, formatted with nice whitespace:

```json
{
  "authors": [
    {
      "name": "john",
      "wearsGlasses": true
    },
    {
      "name": "loren",
      "wearsGlasses": true
    }
  ]
}
```

> It’s also valid JSON to have an array at the top level of the document, e.g.:
> 
> `[{ "name": "john" }, { "name": "loren" }]`

In Javascript, if we have this document in a string, we can parse it to create a Javascript object with the same data:

```js
const jsObject = JSON.parse(jsonString)
```

When working with raw [HTTP](#http) responses that contain a JSON body, we have to use `JSON.parse()` to get the data into an object. But we’ll mostly be working with libraries that take care of this step for us.


# Git

[Git](https://en.wikipedia.org/wiki/Git) is a version control system for saving your code and keeping a history of the changes. Unfamiliar? Try this [interactive tutorial](https://try.github.io/)

# Node & npm & nvm

[Node](https://nodejs.org/en/) is what runs JavaScript on a server. [npm](https://www.npmjs.com/) is a JavaScript package manager and registry. Their `npm` command-line tool manages the packages (libraries of JavaScript code) that our app depends on, helping us install and upgrade them. Their registry stores the content of the packages and makes them available for download—it has more packages than any other registry in the history of software! We use npm packages both with code that runs on the server in Node and with code that runs on the client, in the browser or in React Native. 

We recommend installing Node with [`nvm`](https://github.com/creationix/nvm) (the *Node Version Manager*):

```sh
$ curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash
$ nvm install node
$ nvm alias default node
```

This installs the latest version of Node. Then in a new terminal window, we can see the version number with:

```sh
$ node -v
```

`npm` is a command-line tool that is installed along with Node. When we want to use npm packages in our project, we create a `package.json` file in the project’s root directory:

```json
{
  "name": "my-project",
  "private": true
}
```

Then we install the package with:

```sh
$ npm install graphql
```

If we’re using a recent version of npm (5.0 or higher), the package name and version will now be saved in our `package.json`:

```json
{
  "name": "my-project",
  "private": true,
  "dependencies": {
    "graphql": "^0.13.1"
  }
}
```

We see the current package’s version, which was `0.13.1` at time of writing. npm packages follow **SemVer**, a convention for version numbering:

`[major version].[minor version].[patch version]`

Major version changes mean that the library’s API has been changed in an incompatible way—if we write our code to use version `1.0.0` of a library (for example, using the library’s function `doThis()`), our code will probably break if we switch to version `2.0.0` (for example, if the library renamed `doThis` to `doThat`, and our code were still called `doThis()`, we’d get an error). Minor and patch version changes do not break the API—if we write our code using version `1.0.0` of a library, we can safely upgrade to version `1.0.8` or `1.4.0`.

Minor version changes mean that functionality has been added—if we write our code using version `1.4.0`, it may break if we switch to version `1.3.0`, because it may use a feature introduced in minor version 4. Patch version changes mean that bugs have been fixed—if we switch from `1.0.8` to `1.0.7`, our code may stop working because of the bug that was fixed in patch version 8.

The one exception to the above is that version numbers with a major version of 0 don’t have a stable API, so going from `0.0.1` to `0.0.2` could be breaking—as could going from `0.1.0` to `0.2.0`.

A caret `^` before a version number means that our code depends on any version compatible with that number—for example, if we had a dependency `"foo": "^1.4.0"`, our code should work with any versions between `1.4.0` and `2.0.0`, such as `1.4.1` or `1.11.2`.

We can also see that we have a new `node_modules/` folder, and inside it is folders with the package code:

```sh
$  ls node_modules/
graphql  iterall
```

`iterall` was downloaded as well because it is a dependency of `graphql`, which we can see if we look at its `package.json`:

```sh
$ cat node_modules/graphql/package.json
{
  …
  "dependencies": {
    "iterall": "^1.2.0"
  },
  "homepage": "https://github.com/graphql/graphql-js",
  "name": "graphql",
  "version": "0.13.1"
}
```

We don’t want to save downloaded packages in git, so we exclude it:

```sh
$ echo 'node_modules/' >> .gitignore 
```


If we’re not in an existing git repository, we run `git init` to initialize. Then we can save our files with `git add <filename>` and a commit:

```sh
$ git add package.json .gitignore
$ git commit -m 'Added the graphql package'
```

When our code is cloned (by others, or by us in the future), there will be no `node_modules/`. If our code is at `https://github.com/me/app`, then we would do:

```sh
$ git clone https://github.com/me/app.git
$ cd app
$ ls -a
.  ..  .git  .gitignore  package.json
```

We run `npm install` to download all the packages listed in `package.json` into `node_modules/`:

```sh
$ npm install
added 2 packages in 1.026s
$ ls node_modules/
graphql  iterall
```

And then we could use the package in our JavaScript like this:

```js
import { graphql } from 'graphql'

…

graphql(schema, query).then(result => {
  console.log(result);
})
```

# HTTP

HTTP is a format for sending messages over the Internet. It is used on top of two other message formats—IP (which has an *IP address* and routes the message to the right machine) and TCP (which has a port number and resends any messages that are lost in transit). An HTTP message adds a *method* (like `GET` or `POST`), a path (like `/graphql`), headers (like the `Bearer` header we use for [authentication](#authentication)), and a body (where GraphQL queries and responses go).

# SPA

An [SPA](https://en.wikipedia.org/wiki/Single-page_application) (single-page application) is a website that keeps the same page loaded for the duration of the user’s session. Instead of a traditional website, in which every link or button that is clicked causes an [HTTP request](#http) to be sent to the server and a new HTML page to be loaded, there is a single HTML page, and JavaScript changes the page to show different views. React, Angular, and Vue are all JS libraries for making SPAs (often called *view libraries*).

# SSR

SSR (server-side rendering) is when, instead of sending a small HTML file and a JS bundle that we ask the client to parse and render into HTML, our server sends fully rendered HTML (that it created by running the JS view code on the server). When that rendered HTML is able to be cached, the client browser can display the page faster than a normal SPA (a normal SPA displays a blank or skeleton HTML page, and then JavaScript constructs the view and puts it on the page). We also have code from our view library that, once the browser loads the static HTML, attaches our app’s events handlers (like `onClick`, `onSubmit`, etc.) to the page (through a process called *hydration*).

# Latency

Latency is the delay between when one machine sends a message over the Internet and when the other machine receives it. It’s usually talked about in terms of round-trip time: the time it takes for the message to get to the destination and for a reply to reach the source. The `ping` command-line tool displays round-trip time between our computer and another machine. Here we see that it takes around 5 milliseconds total for a message to reach the nearest Google server and for the reply to arrive back:

```sh
$ ping google.com
PING google.com (172.217.10.142): 56 data bytes
64 bytes from 172.217.10.142: icmp_seq=0 ttl=56 time=3.919 ms
64 bytes from 172.217.10.142: icmp_seq=1 ttl=56 time=5.375 ms
64 bytes from 172.217.10.142: icmp_seq=2 ttl=56 time=4.930 ms
64 bytes from 172.217.10.142: icmp_seq=3 ttl=56 time=5.206 ms
64 bytes from 172.217.10.142: icmp_seq=4 ttl=56 time=5.132 ms
^C
--- google.com ping statistics ---
5 packets transmitted, 5 packets received, 0.0% packet loss
round-trip min/avg/max/stddev = 3.919/4.912/5.375/0.517 ms
```

It generally takes longer to reach servers that are physically farther away. The internet backbone is made of fiber optic cables, and the light messages travelling through them has a maximum speed. It takes 75 ms for a message to go from New York across the Atlantic Ocean to Paris and back. And the same to cross the U.S. to San Francisco and back. 164 ms from New York to Tokyo, and 252 ms from New York to Shanghai.

> These numbers will change once [Elon](https://en.wikipedia.org/wiki/Elon_Musk) builds [Starlink](https://en.wikipedia.org/wiki/Starlink_(satellite_constellation)), a network of near-Earth satellites 🤩. The satellites will be so close that the latency from the ground is 7 ms, and the satellites will communicate with each other via light. Light travels faster in straight lines through space than in cables curved over the Earth’s surface, so latency to far-off locations will be reduced!

Why do developers need to know about latency? Because we never want to keep our users waiting! If our web server is in New York, our database is in Shanghai, and our user is in San Francisco, and the request requires 3 database requests in series, and our server code takes 20ms, then the user won’t receive a response for (75 + 252 * 3 + 20) = 851 ms! (And this is assuming the [TCP](#http) connection is already set up, which would require another round trip from the user to the server, not to mention the longer SSL handshake if it’s HTTPS.) Almost one second is a long time for our user, whose human brain [notices delays](https://developers.google.com/web/fundamentals/performance/rail)
as short as 100ms. This is why we try to locate our database server in the same datacenter as our web server (for example both in Amazon’s [`us-east-1`](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html)). It’s why we use a CDN to get our files on servers around the world, closer to our users. It’s also why we try to reduce the number of sequential requests we need to make between the client and the server, and why it’s so important that we can put all of our queries in a single GraphQL request.

# Webhooks

Webhooks are a system for how one server can notify another server when something happens: some sites, including GitHub, allow us to provide them with a URL, for instance `https://api.graphql.guide/github-hook`, to which they make an [HTTP](#http) request when a certain event occurs. If we tell GitHub we want to know about the [`watch` event](https://developer.github.com/v3/activity/events/types/#watchevent) on the Guide repo, then they will send a POST to our server (using the given URL) whenever the repo is starred. The POST will contain a JSON body with information about the event, for example:

```json
{
  "action": "started",
  "repository": {
    "name": "guide",
    "full_name": "GraphQLGuide/guide",
    "watchers_count": 9,
    …
  },
  "sender": {
    "login": "lorensr",
    "type": "User",
    "html_url": "https://github.com/lorensr",
    …
  }
}
```

Then our server parses the JSON to figure out what happened. In this case, the `sender` is the user who performed the action, and we see under the `repository` attribute that the repo now has 9 watchers.

# Authentication

## Tokens vs. sessions

There are two main ways in which a server can verify that a client is a certain user: signed tokens and sessions. 

A **signed token** is piece of data that is *cryptographically signed*—which means we can mathematically verify who wrote the data. When the data is a user ID, for example `123`, and the signer is someone we trust (either our server, or a trusted third-party server when we’re using an authentication service like Auth0), then we can verify the signature and know that the client is user `123`. The most common type of signed token is a JWT, or [JSON Web Token](https://jwt.io/).

A **session** is a period of time during which a certain client is considered logged in as a particular user. The server stores data about the session, for instance:

```js
{
  sessionId: 'abc',
  userId: 123,
  expiresAt: 1595627896095
}
```

And gives the client a secret: in this case, the `sessionId`. Whenever the client contacts the server, the client includes the secret so that the server can look up the session data. For instance, if the client sends `'abc'`, the server can look up the above record, and if the session hasn’t expired, the server knows the client is user `123`.

Both methods can contain additional information about the user—information commonly included in order to prevent the server from having to take the time to look up the user record from the database. For example, we could include authorization info like `isAdmin` or profile info like `name` and `email`.

There are some pros and cons to each method:

- **State**: Sessions are stateful—the server has to record the session data somewhere (in Redis, or in memory with sticky sessions), and that introduces complexity (and increased [latency](#latency) in the case of Redis). Signed tokens are stateless—all the information that the server needs is contained in the token.
- **Invalidation**: When a session secret is compromised, we can invalidate that session by deleting it from the data store. When a token is compromised, we can’t invalidate it—it’s already been signed and will continue to be valid until the expiration. We’d have to add a list of invalid tokens—either in code and re-deploy, or in a data store—and add logic to check them.

The differences are small enough that for most applications, we recommend using whichever method is easier to build.

## localStorage vs. cookies

We can store session secrets and signed tokens in either localStorage or cookies, which have different pros and cons:

- **Size**: Cookies can’t be larger than 4KB, and in some cases we might want to store more data than that in our token, in which case we’d need to use localStorage.
- **Flexibility**: Data you put in localStorage can be managed by client-side JavaScript and sent to any domain, whereas cookies can only be set by the server and can only be shared among subdomains.
- **XSS**: Cookies are set by the server and can be configured to not be accessible from client-side JS, so they can’t be accessed by [XSS attacks](https://en.wikipedia.org/wiki/Cross-site_scripting). Data stored in localStorage is vulnerable to XSS because it can be read by any JS running on your page (from any source allowed by your [CSP](https://en.wikipedia.org/wiki/Content_Security_Policy)).
- **CSRF**: Cookies are vulnerable to [CSRF attacks](https://en.wikipedia.org/wiki/Cross-site_request_forgery), whereas localStorage is not.

While the XSS issue is a serious concern, a common mitigation is setting short expirations, and for applications without strict security requirements, we again recommend using whichever method is easier to set up.
