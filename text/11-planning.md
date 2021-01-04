> If you’re jumping in here, `git checkout 25_0.1.0` (tag [25_0.1.0](https://github.com/GraphQLGuide/guide-api/tree/25_0.1.0), or compare [25...26](https://github.com/GraphQLGuide/guide-api/compare/25_0.1.0...26_0.1.0))



TODO 
- server as thin layer
- graphql get-schema -e http://localhost:4000 -o /tmp/guide.graphql





MORE TOPICS
  
prisma

* AWS appsync ?
https://egghead.io/courses/scalable-offline-ready-graphql-applications-with-aws-appsync-react
https://twitter.com/dermambo/status/1062694310901096448?s=11
https://medium.com/open-graphql/graphqlifying-rest-5a95d57a04c2
* mongodb stitch?
https://youtu.be/q9OP7Hy_nZA?t=1132

- typescript (react chapter?)
- continuous integration

- documentation
- https://github.com/OneGraph/graphql-codex/
- mesh: https://medium.com/the-guild/graphql-mesh-query-anything-run-anywhere-433c173863b5

# extra

PRO ORIGINAL
- SSR
- Offline data & mutations
- serverless
- stripe integration

PRO REVISED
- 

FULL ORIGINAL
- using github api
- schema stitching
- rate limiting
- caching w/ redis

FULL REVISED
- using github api
- custom schema directives

graphql mesh? https://medium.com/the-guild/graphql-mesh-query-anything-run-anywhere-433c173863b5
* serverless?
https://khalilstemmler.com/articles/tutorials/deploying-a-serverless-graphql-api-on-netlify/

* elasticsearch?

* Stitching CANCELED

(The [schema stitching](stitching.md) chapter is included in the [Full package](https://graphql.guide/#pricing) of the Guide.)

types of stitching / gateways: https://tomasalabes.me/blog/graphql/node/microservices/2018/08/11/graphql-architectures.html



APOLLO SURVEY

When do you push a schema update to the registry?
Manually, when I feel like it
Manually, whenever it changes
Automatically, on every code merge
Automatically, on code deploys
Automatically, from the server

How do you validate that schema changes will not break existing clients?
We do not validate schema changes
We run a service:check on every PR (in CI)
We run a service:check manually
We run a service:check before deploys
We involve experts to review complicated changes

How do you inform affected teams about schema updates?
We have a bot that notifies everyone
We have a bot that notifies specific people
We post / email internally about changes
People check the schema registry on their own
We do not inform about changes
I don't know

If you've automated schema registry pushes (i.e. apollo service:push), check all of the following that apply:
It was harder to set up than we expected
Documentation was very helpful
Automated updates have provided a lot of value

How do you push your schema?
We introspect our remote schema
We introspect a locally running server
We use local schema files
We have an internal script that does several different things (potentially including the above)

How do you run schema change validation? (i.e. apollo service:check)
We introspect our remote schema
We introspect a locally running server
We use local schema files
We have an internal script that does several different things
We never run this

Tracking Schema Changes
How does your team propose new schema changes?
Using a pull request RFC
Using a pull request (with implementation)
Using our internal document system (e.g. Google docs)
Using our messaging tool (e.g. Slack)
Using our ticketing system (e.g. Jira, Trello)
These are part of the product spec
We do not have a process for this

How do you review schema changes?
We have internal policies that must be followed
We have meetings to review schema changes
No removals or changes to existing fields are allowed
We run automatic checks to verify rules (e.g. linting, naming)
We don't have a process for reviewing schema changes

How many times have you unintentionally shipped breaking changes to your schema?
That has never happened
It's happened a few times
It's happened several times and it's a problem
It happens often, but it's not a priority
I don't know

How do you keep track of schema history?
We do not track schema history
We use a cloud schema registry (e.g. apollo service:push)
We use git
I don't know

Which best describes your schema design process?
Multiple people participate in brainstorming before implementation begins
We build it and design it concurrently, across teams
We build it and design it concurrently, within one team
One person owns the end-to-end process
We do not have a process

Do you have continuous delivery (CD) set up for your GraphQL server(s)? (i.e. merges to a branch cause deploys)

Is there a way to run code upon complete deployment of your GraphQL server? (i.e. a post-deploy "hook")





--------------------



GitHub `star` webhook
https://developer.github.com/webhooks/

EXPRESS

```js
import { ApolloServer, gql } from 'apollo-server-express'
import express from 'express'

const app = express()

server.applyMiddleware({ app, path: '/' })

app.listen({ port: 4000 }, () =>
  console.log(`GraphQL server running at http://localhost:4000`)
)
```


NOW


`now.json`

```json
{
  "name": "guide-api",
  "version": 1,
  "regions": ["sfo1"],
  "env": {
    "SECRET_KEY": "@create-user-secret-key",
    "GITHUB_TOKEN": "@github-api-token",
    "MONGO_URL": "@mongo-url"
  }
}
```


https://guide-api-wbfuqbezeo.now.sh

Error: GraphQL Error (Code: 401): {"response":{"message":"Bad credentials","documentation_url":"https://developer.github.com/v4","status":401},"request":{"query":"\nquery GuideStars {\n  repository(owner: \"GraphQLGuide\", name: \"guide\") {\n    stargazers {\n      totalCount\n    }\n  }\n}\n"}}
2019-10-28T20:31:59.974Z      at GraphQLClient.<anonymous> (/home/nowuser/src/node_modules/graphql-request/dist/src/index.js:116:35)

now secrets add github-api-token "XXX"
now secrets add create-user-secret-key "XXX"
now secrets add mongo-url "XXX"


