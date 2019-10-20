# Chapter: Background

Chapter contents:

* [JavaScript](bg.md#javascript)
* [JavaScript classes](bg.md#javascript-classes)
* [JSON](bg.md#json)
* [Git](bg.md#git)
* [Node & npm & nvm](bg.md#node-&-npm-&-nvm)
* [HTTP](bg.md#http)
* [Server](bg.md#server)
* [MongoDB](bg.md#mongodb)
* [SPA](bg.md#spa)
* [SSR](bg.md#ssr)
* [React](bg.md#react)
* [Latency](bg.md#latency)
* [Webhooks](bg.md#webhooks)  
* [Testing](bg.md#testing)  
* [Continuous integration](bg.md#continuous-integration)
* [Authentication](bg.md#authentication)
  * [Tokens vs. sessions](bg.md#tokens-vs-sessions)
  * [localStorage vs. cookies](bg.md#localstorage-vs-cookies)
* [Browser performance](bg.md#browser-performance)

---

This chapter provides concise introductions to various background topics. You’re welcome to either read them all up front or individually as you go along—at the beginning of a section, you’ll find a list of topics it assumes knowledge of, like the [Anywhere: HTTP](5.md#anywhere-http) section, which has two listed:

Background: [HTTP](bg.md#http), [JSON](bg.md#json)

Some topics, like [Git](#git) and [Node](#node), are necessary for following along with the coding. Others, like [Tokens vs. sessions](#tokens-vs-sessions), are nice to know, but not necessary.

# JavaScript

Most of the code in the book is in modern JavaScript. If you’re new to JS, you can learn through interactive [courses](https://www.codecademy.com/learn/introduction-to-javascript), video ([intro](https://www.leveluptutorials.com/tutorials/javascript-tutorials?ref=guide) and [intermediate](https://javascript30.com/?ref=guide)), or [a combination](https://www.khanacademy.org/computing/computer-programming/programming).

If you know traditional JS, but some of the new syntax is unfamiliar (for instance [async/await]((https://codeburst.io/javascript-es-2017-learn-async-await-by-example-48acc58bad65)), here’s a [course on ES6](https://es6.io/?ref=guide).

# JavaScript classes

A **class** is a template for an object. With this class:

```js
class Animal {
  constructor(name) {
    this.name = name
  }

  speak() {
    console.log(`${this.name} makes a noise.`)
  }
}
```

We can make an object, or **instance** of the class:

```js
const loren = new Animal('Loren')
```

`loren` is now an instance of `Animal`. When JavaScript evaluated `new Animal('Loren')`, it created a new object and called the `constructor` method with the string `'Loren'`, which set the object’s property `name` to `'Loren'` and (implicitly) returned the new object. Now when we do:

```js
console.log(loren.name)
loren.speak()
```

We see the output:

```
Loren
Loren makes a noise.
```

The class `Animal` is a template that we can create multiple different instances of:

```js
const loren = new Animal('Loren')
const graphy = new Animal('Graphy')

loren.speak()
graphy.speak()
```

Results in:

```
Loren makes a noise.
Graphy makes a noise.
```

Both of the instances have the `.speak()` method, but they have different values for the `.name` property, so `.speak()` logs different strings.

We can also create **subclasses** by using the syntax `class SubClass extends SuperClass`:

```js
class Animal {
  constructor(name) {
    this.name = name
    console.log(`${this.name} is a ${this.constructor.name}.`)
  }

  speak() {
    console.log(`${this.name} makes a noise.`)
  }
}

class Dog extends Animal {
  constructor(name) {
    super(name)
    console.log('Subspecies: Canis lupus familiaris.')
  }
}
```

`Dog` is a subclass of `Animal`. `this.constructor.name` is the name of the class (`'Dog'` if `new Dog()` or `'Animal'` if `new Animal()`). In its constructor, it calls the superclass’s constructor (`super(name)`) and then logs. So now if we do:

```js
const graphy = new Dog()
console.log(graphy.name)
graphy.speak()
```

We see:

```
Graphy is a Dog.
Subspecies: Canis lupus familiaris.
Graphy
Graphy makes a noise.
```

A subclass can override a superclass’s method or define new methods:

```js
class Dog extends Animal {
  constructor(name) {
    super(name)
  }

  speak() {
    console.log(`${this.name} barks.`)
  }
}

const loren = new Animal('Loren')
loren.speak()

const graphy = new Dog('Graphy')
graphy.speak()
graphy.sit()
```

```
Loren is a Animal.
Loren makes a noise.
Graphy is a Dog.
Subspecies: Canis lupus familiaris.
Graphy barks.
Graphy sits.
```

If we tried to do `loren.sit()`, we would get an error because `Animal` doesn’t have a `.sit()` method:

```
loren.sit()
      ^

TypeError: loren.sit is not a function
```

We can have multiple subclasses, for instance `Rabbit` and `Cat`, and subclasses can have subclasses, for instance `class Lynx extends Cat`.

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

[Node](https://nodejs.org/en/) is what runs JavaScript on a server. [npm](https://www.npmjs.com/) is a JavaScript package manager and registry. Their `npm` command-line tool manages the packages (libraries of JavaScript code) that our app depends on, helping us install and upgrade them. Their registry stores the content of the packages and makes them available for download—it has more packages than any other registry in the history of software! We use npm packages both with code that runs on the server in Node and with code that runs on the client—in the browser or in React Native. 

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

We can keep track of which projects uses which versions of node by adding a `.nvmrc` file to the root of each project. It contains a version number (like `8` or `8.11.3`) or `node` to use the latest stable version. Then when we switch projects, we run `nvm use` to switch to that project’s version of node:

```sh
$ nvm use
Found '/guide/.nvmrc' with version <8>
Now using node v8.11.3 (npm v5.6.0)
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

When we enter a URL like `http://graphql.guide/` into our browser, it goes through these steps:

1. Browser asks DNS server what the IP address of `graphql.guide` is.
2. DNS server responds with `104.27.191.39`.

We can see for ourselves what the DNS server says using the `nslookup` command:

```sh
$ nslookup graphql.guide
Server:         8.8.4.4
Address:        8.8.4.4#53

Non-authoritative answer:
Name:   graphql.guide
Address: 104.27.191.39
```

3. Browser sends out a message to the Internet that looks like this:

```
IP to 104.27.191.39
TCP to port 80
HTTP GET /
```

4. Internet routers look at the IP part, see it is addressed to `104.27.191.39`, and pass it off to a router that is closer to `104.27.191.39`.

5. The message arrives at `104.27.191.39` (the IP address of the Guide server), which opens the message, sees that it’s trying to connect to port 80, and passes the message to whatever server program (in this case a Node.js process) is listening at the port. 

> An *IP address* is the number ID of a computer on the Internet, and we can think of a *port* as the number of a program running on that computer.

6. The server process sees that the client wants to GET /, the root path, and sends back an `index.html` to the client.

> This sequence is a little simplified—it actually takes a separate round-trip message to set up the TCP connection, and for `graphql.guide`, the client is actually redirected to HTTPS at the beginning, which uses port 443 and sets up an SSL connection before sending HTTP GET /.

# Server

The term *server* may refer to:

1. a computer connected to a network (usually the Internet)
2. a process running on that computer that listens to one or more ports
3. the group of computers/processes that share the responsibility of handling requests

In web development, servers are usually either static file servers (which serve files like our images or JS bundle), application (app) servers (the ones that power our API and that the client talks to) or database servers. *Server-side* either means app servers or everything that’s not the client-side (including file, app, and database servers, as well as any other servers they talk to).

# MongoDB

MongoDB is a database. Databases are organized collections of data stored on a computer. Different database systems organize the data differently, store it differently, and communicate differently. While MongoDB can be used as an in-memory database (meaning the data is stored in RAM, and would be lost in the event of a power outage), it’s usually used as a persistent database that stores data on disk (a hard drive or SSD). The data is organized in collections of JSON-like documents. Developers communicate with the database using [MongoDB **schema statements**](https://docs.mongodb.com/manual/crud/):

```js
import { MongoClient } from 'mongodb'

const DATABASE_SERVER_URL = 'mongodb://my-database-server-domain.com:27017/guide'

const client = new MongoClient(DATABASE_SERVER_URL)
await client.connect()
const db = client.db()

// get the collection with the name 'users'
const users = db.collection('users')

// insert a new user document into the users collection
await users.insertOne({
  firstName: 'Loren',
  email: 'loren@graphql.guide'
})

// update the document where `firstName` is Loren by
// setting the `lastName` field (a new field)
await users.updateOne(
  { firstName: 'Loren' },
  {
    $set: { lastName: 'Sands-Ramshaw' }
  }
)

// fetch the document where `firstName` is Loren
const loren = await users.findOne({ firstName: 'Loren' })
console.log(loren)

users.deleteOne({ _id: loren._id })
```

> In practice, `await`s would need to be inside `async` functions and we should handle errors—either with a try-catch or .catch (`await users.findOne().catch(e => console.log(e)))`).

This would log something like:

```
{
  _id: ObjectId('5d24f846d2f8635086e55ed3'),
  firstName: 'Loren',
  lastName: 'Sands-Ramshaw',
  email: 'loren@graphql.guide'
}
```

When a new document is inserted into a collection, if no ID is provided (in the field named `_id`), then a unique [ObjectId](https://docs.mongodb.com/manual/reference/mongodb-extended-json/#ObjectId) is generated. We usually interact with ObjectIds as strings, but they also encode the creation time, which we can get with `loren._id.getTimestamp()`.

The above code uses the [`mongodb` module](https://mongodb.github.io/node-mongodb-native/) and schema statements for querying. Querying can be simplified in some ways with the [`mongoose` module](https://mongoosejs.com), the main JavaScript *ORM* for MongoDB. We’ll use Mongoose in [Chapter 1](1.md) and `mongodb` in [Chapter 11: Server Dev](11.md).

> An *ORM*, or object-relational mapping, is a library that models database records as objects. In the case of Mongoose, it models MongoDB documents as JavaScript objects. It also does validation, type casting, query building, and business logic hooks. 

# SPA

An [SPA](https://en.wikipedia.org/wiki/Single-page_application) (single-page application) is a website that keeps the same page loaded for the duration of the user’s session. Instead of a traditional website, in which every link or button that is clicked causes an [HTTP request](#http) to be sent to the server and a new HTML page to be loaded, there is a single HTML page, and JavaScript changes the page to show different views. React, Angular, and Vue are all JS libraries for making SPAs (often called *view libraries*).

# SSR

SSR (server-side rendering) is when, instead of sending a small HTML file and a JS bundle that we ask the client to parse and render into HTML, our server sends fully rendered HTML (that it created by running the JS view code on the server). When that rendered HTML is able to be cached, the client browser can display the page faster than a normal SPA (a normal SPA displays a blank or skeleton HTML page, and then JavaScript constructs the view and puts it on the page). We also have code from our view library that, once the browser loads the static HTML, attaches our app’s events handlers (like `onClick`, `onSubmit`, etc.) to the page (through a process called *hydration*).

# React

React was released by Facebook in 2013, and it has since steadily increased in popularity, surpassing Angular in GitHub stars in 2016 to become the most popular Javascript view library. (And while Vue passed React in star count in 2018, React has 5x the number of npm downloads.) React continues to be developed by a team at Facebook, who have merged in contributions from over one thousand developers.

As a view library, it is responsible for what the user sees on the screen. So its job is putting DOM nodes on the page and updating them. Different view libraries accomplish this in different ways and provide different APIs for us—the developers—to use. The primary features of React are:

- **JSX**: JSX (JavaScript XML) is an extension to JavaScript that allows us to write HTML-like code, with JavaScript expressions inside curly brackets `{}`.
- **Components**: Components are functions or classes that receive arguments (called *props*) and return JSX to be rendered. They can also be used as HTML tags inside JSX: `<div><MyComponent /></div>`.
- **Declarative**: Components automatically get re-run whenever their props or state changes, and the new JSX they return automatically updates the page. This process is called declarative because we declare what our props and state are as well as what the JSX should look like based on those props and state. This is in contrast to an *imperative* view library like jQuery, in which we would make changes to the page ourselves (for example adding an `<li>` to a `<ul>` with `$('ul').append('<li>New list item</li>')`).
- **Virtual DOM**: React creates a model of the page, and when we return different JSX from our components, React compares the new JSX to the previous JSX, and uses the difference to make the smallest possible changes to the DOM. This process improves the rendering speed.

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

> These numbers will change once [Elon](https://en.wikipedia.org/wiki/Elon_Musk) builds [Starlink](https://en.wikipedia.org/wiki/Starlink_(satellite_constellation)), a network of near-Earth satellites 🤩. The satellites will be so near that the latency to them from the ground is 7 ms, and then the satellites will communicate with each other by light. Light travels faster in straight lines through space than in cables curved over the Earth’s surface, so latency to far-off locations will be reduced!

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

# Testing

- [Mocking](#mocking)
- [Types of tests](#types-of-tests)

## Mocking

First let’s go over *mocking*. Let’s say we have a file with math functions:

`math.js`

```js
export const add = (a, b) => a + b
export const multiply = (a, b) => a * b
```

And our app, which uses the math functions:

`app.js`

```js
import { add, multiply } from './math'

export const addThenMultiply = (a, b, c) => multiply(add(a, b), c)
```

A test for our app might look like this:

`app.test.js`

```js
import { addThenMultiply } from './app'

test('returns the correct result', () => {
  const result = addThenMultiply(2, 2, 5)
  expect(result).toEqual(20)
})
```

The test calls `addThenMultiply()`, which then calls `add()` and `multiply()`.

But what if we only want to test the logic inside `addThenMultiply()` and *not* the logic inside `add()` and `multiply()`? Then we need to *mock* `add()` and `multiply()`—replace them with mock functions that either don’t do anything, or just return a set number. We replace them with mock functions that don’t do anything with `jest.mock()`:

```js
import { addThenMultiply } from './app'
import * as math from './math'

jest.mock('./math.js')

test('calls add and multiply', () => {
  addThenMultiply(2, 2, 5)
  expect(math.add).toHaveBeenCalled()
  expect(math.multiply).toHaveBeenCalled()
})
```

`add()` and `multiply()` don’t return anything—they just track whether they’ve been called. So that’s what we test. If we want to also test whether they’re called in the right way, we can control what they return():

```js
import { addThenMultiply } from './app'
import * as math from './math'

jest.mock('./math.js', () => ({
  add: jest.fn(() => 4),
  multiply: jest.fn(() => 20)
}))

test('calls with the right parameters and returns the result of multiply', () => {
  const result = addThenMultiply(2, 2, 5)
  expect(math.add).toHaveBeenCalledWith(2, 2)
  expect(math.multiply).toHaveBeenCalledWith(4, 5)
  expect(result).toEqual(20)
})
```

One danger of mocking too much is that we generally don’t want to test the implementation of something—just the output. In this case, `addThenMultiply()` could have been implemented differently, for instance:

`app.js`

```js
import { add } from './math'

export const addThenMultiply = (a, b, c) => {
  const multiplicand = add(a, b)
  let total = 0
  for (let i = 0; i < c; i++) {
    total = add(total, multiplicand)
  }
  return total
}
```

Now even though the function is correct, our test would fail. An example of testing the implementation for React components would be looking at state values instead of just looking at the output (what the render function returns).

## Types of tests

There are three main types of automated tests:

- **Unit**: tests a function (or more generally, a small piece of code) and mocks any functions called by that function.
- **Integration**: tests a function and the functions called by that function, mocking as little as possible. Usually functions that involve network requests are mocked.
- **End-to-end (e2e)**: tests the whole running application. Usually refers to the whole stack—including frontend server, API server, and database—running as they would in production, and the tests click and type in the UI. In the context of backend, it can mean just the API server and database are running, and tests send HTTP requests to the API server.

Should we write tests? What kind, and how many?

> “Write tests. Not too many. Mostly integration.”
> —[Guillermo Rauch](https://twitter.com/rauchg/status/807626710350839808)

Yes, we should write tests. No, we don’t need them to cover 100% of our code. Most of our tests should be integration tests. 

We write tests so that we can have confidence that when write code, we’re not breaking things that used to work. We can cover most of our code (or more importantly, our use cases) with integration tests. Why not cover everything with unit tests? Because it would take forever to write all of them, and some of them would test implementation, so whenever we refactored, we would have to rewrite our tests. We can cover the same amount of code with fewer integration tests, because each test mocks fewer things and covers more code. We don’t cover everything with e2e tests because they would take forever to run—after clicking or submitting a form, the test runner has to wait for the animation to complete or the network request to finish, which in one test might just add up to seconds, but with a whole test suite could take minutes. And it would slow down development if we had to wait minutes to see if the change we just made broke anything.

So the first thing we should do when writing tests is create integration tests to cover our important use cases. Then we can look at the code coverage and fill in the holes with more integration tests or with unit tests. How many e2e tests we write depends on how much of a difference there is between the integration and e2e environments. For full-stack tests, there might be a lot of differences between the integration test runner and an actual browser, so we should at least test the critical path (the most important user actions, for example in `twitter.com`’s case, logging in, posting a tweet, and scrolling the feed). For backend, where the integration tests include apollo server’s request pipeline, there’s not much difference between integration and e2e—in which case we can just do a couple tests that make sure the HTTP server runs and the connection to the database works.

# Continuous integration

While continuous integration (CI) technically means merging to master frequently, in modern web development it usually means the process of tests being run automatically on each commit. It’s often done with a service like [CircleCI](https://circleci.com/) that monitors our commits on GitHub, runs the tests, and provides a webpage for each commit where we can view the test output. We can also set it up to do something after the test, such as:

- Mark a pull request as passing or failing the tests.
- Mark that commit as passing or failing by adding a red X or green checkmark next to the commit in the repository’s history.
- If successful, deploy the code to a server—for example the staging or production server.

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

# Browser performance

Users notice when sites are slow, and they don’t like it 😄. So if we want our users to feel good using our site, we want different things in the browser to happen at certain speeds. 

First let’s go over how the browser works. Because JavaScript is single-threaded, it can only run on a single CPU core. We can have particular pieces of JS run in [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers), which can run on different cores, but most of our JS runs on one core, in the browser’s **main thread**. The browser also needs to do most of its page **rendering** (parsing HTML and CSS, laying out elements, painting pixels into images, etc) in the main thread. 

> **Composition**, in which the pixel images are positioned, happens on the GPU.

A CPU core has a limited speed—it can only do a certain amount of work each millisecond. And because both JS and rendering happen on the same core, every millisecond our JS takes up is another millisecond the browser rendering has to wait before it can run. And the user won’t see the page update until the browser has a chance to render.

Now that we know what’s going on, let’s think about different situations the user is in and how fast our site should be in each:

- **Page load**: The faster the better, but good targets are under 5 seconds *time to interactive* (the page is interactive when content has been displayed and the page is interactable—it can be scrolled, things can be clicked on, etc.) for the first visit and under 2 seconds for subsequent visits.
- **Response**: When humans take an action like clicking a button, and the page changes within 100 milliseconds, they generally perceive the response as immediate. If the response takes over 100ms, humans perceive a delay. If our click event handler runs code that takes 100ms on slow devices, then we want to break the code into two pieces: the minimum amount that will trigger the desired UI change, and the rest. And we schedule the rest to be done later:

```js
button.onclick = () => {
  updateUI()
  window.requestIdleCallback(doTheRest)
}
```

or in React:

```js
class Foo extends Component {
  onClick = () => {
    this.setState({ something: 'different' })
    window.requestIdleCallback(this.doTheRest)
  }
}
```

[requestIdleCallback()](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback) runs the given function when the browser is idle, after it has finished rendering the changes triggered by `updateUI()`/`this.setState()`.

- **Animation**: Humans perceive a motion as smooth at 60 fps—when 60 frames are rendered per second. If we take 1000 milliseconds and divide by 60, we get 16. So while something is moving on the page, we want the browser to be able to render every 16ms. The browser needs 6ms to paint, which gives us 10ms left to run JS in. “Something moving” includes visual animations like entrances/exits and loading indicators, scrolling, and dragging.
