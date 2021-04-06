---
title: Databases
---

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

Querying with `mongodb` is through MongoDB schema statements. It can be simplified in some ways with the [`mongoose` module](https://mongoosejs.com), the main JavaScript *ORM* for MongoDB. We’ll use Mongoose in [Chapter 1](../understanding-graphql/index.md) and `mongodb` in [Chapter 11: Server Dev](../server/index.md).

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

![reviews table with three columns and three rows](../img/reviews-table.png)

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

While we can send SQL statements as strings in our code, we usually use a library for convenience and security (avoiding [SQL injection](https://en.wikipedia.org/wiki/SQL_injection)). In [Chapter 11: Server > SQL](../server/more-data-sources/sql.md), we use the [Knex](https://knexjs.org/) library, which looks like this:

```js
this.knex
  .select('*')
  .from('reviews')
```

