## Schema design

* [One schema](#one-schema)
* [User-centric](#user-centric)
* [Easy to understand](#easy-to-understand)
* [Easy to use](#easy-to-use)
* [Mutations](#mutations)
  * [Arguments](#arguments)
  * [Payloads](#payloads)
* [Versioning](#versioning)

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

The first principle of schema design is there should only be one schema! While we can *implement* it as smaller schemas and a [federation gateway](apollo-federation.md), from the perspective of the client, there should only be one schema (or *data graph*). And while this may seem obvious, there are many large companies whose GraphQL adoption began by independent teams creating their own GraphQL APIs. This results in a lot of duplication of effort—not only duplicated resolvers where the schemas overlap, but also management of the APIs. We also might wind up with clients that need to make requests from two separate endpoints, which our frontend devs might find... inconvenient 😄. Which brings us to the first principle of design in general, which is:

### User-centric

**Design things for the people who will be using them.**

The people who will be using our schema are primarily our frontend devs (or, in the case of a public API, the world’s frontend devs 😊), so we want to design the schema for them. We want our API to be:

- Easy to understand. 
- Easy to use. 
- Hard for devs to make mistakes or create bugs when querying.

Secondarily, our schema is used by our end users (the people using the software written by the frontend devs) and ourselves (the backend devs). For our end users, we take into consideration things like latency (maybe having a single mutation that did two things would get results to the user faster than two mutations that had to be executed serially) or the clarity of error types. For ourselves, we take into consideration how difficult our schema will be to run, secure, and update. For instance, we might decide not to include a query field that would take too much server resources to resolve. Or we might structure parts of the schema to make it easier to add fields later on.

Once we’ve read this section, we can have a meeting with our frontend devs, UX designers, product managers, etc., to create:

- The core types and queries, based on what data the frontend needs.
- Mutations, based on the user action flows. 

We do *not* want to start writing the schema based on backend implementation / naming / structure / tech details. It shouldn’t look like our REST APIs or mirror our database tables.

> One good option for how to structure your schema creation meeting is event storming, a process from [domain-driven design](https://en.wikipedia.org/wiki/Domain-driven_design) described in [this article](https://khalilstemmler.com/articles/graphql/ddd/schema-design/).

Our schema also shouldn’t be perfect or comprehensive. It should only cover the use cases for which it’s needed right now—we shouldn’t design it based on hypothetical future requirements:

> Fields shouldn’t be added to the schema speculatively. Ideally, each field should be added only in response to a concrete need by a consumer for additional functionality, while being designed for maximum reuse by other consumers that have similar needs.
>
> Updating the graph should be a continuous process. Rather than releasing a new “version” of the graph periodically, such as every 6 or 12 months, it should be possible to change the graph many times a day if necessary. New fields can be added at any time. To remove a field, it is first deprecated, and then removed when no consumers use it.
> —[Principled GraphQL](https://principledgraphql.com/agility)

### Easy to understand

We want others to be able to understand our schema just by reading it. We don’t want them to read it, not fully get it, and then have to talk to us or learn through trial and error. Ideally we don’t even want them to have to read schema descriptions—just the types themselves. It’s the same reason why it’s easier to understand readable code than commented code. For example:

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

The `if` statement condition is complicated and not *readable* (i.e., we don’t immediately understand what it means by glancing at it), so we read the comment above it to learn what the `if` statement does. In the below code, however, we can just read it:

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

While this is many more lines of code, that’s not as important as readability. And all we need to read now is `if (!user.isAllowedToDrink())`, which is readily understandable. At most, we may need to mentally move the location of the “not” from “if not user is allowed to drink” to “if user is not allowed to drink.“

For a schema example of this concept, let’s imagine we were building an online store, and we had this mutation:

```gql
type Mutation {
  add(productId: ID!): Cart
  checkout: Order
}
```

Then we realized that while people could probably infer the `add` mutation meant add a product to the cart (given the argument name and return type), it would be clearer if we added a field description:

```gql
type Mutation {
  # add product to cart
  add(productId: ID!): Cart
  checkout: Order
}
```

While the new “add product to cart” description now appears in Playground autocomplete (and in the DOCS tab after clicking `add`), it has a couple downsides:

- It takes us another step to look for and read the description, versus just reading the field name.
- When we read a query document in the client code, we only see the mutation name—not the description.

We can remove the need for a comment by making the mutation name clearer:

```gql
type Mutation {
  addProductToCart(productId: ID!): Cart
  checkout: Order
}
```

Readability starts with giving clear names to things. In this case, it was giving a full, specific name—not just `add` or `addProduct`, but `addProductToCart`. Here are a few more examples of specificity:

- Instead of just a `Review` type, use `ProductReview`. Then schema readers know what the review is for, and in the future, we can add other review types, like `StoreReview`, without causing confusion.
- If we have two types of reviews, we shouldn’t try to fit them both into a single type. Instead of `Review`, with the 3rd field for product reviews and the 4th and 5th fields for store reviews, we should have two types with different fields:

```gql
# ✘
type Review {
  id: ID!
  stars: Int!
  productReviewText: String
  storeDeliveryRating: Int
  storeCustomerSupportRating: Int
}

# ✔︎
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

And if we want to handle them together, we could have them both implement a `Review` interface and reference it:

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
# ✘
type Query {
  user(fields: UserFieldInput): User!
}

input UserFieldInput {
  id: ID
  username: String
}

# ✔︎
type Query {
  userById(id: ID!): User!
  userByUsername(username: String!): User!
}
```

- The Guide schema uses a `Date` type for milliseconds since epoch. However, it would be more specific to call it a `DateTime`, since it includes both the date and the time. That would allow us to add `Date` (e.g., `1/1/2000`) and `Time` (e.g., `13:37`) types in the future. It would also be clearer for devs who are used to systems that handle both Dates and DateTimes.

Using specific naming is part of a broader category of being explicit—we want to know what fields and types mean, how to use them, and how they behave, without guessing or trial and error. Here are a few further areas in which we can be explicit:

- Using custom scalars instead of default scalars. Instead of `createdAt: Int`, `createdAt: DateTime`. Instead of `phone: String`, `phone: PhoneNumber`. It explicitly shows what type of value it is, and we can trust that the [custom scalar code](building/custom-scalars.md) will validate `DateTime`s and `PhoneNumber`s wherever they’re used in the schema.
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

- Use non-null (`!`) to explicitly denote which values will always be returned, or which arguments are required. However, in some cases it’s better to not use it:
  - If clients use multiple root query fields in a single document, then leave them all nullable, because if one is non-null and null is returned (e.g., due to an error), it will [null cascade](building/errors.md#nullability) all the way up to a `{ "data": null }` response, which will prevent the client from receiving the other root query fields.
  - If there’s any chance a field will occasionally not be available, for instance a `User.githubRepositories` field whose resolver relies on the GitHub API being accessible, make it null. We do this so that when we can’t reach the GitHub API (their servers are down, or there’s a network issue, or we hit our API quota, for example), queries for user data can receive the other fields.
- Build expected errors into the schema. Then devs will know what error responses look like and will be able to handle them more easily than if they were in the `"errors"` JSON response property.
  - In the below [Mutations](#mutations) section, we’ll include expected errors in the response type.
  - Earlier in the [Union errors](#union-errors) section, we included deleted and suspended users in the search results:

```gql
type Query {
  searchUsers(term: String!): [UserResult!]!
}

union UserResult = User | DeletedUser | SuspendedUser
```

  - We can also prevent errors from happening with our schema structure. For instance, if there are some queries that are public and some for which the client must be logged in, we can prevent them from them receiving unauthorized errors by having the public queries as root fields and the logged-in queries as `Viewer` fields:

```gql
# ✘
type Query {
  me: User
  teams: [Team]

  # must be logged in
  projects: [Project]

  # must be logged in
  reports: [Report]
}

# ✔︎
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

Only when we can’t make a meaning or behavior explicit should we add a description to the schema.

Lastly, a couple more things that are helpful for readability: 

- Consistency in naming. For instance, how we name queries for a single item versus a list:

```gql
# ✘
type Query {
  project(id: ID): Project
  projects: [Project]

  getReport(id: ID): Report
  listReports: [Report]
}

# ✔︎
type Query {
  project(id: ID): Project
  projects: [Project]

  report(id: ID): Report
  reports: [Report]
}
```

Or the verbs we use with mutations:

```gql
# ✘
type Mutation {
  deleteProject(id: ID): DeleteProjectPayload
  removeReport(id: ID): RemoveReportPayload
}

# ✔︎
type Mutation {
  deleteProject(id: ID): DeleteProjectPayload
  deleteReport(id: ID): DeleteReportPayload
}
```

- Grouping fields into sub-objects: When a group of fields are related, we can create a new object type. Imagine our reviews had comments that rated the helpfulness of the review:

```gql
# ✘
type Review {
  id: ID!
  text: String!
  stars: Int
  commentCount: Int!
  averageCommentRating: Int
  averageCommentLength: Int
}

# ✔︎
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

While ease of use is determined largely by ease of understanding, there are other factors that can contribute:

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

If the client wants the whole review text in a sentence like that, they could construct it themselves by querying for all the pieces of information and putting it together. Instead, we do it for them, saving them the effort. Similarly, if our clients often want the total comment count, we can include that in the connection so they don’t have to do the work of requesting all the comments and counting them:

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

Or, if we have a purchasing app where orders have complex states and business logic, we could include a `readyForSubmission` field so the client doesn’t have to write the logic code:

```gql
type Order {
  id: ID!
  ...
  readyForSubmission: Boolean!
}
```

- Make fields easy to use. For instance when dealing with money, fractional amounts are often more difficult to work with than integers, so we can provide `Int` fields:

```gql
# ✘
type Charge {
  dollars: Float!
}

# ✔︎
type Charge {
  cents: Int!
}
```

- If we have a public API for third parties, then we can make their integration easier by supporting their preferred libraries. In the case of GraphQL, the only common library with schema requirements is Relay. The [list of requirements](https://relay.dev/docs/en/graphql-server-specification.html) includes the cursor connections we [discussed earlier](pagination.md#relay-cursor-connections), a particular structure to mutations, and a common `Node` interface for object types:

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

As with the rest of the schema, the first thing to think about for mutations is their names. While some choose to do `typeVerb` (like `reviewCreate`, `reviewUpdate`, and `reviewDelete`) so that GraphiQL’s alphabetical schema docs will group mutations by type, we recommend the more readable `verbType`: `createReview`, `updateReview`, and `deleteReview`. And, as mentioned before, we recommend verb consistency—so for example, using `deleteUser` instead of `removeUser` to match `deleteReview`.

However, we don’t recommend uniformly implementing `create|update|delete` mutations for each type. Instead, provide mutations according to the needs of the client—which actions will they be performing? In some cases, types are never deleted, or they’re created automatically, or the update step should be named something else or should happen in stages. For instance, imagine a store checkout process in which the server needs to do something (save data, validate, talk to an API, etc.) for each of these steps:

- Create a cart.
- Add products to the cart.
- Apply a coupon code.
- Add shipping address.
- Add payment information.
- Submit order.

We could have the client use `createCart` for the first step and a single generic `updateCart` mutation for each of the rest. (First they’d call `updateCart(productId)`, and then `updateCart(couponCode)`, etc.) However, it would require a large amount of optional arguments, and we would have to write a long field description telling the dev which arguments to use in which order. Instead, we should write multiple mutations with specific names:

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

- For most of the mutations, we end with `ToCart` to be specific. Just `addProducts` could be adding them to a wishlist, or `addPayment` could be adding a payment method to your account. And if there’s anything besides a cart to which a coupon might be applied in the future, we should change `applyCoupon` to `applyCouponToCart`!
- We do `addProductsToCart` instead of the singular `addProductToCart` in case the client might want to add multiple products at a time (it’s easier to send a single mutation with an array of IDs than a single-ID mutation many times).

#### Arguments

The most common pattern for mutation arguments is a single input object type. Some people choose to instead have a two-argument limit, when one argument is an ID, like this:

```gql
type Mutation {
  applyCoupon(cartId: ID!, coupon: String!): Cart!
  addShippingAddressToCart(cartId: ID!, address: AddressInput!): Cart!
}
```

A couple benefits of a single argument are:

- The mutation is more readable with a single input object than with a long list of scalars and input objects.
- The input object is more evolvable (we can’t deprecate an argument, but we can deprecate an input object field).

Here are a few more considerations when it comes to mutation arguments:

- Earlier we recommended creating specific scalar types over using built-in generics, but we may want to avoid that for mutation arguments. If we use our own scalar types, then the client may have to go through two requests to discover all the errors. If there are errors in both the scalar validation (for instance, an invalid phone number) and in the business logic (for instance, the order size is too large), then the client’s first request will only receive the validation error. When they send a second request with a fixed phone number, they’ll receive the business logic error. We can improve the client’s experience by allowing them to receive all errors at once, which we do by using `String` instead of our own `PhoneNumber` scalar, and doing both the phone number validation and the business logic checks in our resolver code. Then our resolver can return all the errors together. We also have more flexibility on how we return the error—a scalar validation error shows up in the `"errors"` attribute of the JSON response, whereas in our resolver, we can either throw an error *or* return an error—an option we’ll see in the next section.
- The client can generate and provide a unique `clientMutationId` for mutations they want to make sure are *idempotent*—that don’t get executed multiple times. For instance, if the client sent the below mutation and then lost internet connection and resent, the server could receive the mutation a second time once the connection is back. To avoid this issue, our server code could check to see if the `clientMutationId` on the second mutation matches the first. If it does, our code won’t process the second mutation.

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

- While it’s tempting to [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) our code by sharing input types between create and update mutations, we don’t recommend it. We have to use at least one non-null field for the ID (since it’s not used during creation), and we have to make all fields non-null if we want to be able to provide the update mutation with just the fields we want to change. However, doing that removes the clarity around which fields are required when creating.

```gql
# ✘
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

# ✔︎
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

So far our mutations have been returning the object they alter or throwing errors. For instance, `createReview` might return a `Review` object or throw an `InputError` that’s serialized in the response JSON’s `"errors"` attribute. However, there are a couple issues with this:

- Returning a single type is inflexible—what if multiple types are altered during the mutation, or we want to provide the client with more information about how the mutation went?
- As we discussed in [Union errors](building/errors.md#union-errors), it’s better to return expected errors than to throw them: It’s easier for client code to handle, and it documents the possible errors and their associated data (whereas thrown errors like the [`InputError` we created](building/errors.md#custom-errors) are undocumented / do not appear in the schema).

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

When we create a review, our `User.reviews` changes. We can include the user in the payload so that the client can easily update their cached user object. We make both the `review` and `user` optional because we might instead return `errors`. The client’s operation would look like:

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

In cases when the mutation alters an unknown set of types, we can use the Query type to allow the client to get back whatever data they’d like after the mutation is complete:

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

Most APIs change over time. We can deploy *backward-compatible* changes at any time. We usually try to avoid making *breaking* changes, i.e., changes that may break client code using that part of the API. However, sometimes we want to make a breaking change because it would be a significant improvement. If our API is only used by our clients, and all our clients are web apps, then we can publish a new version of the client at the same time as a breaking API change, and we can force all the currently loaded webpages (now out of date) to reload, and nothing will be broken. However, if we don’t want to force-reload our web app, or if we have mobile apps (which we can’t force-reload), or if we have a public API (which is used by third parties, whose code we don’t have control over), then we have two options:

- **Global versioning**. Publish a new version of the API at a different URL, like `api.graphql.guide/v2/`. Then clients using the original URL will continue to work.
- **Deprecation**: 
  - Add a deprecation notice so that, going forward, devs don’t use the field.
  - Notify existing API consumers of the deprecation so they can change their code.
  - Monitor the usage of the field.
  - When the field usage falls under a tolerable threshold (number of will-be-broken requests), remove it.

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

While only the deprecation option includes making the breaking change as a step, it usually eventually happens for global versioning as well. There is always a cost of maintaining the old code—whether the code is backing an earlier global version or a deprecated field—and at some point, that cost outweighs the cost of breaking old clients. For instance, we could have a globally versioned API that’s currently on version 5, and almost all of the clients are using v2–v5, and we decide that we’d rather break the few clients still using v1 than continue maintaining it.

We recommend using the deprecation process (also called **continuous evolution**) in lieu of versioning. The downside of deprecating is the schema can get cluttered with deprecated fields. The downside of versioning is the large cost of maintaining old server versions and the increased time it takes to make changes. Given the complexity of deploying and maintaining a new version of the API, we batch changes and create new versions infrequently, whereas we can deprecate at any time.

There are a few reasons why continuous evolution is the better practice compared to versioning, which was common with REST APIs:

- Adding is backward compatible. With REST APIs that don’t have control over what data is returned from an endpoint, any changes, even returning more data than the client expects, can be breaking. With GraphQL APIs, adding a new field doesn’t affect current clients—they only receive the fields specified in their query document.
- Deprecation is built into the GraphQL spec, and GraphQL tooling will show developers when they’re using a deprecated field, so clients will update their code more easily and sooner.
- Since all the fields requested are in the query document, we can know how many clients are using deprecated fields. If we added a `fullName` field to the user REST endpoint, we wouldn’t know how many clients were still using the `name` field. With GraphQL, we know!

We can currently deprecate fields and enum values, and deprecating arguments and input fields will likely be added to the spec in the near future.

We deprecate a field instead of removing it because removing a field is a breaking change. But there are other breaking changes to watch out for as well:

- Removing fields, enum values, union members, or interfaces.
- Changing the type of a field.
- Making an argument or input field non-null.
- Adding a new non-null argument or input field.
- Making a non-null argument nullable.
- Changing a field from non-null to nullable isn’t automatically breaking, but if the server ever does return null for that field, the client can break.

Finally, it’s possible to break clients by adding new enum values, union members, and interface implementations if the client logic depends on all the data they receive fitting their (outdated) set of values/members/implementations. Ideally, clients will always leave open the possibility that those things could be added.

