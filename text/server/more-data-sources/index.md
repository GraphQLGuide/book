---
title: More data sources
description: Table of contents for the More data sources section
hasSubsections: true
---

# More data sources

* [SQL](sql.md)
  * [SQL setup](sql.md#sql-setup)
  * [SQL data source](sql.md#sql-data-source)
  * [SQL testing](sql.md#sql-testing)
  * [SQL performance](sql.md#sql-performance)
* [REST](rest.md)
* [GraphQL](graphql.md)
* [Custom data source](custom-data-source.md)

There are lots of other sources of data out there we might want to use in our GraphQL servers, and when we want to query one, we use a *data source*. When we use the term “data source” in this chapter, we’re usually talking about a JavaScript class that has Apollo’s `DataSource` class as an ancestor, like the `MongoDataSource` we [used earlier](../building/data-sources.md). There are data sources on npm that others have written, and we can write our own.

