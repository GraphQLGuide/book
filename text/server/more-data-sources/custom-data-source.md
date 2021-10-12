---
title: Custom data source
description: How to create our own Apollo Server data source
---

## Custom data source

When we’ve been talking about data sources, sometimes we’re referring to the classes we create (`PPP` in the below snippet), and sometimes we’re referring to the parent classes that we get from an npm library and extend (`RESTDataSource`).

```js
import { RESTDataSource } from 'apollo-datasource-rest'

class PPP extends RESTDataSource {
  ...
}
```

If there’s a type of database or API for which we can’t find an existing library and parent class, we can write our own! A data source parent class has most or all of the following pieces:

- Extends the `DataSource` class from the `apollo-datasource` library
- Some way of receiving information about the database or API (either a constructor parameter or an instance variable like `this.baseURL` in `RESTDataSource`)
- An `initialize()` method that receives the context and an optional cache
- Calls lifecycle methods that can be defined by the child class, like `willSendRequest()` and `didEncounterError()` in `RESTDataSource`
- Methods for fetching data, which use DataLoader and/or the cache
- Methods for changing data, which might invalidate cached data

Let’s see all these in a parent class called `FooDataSource` for an imaginary Foo document database. It’s passed a Foo database client `dbClient`, which has these fields:

- `dbClient.connectionURI`: the URI of the database server
- `dbClient.getByIds(ids)`: given an array of IDs, returns the associated documents from the database
- `dbClient.update(id, newDoc)`: updates the document with the given `id` to the `newDoc`

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
    const cacheDoc = await this.cache.get(this.cacheKey(id))
    if (cacheDoc) {
      return JSON.parse(cacheDoc)
    }

    const doc = await this.loader.load(id)

    if (ttlInSeconds) {
      this.cache.set(this.cacheKey(id), JSON.stringify(doc), { ttl: ttlInSeconds })
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

Let’s look at each part:

```js
  constructor(dbClient) {
    super()
    this.db = dbClient
    this.loader = new DataLoader(ids => dbClient.getByIds(ids))
  }
```

The constructor saves the db client as an instance variable to be used later. It also creates an instance of `DataLoader` to use for this request (a new data source object will be created for each GraphQL request). DataLoader needs to know how to fetch a list of documents by their IDs. Here we’re assuming the array of documents that `getByIds()` returns is in the same order and has the same length as `ids` (a requirement of DataLoader); otherwise, we’d need to reorder them.

[DataLoader](https://github.com/graphql/dataloader) is a library that does batching and memoization caching for the queries our data source makes within a single GraphQL request. **Batching** converts multiple database requests for individual documents into a single request for all the documents, and **memoization caching** deduplicates multiple requests for the same document.

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

When an error occurs, we call `this.didEncounterError()`, which a child class can override.

```js
  cacheKey(id) {
    return `foo-${this.db.connectionURI}-${id}`
  }
```

We use the `connectionURI` in the cache key to avoid collisions. A collision could occur if there were a global cache and multiple Foo data sources connected to different Foo databases, and one database had a document with the same ID as a document in another database.

```js
  async get(id, { ttlInSeconds } = {}) {
    const cacheDoc = await this.cache.get(this.cacheKey(id))
    if (cacheDoc) {
      return JSON.parse(cacheDoc)
    }

    const doc = await this.loader.load(id)

    if (ttlInSeconds) {
      this.cache.set(this.cacheKey(id), JSON.stringify(doc), { ttl: ttlInSeconds })
    }

    return doc
  }
```

We provide a `get(id)` method to be used in resolvers, with an optional `ttlInSeconds` if the caller wants the result to be cached. First, we check if the doc is already in the cache. If it is, we parse it (cache values are always strings) and return it. Then we ask DataLoader to get the document. It will: 

- Take all the calls to `.load(id)`. (The resolver—or other resolvers—might be calling `.get()` around the same time as this is running.)
- Deduplicate them (when `.get()` is called multiple times with the same ID).
- Put all the distinct IDs into an array for a batch request (the call to `dbClient.getByIds()` in the constructor).

Once the batch request completes, DataLoader returns on this line the one document we need:

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

We provide an `update(id, newDoc)` method to be used in resolvers. After a successful update, it deletes the old document from the cache. Another possible implementation would be to overwrite the previous cache entry with `newDoc`—in this case, we’d need a value for `ttl` and could add a third argument to `update()` with a `ttlInSeconds`.

Once we have the parent class complete, we can use it by creating one or more child classes. In the case of Foo, we’d create one for each database, but with some data sources we might do one for each table or collection. 

Here’s an example child class:

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

The child class overrides `didEncounterError` to use its own error reporting service instead of throwing. It adds a new method that calls the parent’s `.get()` and `.update()`. When we create the data source, we give the database client to the constructor:

```js
import FooClient from 'imaginary-foo-library'

import MyFooDB from './MyFooDB'

const fooClient = new FooClient({ uri: 'https://foo.graphql.guide:9001' })

const dataSources = () => ({
  myFoos: new MyFooDB(fooClient)
})
```

And now inside our resolvers, we can use `context.dataSources.myFoos` and all the methods defined in the parent class (`FooDataSource`) and child class (`MyFooDB`):

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

These example resolvers use `.get()` from `FooDataSource` and `.updateFields()` from `MyFooDB`.

