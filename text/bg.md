# Chapter: Background

Chapter contents:

* [JavaScript](bg.md#javascript)
  * [Classes](bg.md#classes)
* [JSON](bg.md#json)
* [Git](bg.md#git)
* [Node, npm, and nvm](bg.md#node-npm-and-nvm)
* [HTTP](bg.md#http)
* [Server](bg.md#server)
* [Databases](bg.md#databases)
  * [MongoDB](bg.md#mongodb)
  * [Redis](bg.md#redis)
  * [SQL](bg.md#sql)
* [SPA](bg.md#spa)
* [SSR](bg.md#ssr)
* [React](bg.md#react)
* [Vue](bg.md#vue)
* [Mobile apps](bg.md#mobile-apps)
  * [Android](bg.md#android)
  * [iOS](bg.md#ios)
  * [React Native](bg.md#react-native)
* [Latency](bg.md#latency)
* [CDN](bg.md#cdn)  
* [Webhooks](bg.md#webhooks)  
* [Testing](bg.md#testing)  
  * [Mocking](#mocking)
  * [Types of tests](#types-of-tests)
* [Continuous integration](bg.md#continuous-integration)
* [Authentication](bg.md#authentication)
  * [Tokens vs. sessions](bg.md#tokens-vs-sessions)
  * [localStorage vs. cookies](bg.md#localstorage-vs-cookies)
* [Browser performance](bg.md#browser-performance)

---

This chapter provides concise introductions to various background topics. You’re welcome to either read them all up front or individually as you go along—at the beginning of a section, you’ll find a list of topics it assumes knowledge of, like the [Anywhere: HTTP](5.md#anywhere-http) section, which has two listed:

> Background: [HTTP](bg.md#http), [JSON](bg.md#json)

Some topics, like [Git](#git) and [Node](#node), are necessary for following along with the coding. Others, like [Tokens vs. sessions](#tokens-vs-sessions), are nice to know, but not essential.

# JavaScript

Most of the code in the book is in modern JavaScript. If you’re new to JS, you can learn through interactive [courses](https://www.codecademy.com/learn/introduction-to-javascript), video ([intro](https://www.leveluptutorials.com/tutorials/javascript-tutorials?ref=guide) and [intermediate](https://javascript30.com/?ref=guide)), or [a combination](https://www.khanacademy.org/computing/computer-programming/programming).

If you know traditional JS, but some of the new syntax is unfamiliar (for instance [async/await]((https://codeburst.io/javascript-es-2017-learn-async-await-by-example-48acc58bad65)), here’s a [course on ES6](https://es6.io/?ref=guide).

The one JS topic we’ll cover here is classes:

## Classes

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

In JavaScript, if we have this document in a string, we can parse it to create a JavaScript object with the same data:

```js
const jsObject = JSON.parse(jsonString)
```

When working with raw [HTTP](#http) responses that contain a JSON body, we have to use `JSON.parse()` to get the data into an object. But we’ll mostly be working with libraries that take care of this step for us.


# Git

[Git](https://en.wikipedia.org/wiki/Git) is a version control system for saving your code and keeping a history of the changes. Unfamiliar? Try this [interactive tutorial](https://try.github.io/).

# Node, npm, and nvm

[Node](https://nodejs.org/en/) is what runs JavaScript on a server. [npm](https://www.npmjs.com/) is a JavaScript package manager and registry. Their `npm` command-line tool manages the packages (libraries of JavaScript code) that our app depends on, helping us install and upgrade them. Their registry stores the content of the packages and makes them available for download—it has more packages than any other registry in the history of software! We use npm packages both with code that runs on the server in Node and with code that runs on the client—in the browser or in React Native. 

We recommend installing Node with [`nvm`](https://github.com/creationix/nvm) (the *Node Version Manager*):

```sh
$ curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash
$ nvm install node
$ nvm alias default node
```

This installs the latest version of Node. Then, in a new terminal window, we can see the version number with:

```sh
$ node -v
```

We can keep track of which projects use which versions of node by adding a `.nvmrc` file to the root of each project. It contains a version number (like `8` or `8.11.3`) or `node` to use the latest stable version. Then, when we switch projects, we run `nvm use` to switch to that project’s version of node:

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
    "graphql": "^0.13.1“  }
}
```

We see the current package’s version, which was `0.13.1` at the time of writing. npm packages follow **SemVer**, a convention for version numbering:

`[major version].[minor version].[patch version]`

Major version changes mean the library’s API has been changed in an incompatible way—if we write our code to use version `1.0.0` of a library (for example, using the library’s function `doThis()`), our code will probably break if we switch to version `2.0.0`. (For example, if the library renamed `doThis` to `doThat`, and our code were still called `doThis()`, we’d get an error.) Minor and patch version changes do not break the API—if we write our code using version `1.0.0` of a library, we can safely upgrade to version `1.0.8` or `1.4.0`.

Minor version changes mean that functionality has been added—if we write our code using version `1.4.0`, it may break if we switch to version `1.3.0`, because it may use a feature introduced in minor version 4. Patch version changes mean that bugs have been fixed—if we switch from `1.0.8` to `1.0.7`, our code may stop working because of the bug that was fixed in patch version 8.

The one exception to the above is that version numbers with a major version of 0 don’t have a stable API, so going from `0.0.1` to `0.0.2` could be breaking—as could going from `0.1.0` to `0.2.0`.

A caret `^` before a version number means that our code depends on any version compatible with that number—for example, if we had a dependency `"foo": "^1.4.0"`, our code should work with any versions between `1.4.0` and `2.0.0`, such as `1.4.1` or `1.11.2`.

We can also see that we have a new `node_modules/` folder, and it contains folders with the package code:

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
    "iterall": "^1.2.0“  },
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

HTTP is a format for sending messages over the internet. It is used on top of two other message formats—IP (which has an *IP address* and routes the message to the right machine) and TCP (which has a port number and resends any messages that are lost in transit). An HTTP message adds a *method* (like `GET` or `POST`), a path (like `/graphql`), headers (like the `Bearer` header we use for [authentication](#authentication)), and a body (where GraphQL queries and responses go). 

When we enter a URL, like `http://graphql.guide/`, into our browser, it goes through these steps:

- Browser asks DNS server what the IP address of `graphql.guide` is.
- DNS server responds with `104.27.191.39`.

We can see for ourselves what the DNS server says using the `nslookup` command:

```sh
$ nslookup graphql.guide
Server:         8.8.4.4
Address:        8.8.4.4#53

Non-authoritative answer:
Name:   graphql.guide
Address: 104.27.191.39
```

- Browser sends out a message to the internet that looks like this:

```
IP to 104.27.191.39
TCP to port 80
HTTP GET /
```

- Internet routers look at the IP part, see it is addressed to `104.27.191.39`, and pass it off to a router that is closer to `104.27.191.39`.

- The message arrives at `104.27.191.39` (the IP address of the Guide server), which opens the message, sees that it’s trying to connect to port 80, and passes the message to whatever server program (in this case, a Node.js process) is listening at the port. 

> An *IP address* is the number ID of a computer on the internet, and we can think of a *port* as the number of a program running on that computer.

- The server process sees that the client wants to GET /, the root path, and sends back an `index.html` to the client.

> This sequence is a little simplified—it actually takes a separate round-trip message to set up the TCP connection, and for `graphql.guide`, the client is actually redirected to HTTPS at the beginning, which uses port 443 and sets up an SSL connection before sending HTTP GET /.

# Server

The term *server* may refer to:

1. A computer connected to a network (usually the internet).
2. A process running on that computer that listens to one or more ports.
3. The group of computers/processes that share the responsibility of handling requests.

In web development, servers are usually either static file servers (which serve files like our HTML, images, and JS bundle), application (app) servers (the ones that power our API and that the client talks to), or database servers. *Server-side* either means app servers or everything that’s not the client-side (including file, app, and database servers, as well as any other servers they talk to).

# Databases

Databases are organized collections of data stored on a computer. That computer is called a *database server*, and the computer querying the database (usually an app server) is called the *database client*. Different databases organize their data differently, store it differently, and communicate differently. There are two types of database storage: *in-memory* (the data is stored in RAM, and would be lost in a power outage) and *persistent* (the data is stored on disk—a hard drive or SSD). [Redis](#redis) is primarily used as an in-memory database, whereas [MongoDB](#mongodb) and [SQL](#sql) databases are usually used as persistent databases. 

There are two main categories of databases: 

- **Relational databases**: These usually use SQL (Structured Query Language), and follow the relational model, with *tables* of *columns*, *rows*, and unique keys. The most popular relational databases are SQLite for development and PostgreSQL for production. 
- **Non-relational (NoSQL) databases**: These usually use their own query language, although some (like the [Dgraph](https://dgraph.io/) graph database and distributed [FaunaDB](https://fauna.com/)) support GraphQL as a way to query the database! 😄 There are a few categories of NoSQL databases:
  - **Document databases** like MongoDB
  - **Graph databases** like [Neo4J](https://neo4j.com/)
  - **Key-value databases** like Redis
  - **Wide-column databases** like [Cassandra](http://cassandra.apache.org/)
  - **Multi-model** which support [multiple data models](https://en.wikipedia.org/wiki/Multi-model_database)

In this section, we’ll look at three databases:

- [MongoDB](#mongodb)
- [Redis](#redis)
- [SQL](#sql)

## MongoDB

While MongoDB can be used as an in-memory database, it’s usually used as a persistent database. The data is organized in *collections* of JSON-like *documents*. Developers communicate with the database using [MongoDB *schema statements*](https://docs.mongodb.com/manual/crud/):

```js
import { MongoClient } from 'mongodb'

const DATABASE_SERVER_URL = 'mongodb://my-database-server-domain.com:27017/guide'

const client = new MongoClient(DATABASE_SERVER_URL)

const example = async () =>  {
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
}

example()
```

> In practice, we should handle errors either with a try-catch or .catch (`await users.findOne().catch(e => console.log(e)))`).

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

The above code uses the [`mongodb` module](https://mongodb.github.io/node-mongodb-native/), which is the official Node.js driver provided by MongoDB. It's always up to date with security patches, it supports the latest MongoDB versions, and it includes support for:

- [Transactions](https://mongodb.github.io/node-mongodb-native/3.4/api/ClientSession.html#withTransaction)
- Aggregations ([collection](https://mongodb.github.io/node-mongodb-native/3.4/api/Collection.html#aggregate) and [database](https://mongodb.github.io/node-mongodb-native/3.4/api/Db.html#aggregate) level)
- Retryable reads and writes
- [Client-side field-level encryption](https://mongodb.github.io/node-mongodb-native/3.4/reference/client-side-encryption/)

Querying with `mongodb` is through MongoDB schema statements. It can be simplified in some ways with the [`mongoose` module](https://mongoosejs.com), the main JavaScript *ORM* for MongoDB. We’ll use Mongoose in [Chapter 1](1.md) and `mongodb` in [Chapter 11: Server Dev](11.md).

> An *ORM*, or object-relational mapping, is a library that models database records as objects. In the case of Mongoose, it models MongoDB documents as JavaScript objects. It also does schema validation, typecasting, query building, and business logic hooks. 

## Redis

[Redis](https://en.wikipedia.org/wiki/Redis) is an in-memory key-value database with optional durability:

- *In-memory*: Data is read from and written to memory (RAM) and not durable (data is lost on restart or power loss).
- *Key-value*: Data is stored in values and fetched by keys (unique strings).
- *Optional durability*: Data can be periodically persisted (written to disk), thus making almost all the data (minus whatever changed in the last couple seconds since the last write to disk) durable (able to be recovered on restart).

Redis is usually used as a cache—for data that we want quick access to but are okay losing. We can install locally with `brew install redis` and start with `brew services start redis`. Then we can query using the [`ioredis`](https://www.npmjs.com/package/ioredis) npm library:

```js
import Redis from 'ioredis'
const redis = new Redis()
 
await redis.set('name', 'The Guide')
const name = await redis.get('name')
// 'The Guide'

redis.del('name')
```

This uses the three basic commands: SET, GET, and DEL (delete). Here the value is just a string (`'The Guide'`), but values can be other types of data too, including:

- lists (list of strings, ordered by time of insertion)
- sets (unique, unordered strings)
- sorted sets
- hashes (similar to JS objects)

Hash commands include [HMSET](https://redis.io/commands/hmset) (hash multiple set) and [HGET](https://redis.io/commands/hget) (hash get single field):

```js
await redis.hmset('latest-review', { stars: '5' text: 'A+' })
const reviewStars = parseInt(await redis.hget('latest-review', 'stars'))
// 5

redis.del('latest-review')
```

## SQL

SQL (Structured Query Language) is a language for querying relational databases like SQLite and PostgreSQL. Relational databases have *tables* instead of MongoDB’s collections, and *rows* instead of documents. A row is made up of *values* for each *column* in the table. Columns have a name and a type—for instance a `reviews` table with a column named `star` of type `INTEGER`, which could have a value of `5` in the first row:

![reviews table with three columns and three rows](img/)

Unlike MongoDB collections, each table has a schema—its name and list of columns. Both the table schema and query statements are written in SQL. Here are the `CREATE TABLE` and `INSERT` statements to create the pictured table and rows. Then, the `SELECT` statement returns the table’s contents:

```
$ brew install sqlite
$ sqlite3
SQLite version 3.31.1 2020-01-27 19:55:54
Enter ".help" for usage hints.
Connected to a transient in-memory database.
Use ".open FILENAME" to reopen on a persistent database.
sqlite> CREATE TABLE reviews(
   ...>   id INTEGER PRIMARY KEY,
   ...>   text TEXT NOT NULL,
   ...>   stars INTEGER
   ...> );
sqlite> INSERT INTO reviews VALUES(1, 'Breathtaking', 5);
sqlite> SELECT * FROM reviews;
1|Breathtaking|5
sqlite> INSERT INTO reviews VALUES(2, 'tldr', 1);
sqlite> INSERT INTO reviews VALUES(3, "Now that's a downtown job!", null);
sqlite> SELECT * FROM reviews;
1|Breathtaking|5
2|tldr|1
3|Now that's a downtown job!|
```

The `id` column is marked as the `PRIMARY KEY` (each table must have a unique key), and the `text` column is non-null (`NOT NULL`). `SELECT * from reviews` means “fetch all the values from all the rows in the reviews table,” and it prints the results to the console. We insert 3 rows of `VALUES` (the values are listed in the order that the columns are declared in the schema). The last row is allowed to have a `null` value because the `stars` column wasn’t declared with `NOT NULL`. And we see in the final `SELECT` statement result that there’s nothing in the third column. There are many other statements and variations to statements. A couple more common ones are `UPDATE` and `DELETE`, which alter and remove rows:

```
sqlite> UPDATE reviews SET stars = 4 WHERE id = 3;
sqlite> SELECT * FROM reviews;
1|Breathtaking|5
2|tldr|1
3|Now that's a downtown job!|4
sqlite> DELETE FROM reviews WHERE stars = 4;
sqlite> SELECT * FROM reviews;
1|Breathtaking|5
2|tldr|1
```

Relational databases have relations between tables—for instance, in the reviews table, we can have an `author_id` column that matches the `id` column in the users table. When a review row has a value of 1 under its `author_id` column, it means the user row with an `id` of 1 authored the review. We can tell SQL about this relation between the tables by adding this to the reviews table:

```
FOREIGN KEY(author_id) REFERENCES users(id)
```

Then, we can make a query that fetches data from both tables using INNER JOIN:

```
sqlite> CREATE TABLE users(
   ...>   id INTEGER PRIMARY KEY,
   ...>   username TEXT NOT NULL
   ...> );
sqlite> DROP TABLE reviews;
sqlite> CREATE TABLE reviews(
   ...>   id INTEGER PRIMARY KEY,
   ...>   text TEXT NOT NULL,
   ...>   stars INTEGER,
   ...>   author_id INTEGER NOT NULL,
   ...>   FOREIGN KEY(author_id) REFERENCES users(id)
   ...> );
sqlite> INSERT INTO users VALUES(1, 'lorensr');
sqlite> INSERT INTO reviews VALUES(1, 'Breathtaking', 5, 1);
sqlite> INSERT INTO reviews VALUES(2, 'tldr', 1, 1);
sqlite> SELECT reviews.text, reviews.stars, users.username FROM reviews INNER JOIN users ON reviews.author_id = users.id;
Breathtaking|5|lorensr
tldr|1|lorensr
```

`Breathtaking|5` is from the reviews table while `lorensr` is from the users table.

While we can send SQL statements as strings in our code, we usually use a library for convenience and security (avoiding [SQL injection](https://en.wikipedia.org/wiki/SQL_injection)). In [Chapter 11: SQL](11.md#sql), we use the [Knex](https://knexjs.org/) library, which looks like this:

```js
this.knex
  .select('*')
  .from('reviews')
```

# SPA

An [SPA](https://en.wikipedia.org/wiki/Single-page_application) (single-page application) is a website that keeps the same page loaded for the duration of the user’s session. Instead of a traditional website, in which every link or button that is clicked causes an [HTTP request](#http) to be sent to the server and a new HTML page to be loaded, there is a single HTML page, and JavaScript changes the page to show different views. React, Angular, and Vue are all JS libraries for making SPAs (often called *view libraries*).

# SSR

SSR (server-side rendering) is when, instead of sending a small HTML file and a JS bundle that we ask the client to parse and render into HTML, our server sends fully rendered HTML (that it created by running the JS view code on the server). When that rendered HTML is cached, the client browser will display the page faster than a normal SPA (a normal SPA displays a blank or skeleton HTML page, and then JavaScript constructs the view and puts it on the page). We also have code from our view library that, once the browser loads the static HTML, attaches our app’s event handlers (like `onClick`, `onSubmit`, etc.) to the page (through a process called *hydration*).

# React

[React](https://reactjs.org/) was released by Facebook in 2013, and it has since steadily increased in popularity, surpassing Angular in GitHub stars in 2016 to become the most popular JavaScript view library. (And while Vue passed React in star count in 2018, React had 5x the number of npm downloads at the time of writing.) React continues to be developed by a team at Facebook, who have merged in contributions from over one thousand developers.

As a view library, React is responsible for what the user sees on the screen. So its job is putting DOM nodes on the page and updating them. Different view libraries accomplish this in different ways and provide different APIs for us—the developers—to use. The primary features of React are:

- **JSX**: JSX (JavaScript XML) is an extension to JavaScript that allows us to write HTML-like code, with JavaScript expressions inside curly brackets `{}`.
- **Components**: Components are functions or classes that receive arguments (called *props*) and return JSX to be rendered. They can also be used as HTML tags inside JSX: `<div><MyComponent /></div>`.
- **Declarative**: Components automatically get re-run whenever their props or state changes, and the new JSX they return automatically updates the page. This process is called declarative because we declare what our props and state are, which determines how the JSX looks. This is in contrast to an *imperative* view library, like jQuery, in which we would make changes to the page ourselves (for example, by adding an `<li>` to a `<ul>` with `$('ul').append('<li>New list item</li>')`).
- **Virtual DOM**: React creates a model of the page, and when we return different JSX from our components, React compares the new JSX to the previous JSX, and uses the difference to make the smallest possible changes to the DOM. This process improves the rendering speed.

# Vue 

[Vue.js](https://v3.vuejs.org/guide/introduction.html) was created in 2014 by Evan You after working with Angular.js at Google. Evan wanted a lightweight view library that had the good parts of Angular. It has since evolved a lot, is now in its third major version, and has a number of accompanying tooling and libraries, including a devtools browser extension, a CLI, a webpack loader, and a router library. 

Similarly to React, Vue has components, declarative templating, and a virtual DOM. Instead of JSX, Vue uses an HTML-based syntax with double curly brace interpolation and special attributes called *directives*. Javascript expressions can be used inside both. Like React, Vue has reactivity, but in a different fashion. React components have functions that re-run whenever a prop or piece of state changes. In Vue, the `setup()` function is run once. The template includes reactive objects, and when any of its reactive objects are changed, it gets re-rendered. 

Vue also has [two-way data binding](https://v3.vuejs.org/guide/forms.html#basic-usage) on form inputs: when a data object is bound to a form input, the object is updated when the user makes a change (for example, typing in an `<textarea>` or checking a checkbox), and when the object is changed by code, the element’s value is updated.

# Mobile apps

* [Android](bg.md#android)
* [iOS](bg.md#ios)
* [React Native](bg.md#react-native)

With the demise of BlackBerry OS in 2013 and Windows Phone in 2015, the only two mass market phone operating systems are iOS and Android, with around 15% and 85% of the global market, respectively. And in the U.S., the majority of time spent online is spent on mobile devices. If we want our users to be able to use our software on mobile, we can either make a web app or a native mobile app.

Pros of making a web app:

- We don’t need to have multiple codebases for desktop web and mobile. We can make our desktop web app a responsive PWA that works on mobile, or, if we choose to have a separate mobile site (like `m.oursite.com`), we can at least share a lot of the code.
- Publishing is easier:
  - We aren’t subject to app store rules and review processes.
  - Our users don’t have to update the app to get the newest version—the newest version is loaded when they open our website (or if we’re using a service worker, they might get the new version the second time they open the site, depending on our implementation).

Pros of making a native app:

- Better UX: 
  - Native UI components that feel smoother / perform better.
  - No browser URL bar or bottom navigation bar.
  - Easier to open: the user of a web app has to either install the PWA, which most iOS users don’t know how to do, or they have to open a browser and type in our URL.
- More capabilities, particularly when it comes to iOS. (Android allows PWAs—progressive web apps—to do more, like store large files, speech recognition, bluetooth, background sync, and push notifications. Android also doesn’t delete our cached assets like IndexedDB, service worker cache, and LocalStorage after two weeks of disuse.)
- If we make a [universal React Native app](#react-native), then we don’t need to have separate codebases for web and mobile.

The three main ways of making a native mobile app are:

- Native code: Java, C++, or Kotlin for Android, and C++, Objective-C, or Swift for iOS.
- React Native: We write JavaScript code that runs on the device in a background process and communicates with the React Native runtime to interact with native UI components and device APIs.
- Cordova: A native shell for our web app. We build and submit a native app to the app store, and when the app starts up, it loads our website inside a *web view* (like a full-screen browser tab). So our UI and logic is written in HTML/CSS/JS, and we can add Cordova plugins so that our JavaScript can call native APIs.

Cordova is much less popular than the other options, as it performs poorer, and the plugins are more often out of date or buggy compared to React Native plugins (called [native modules](https://reactnative.dev/docs/native-modules-setup)).

## Android

Android is a mobile operating system created in 2003 and bought by Google in 2005. As it is open source (published under the Apache license), it can be freely used, and it *is* used by ~all phone manufacturers besides Apple. It can also be modified—for instance, Fire OS is a fork of Android used by Amazon for its mobile devices. 

One thing to keep in mind when developing for Android is that Android devices are more likely than iOS devices to be on an older version of the OS. At the time of writing, only 33% of Android devices were on the latest major version, and 15% were 5+ years old, versus 85% of iOS devices on the latest version and 1% 4+ years old.

While any editor can be used, the official IDE is Android Studio, and it can build, run, and package apps. It also does linting, layout editing, debugging, and device emulation.

Android apps can be written in Kotlin, Java, and/or C++. As of 2019, Google recommends Kotlin. Kotlin is statically typed and multi-paradigm: it supports object-oriented programming, functional programming, and other styles. We use [Kotlin](https://kotlinlang.org/) in the [Android chapter](10.md), and those who know JavaScript will likely be able to read the code and understand what’s going on. You can also learn Kotlin by example [on their website](https://play.kotlinlang.org/byExample/overview). 

## iOS

The iOS operating system was released in 2007 with the first iPhone. It is closed source and only used on Apple devices. The iOS IDE is Xcode, and it has similar features to Android Studio. iOS apps can be written in Swift, Objective-C, and/or C++. Swift was released by Apple in 2014 as an improved, modern option. It is multi-paradigm and actively developed, with a new major version released each year.

## React Native

React Native (RN) is an open-source front-end JavaScript framework from Facebook. Version `0.1.0` was released in 2015, and since then there have been over 60 minor versions released and > 20,000 commits from > 2,000 people. It originally just supported iOS, with Android support coming soon after. Microsoft released support for [Windows and macOS](https://microsoft.github.io/react-native-windows/), and there are third-party packages for [web](https://github.com/necolas/react-native-web), [tvOS](https://github.com/react-native-community/react-native-tvos), Linux (via Qt: [Proton Native](https://github.com/kusti8/proton-native) or [RN Desktop](https://github.com/status-im/j)), and more. 

Some third-party RN modules have platform-specific code, in which case they only support certain platforms. We can find modules that work with our target platforms by filtering on [reactnative.directory](https://reactnative.directory/). A *universal* react native app is one that works on more than just the official two platforms (iOS and Android). It most often refers to iOS, Android, and web. 

[Expo](https://expo.io/) is a set of tools and modules that makes it easier to code React Native apps, and it supports iOS, Android, and web. Most of its modules are compatible with all three platforms, and there’s a chart on each library’s documentation page so we know the exceptions:

![Expo’s AppleAuthentication library, which doesn’t work on Android or web](/img/expo-library-compatibility.png)

Expo’s major features are:

- A command-line tool that makes it easy to run the app on devices or simulators in development.
- A large set of well-maintained cross-platform libraries for accessing device APIs.
- A build service that streamlines preparing apps for the app stores.
- Over-the-air updates: updating our app in production without resubmitting to the app store.
- Cross-platform push notification service.

# Latency

Latency is the period between one machine sending a message over the internet and the other machine receiving it. It’s usually talked about in terms of round-trip time: the time it takes for the message to get to the destination and for a reply to reach the source. The `ping` command-line tool displays round-trip time between our computer and another machine. Here, we see that it takes around 5 milliseconds total for a message to reach the nearest Google server and for the reply to arrive back:

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

It generally takes longer to reach servers that are physically farther away. The internet backbone is made of fiber optic cables, and the light messages travelling through them have a maximum speed. It takes 75 ms for a message to go from New York across the Atlantic Ocean to Paris and back. And the same to cross the U.S. to San Francisco and back. 164 ms from New York to Tokyo, and 252 ms from New York to Shanghai.

> These numbers have one exception, which is near-Earth satellite networks like [Starlink](https://en.wikipedia.org/wiki/Starlink_(satellite_constellation)). The satellites are so close, the latency between them and the ground can be as low as 7 ms. The satellites communicate with each other by light, and light travels faster in straight lines through space than in cables curved over the Earth’s surface, so latency to far-off locations is reduced!

Why do developers need to know about latency? Because we never want to keep our users waiting! If our web server is in New York, our database is in Shanghai, and our user is in San Francisco, and the request requires 3 database requests in series, and our server code takes 20ms, then the user won’t receive a response for (75 + 252 * 3 + 20) = 851 ms! (And this is assuming the [TCP](#http) connection is already set up, which would require another round trip from the user to the server, not to mention the longer SSL handshake if it’s HTTPS.) Almost one second is a long time for our user, whose human brain [notices delays](https://developers.google.com/web/fundamentals/performance/rail)
as short as 100ms. This is why we try to locate our database server in the same data center as our web server (for example both in Amazon’s [`us-east-1`](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html)). It’s why we use a [CDN](#cdn) to get our files on servers around the world, closer to our users. It’s also why we try to reduce the number of sequential requests we need to make between the client and the server, and why it’s so important we can put all of our queries in a single GraphQL request.

# CDN

A CDN, or *Content Delivery Network*, has servers around the world that deliver our content to users. Because their servers are closer to our users than our servers are, they can respond faster than we can, improving [latency](#latency). Here is the way they typically deliver our content:

- We tell our domain name registrar (where we bought the domain) to set the CDN as our [DNS](#http) server.
- We have our server set a `Cache-Control` header on our responses to HTTP requests. The header tells the CDN how long to serve that response to users.

Then, when a user makes a request, this is what happens the first time:

- The client asks the DNS server: “Where is `ourdomain.com/foo`?”
- The DNS server, which is run by our CDN, replies: “It’s at `1.2.3.4`”, which is the IP address of a nearby server run by the CDN.
- The client connects to `1.2.3.4` and makes the request, saying: `GET ourdomain.com/foo`.
- The `1.2.3.4` CDN server doesn’t know what the `/foo` response should be, so it makes this request to our server: `GET ourapp.herokudns.com/foo`.
- The `1.2.3.4` CDN server forwards the response from our server to the client.
- If the response from our server had an HTTP header that says `Cache-Control: max-age=60`, then the CDN caches it for 60 seconds.

After the CDN caches it, during the next minute, here is what happens when other users make the same request:

- The client asks DNS server: “Where is `ourdomain.com/foo`?”
- The DNS server, which is run by our CDN, replies: “It’s at `5.6.7.8`”, which is the IP address of a nearby server run by the CDN.
- The client connects to `5.6.7.8` and makes the request, saying: `GET ourdomain.com/foo`.
- The `5.6.7.8` CDN server finds the `/foo` response in its cache, and sends it to the client.

These subsequent requests take much less time to complete than requests to our server because: A) the CDN servers are closer, so it takes less time to reach them over the internet, and B) the CDN servers have the whole response ready to quickly return, whereas our server would spend time constructing the response.

# Webhooks

Webhooks are a system for how one server can notify another server when something happens. Some sites, including GitHub, allow us to provide them with a URL, for instance,  `https://api.graphql.guide/github-hook`, to which they make an [HTTP](#http) request when a certain event occurs. If we tell GitHub we want to know about the [`watch` event](https://developer.github.com/v3/activity/events/types/#watchevent) on the Guide repo, then they will send a POST to our server (using the given URL) whenever the repo is starred. The POST will contain a JSON body with information about the event, for example:

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

We write tests so that when we write new code, we can have confidence that the new code won’t break things that used to work. We can cover most of our code (or more importantly, our use cases) with integration tests. Why not cover everything with unit tests? Because it would take forever to write all of them, and some of them would test implementation, so whenever we refactored, we would have to rewrite our tests. We can cover the same amount of code with fewer integration tests, because each test mocks fewer things and covers more code. We don’t cover everything with e2e tests because they would take forever to run—after clicking or submitting a form, the test runner has to wait for the animation to complete or the network request to finish, which in one test might just add up to seconds, but with a whole test suite could take minutes. And it would slow down development if we had to wait minutes to see if the change we just made broke anything.

So the first thing we should do when writing tests is create integration tests to cover our important use cases. Then we can look at the code coverage and fill in the holes with more integration tests or with unit tests. How many e2e tests we write depends on how much of a difference there is between the integration and the e2e environments. For full-stack tests, there might be a lot of differences between the integration test runner and an actual browser, so we should at least test the critical path (the most important user actions, for example, in `twitter.com`’s case, logging in, posting a tweet, and scrolling the feed). For backend, where the integration tests include apollo server’s request pipeline, there’s not much difference between integration and e2e—in which case we can just do a couple tests that make sure the HTTP server runs and the connection to the database works.

How we write tests depends on our *test runner*—the tool we use to run our testing code and report the results to us. For JavaScript unit and integration tests, we recommend [Jest](https://jestjs.io/), and for JS integration tests, we recommend [Cypress](https://www.cypress.io/).

# Continuous integration

While continuous integration (CI) technically means merging to master frequently, in modern web development it usually means the process of tests being run automatically on each commit. It’s often done with a service like [CircleCI](https://circleci.com/) that monitors our commits on GitHub, runs the tests, and provides a webpage for each commit where we can view the test output. We can also set it up to do something after the test, such as:

- Mark a pull request as passing or failing the tests.
- Mark that commit as passing or failing by adding a red X or green checkmark next to the commit in the repository’s history.
- If successful, deploy the code to a server—for example the staging or production server.

When the last step is included, the process may also be called continuous delivery or continuous deployment.

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

- **Size**: Cookies can’t be larger than 4KB, and, in some cases, we might want to store more than 4 KB of data in our token, in which case we’d need to use localStorage.
- **Flexibility**: Data you put in localStorage can be managed by client-side JavaScript and sent to any domain, whereas cookies can only be set by the server and can only be shared among subdomains.
- **XSS**: Cookies are set by the server and can be configured to be inaccessible from client-side JS, so they can’t be read by [XSS attacks](https://en.wikipedia.org/wiki/Cross-site_scripting). Data stored in localStorage is vulnerable to XSS because it can be read by any JS running on your page (from any source allowed by your [CSP](https://en.wikipedia.org/wiki/Content_Security_Policy)).
- **CSRF**: Cookies are vulnerable to [CSRF attacks](https://en.wikipedia.org/wiki/Cross-site_request_forgery), whereas localStorage is not.

While the XSS issue is a serious concern, a common mitigation is setting short expirations, and for applications without strict security requirements, we again recommend using whichever method is easier to set up.

# Browser performance

Users notice when sites are slow, and they don’t like it 😄. So if we want our users to feel good using our site, we want different things in the browser to happen at certain speeds. 

First, let’s go over how the browser works. Because JavaScript is single-threaded, it can only run on a single CPU core. We can have particular pieces of JS run in [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers), which can run on different cores, but most of our JS runs on one core, in the browser’s **main thread**. The browser also needs to do most of its page **rendering** (parsing HTML and CSS, laying out elements, painting pixels into images, etc.) in the main thread. 

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

- **Animation**: Humans perceive a motion as smooth at 60 fps—when 60 frames are rendered per second. If we take 1,000 milliseconds and divide by 60, we get 16. So while something is moving on the page, we want the browser to be able to render every 16ms. The browser needs 6ms to paint, which gives us 10ms left to run JS. “Something moving” includes visual animations like entrances/exits and loading indicators, scrolling, and dragging.


