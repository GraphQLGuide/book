---
title: Linting
---

## Linting

> If you’re jumping in here, `git checkout 26_1.0.0` (tag [`26_1.0.0`](https://github.com/GraphQLGuide/guide/tree/26_1.0.0)). Tag [`27_1.0.0`](https://github.com/GraphQLGuide/guide/tree/27_1.0.0) contains all the code written in this section.

Linters analyze code for errors without running the code—they just look at the code. [ESLint](https://eslint.org/docs/about/) is the main linter for JavaScript. It’s already being used in our app by Create React App. However, their ESLint settings just cover JavaScript—they don’t check our GraphQL queries to see if they’re valid. Let’s set that up!

First, let’s run ESLint as it’s currently set up. We have a script in our `package.json` that just runs `eslint src/`:

```sh
$ npm run lint 

> guide@0.2.0 lint /guide
> eslint src/

```

It doesn’t print out any linting errors. We can check the exit code to make sure:

```sh
$ echo $?
0
```

In Mac and Linux, each program has an **exit code**. In Bash, we can print out the last exit code with `echo $?`. An exit code of `0` means success.

### Setting up linting

To extend CRA’s linting, we need to set the `EXTEND_ESLINT` env var, which we can either do in `.env` or here:

[`package.json`](https://github.com/GraphQLGuide/guide/blob/27_1.0.0/package.json)

```js
{
  ...
  "scripts": {
    "start": "EXTEND_ESLINT=true react-scripts start",
    ...
```

The npm package `eslint-plugin-graphql` (already in our `package.json` dependencies) is an ESLint plugin that checks our GraphQL queries against a schema. We can tell ESLint to use it by modifying our config file:

[`.eslintrc.js`](https://github.com/GraphQLGuide/guide/src/components/27_1.0.0/.eslintrc.js)

```js
module.exports = {
  extends: 'react-app',
  plugins: ['graphql'],
  parser: 'babel-eslint',
  rules: {
    'graphql/template-strings': [
      'error',
      {
        schemaJson: require('./schema.json')
      }
    ]
  },
}
```

- `.eslintrc.js`: We add `.js` to the filename (formerly `.eslintrc`) so that we can use `require()`.
- `extends: 'react-app'`: Use Create React App’s rules as a base.
- `plugins: ['graphql']`: Use `eslint-plugin-graphql`.
- `schemaJson: require('./schema.json')`: Look in the current directory for the schema.

What schema? We want ESLint to validate our queries against our API’s schema—the one the `api.graphql.guide` server has, that Playground shows us in the SCHEMA tab. It makes sense that ESLint is going to need it. But how do we get it in a JSON file? Apollo has a CLI we can use to download it. It’s already in our dependencies, and its name is `apollo`. Our `update-schema` script uses it:

`"update-schema": "apollo schema:download --endpoint https://api.graphql.guide/graphql schema.json"`

So we can run `npm run update-schema`, and now we have a `schema.json`. It’s like a verbose form of what we see in the Playground SCHEMA tab, and starts with:

```json
{
  "data": {
    "__schema": {
      "queryType": {
        "name": "Query"
      },
      "mutationType": {
        "name": "Mutation"
      },
      "subscriptionType": {
        "name": "Subscription"
      },
      "types": [
        {
          "kind": "OBJECT",
          "name": "Query",
          "description": "",
          "fields": [
            {
              "name": "sections",
              "description": "",
              "args": [
                {
                  "name": "lastCreatedAt",
                  "description": "",
                  "type": {
                    "kind": "SCALAR",
                    "name": "Float",
                    "ofType": null
                  },
                  "defaultValue": null
                },
                {
                  "name": "limit",
                  "description": "",
                  "type": {
                    "kind": "SCALAR",
                    "name": "Int",
                    "ofType": null
                  },
                  "defaultValue": null
                }
              ],
```

We can see that a `__schema` has `types` that include an object with `name: "Query"` and a field named `sections`, which has args `lastCreatedAt` and `limit`. And if we scroll down, we see more familiar fields and types.

### Fixing linting errors

Now we can try running ESLint again:

```sh
$ npm run lint

> guide@0.2.0 lint /Users/me/gh/guide
> eslint src/


/Users/me/gh/guide/src/components/CurrentTemperature.js
  8:5  error  Cannot query field "weather" on type "Query"  graphql/template-strings

/Users/me/gh/guide/src/components/Profile.js
  10:5  error  Cannot query field "launchNext" on type "Query"  graphql/template-strings

/Users/me/gh/guide/src/components/Section.js
  18:7   error  Cannot query field "scrollY" on type "Section"            graphql/template-strings
  31:9   error  Cannot query field "scrollY" on type "Section"            graphql/template-strings
  47:9   error  Cannot query field "scrollY" on type "Section"            graphql/template-strings
  70:9   error  Cannot query field "scrollY" on type "Section"            graphql/template-strings
  169:11 error  Cannot query field "scrollY" on type "Section"            graphql/template-strings

/Users/me/gh/guide/src/lib/apollo.js
  41:3  error  The "Section" definition is not executable  graphql/template-strings

✖ 8 problems (8 errors, 0 warnings)

npm ERR! code ELIFECYCLE
npm ERR! errno 1
npm ERR! guide@0.2.0 lint: `eslint src/`
npm ERR! Exit status 1
npm ERR!
npm ERR! Failed at the guide@0.2.0 lint script.
npm ERR! This is probably not a problem with npm. There is likely additional logging output above.

npm ERR! A complete log of this run can be found in:
npm ERR!     /Users/me/.npm/_logs/2019-03-04T01_50_08_741Z-debug.log
```

We get a lot of errors! And we can see that the exit code is no longer `0`: 

```
npm ERR! code ELIFECYCLE
npm ERR! errno 1
npm ERR! guide@0.2.0 lint: `eslint src/`
npm ERR! Exit status 1
```

`Exit status 1` means that the exit code of the command `eslint src/` was `1`.

Let’s go through the errors. First up:

```
/Users/me/gh/guide/src/components/CurrentTemperature.js
  80:5  error  Cannot query field "weather" on type "Query"  graphql/template-strings
```

which is referring to:

[`src/components/CurrentTemperature.js`](https://github.com/GraphQLGuide/guide/blob/27_1.0.0/src/components/CurrentTemperature.js)

```js
const TEMPERATURE_QUERY = gql`
  query TemperatureQuery {
    weather(lat: $lat, lon: $lon)
      @rest(
        type: "WeatherReport"
        path: "weather?appid=4fb00091f111862bed77432aead33d04&{args}"
      ) {
      main
    }
  }
`
```

ESLint is looking at our `schema.json` and not finding `weather` as a top-level Query field. Of course it’s not! `weather` isn’t part of the Guide API—it’s from our [weather REST API](rest.md). So we don’t want this query linted against the schema. We can tell ESLint to ignore this file by adding `/* eslint-disable graphql/template-strings */` to the top of the file. Now if we re-run `npm run lint`, we no longer see that error. 

Seven errors left to go! The next is:

```
/Users/me/gh/guide/src/components/Profile.js
  10:5  error  Cannot query field "launchNext" on type "Query"  graphql/template-strings
```

`launchNext` is from our query to the SpaceX API, which of course has a different schema from the rest of our queries. So far we’ve only told ESLint about `schema.json`, the Guide API schema. But `eslint-plugin-graphql` does support multiple schemas. It determines what strings to parse as GraphQL by the template literal tag name (`gql`). We can use a different tag name for the SpaceX query and have that tag be checked against a different schema. Let’s use `spaceql` instead of our current `gql`:

[`src/components/Profile.js`](https://github.com/GraphQLGuide/guide/blob/27_1.0.0/src/components/Profile.js)

```js
import { gql as spaceql } from '@apollo/client'

const LAUNCH_QUERY = spaceql`
  query LaunchQuery {
    launchNext {
      details
      launch_date_utc
      launch_site {
        site_name
      }
      mission_name
      rocket {
        rocket_name
      }
    }
  }
`
```

And we update the config file:

[`.eslintrc.js`](https://github.com/GraphQLGuide/guide/blob/27_1.0.0/.eslintrc.js)

```js
module.exports = {
  extends: 'react-app',
  plugins: ['graphql'],
  parser: 'babel-eslint',
  rules: {
    'graphql/template-strings': [
      'error',
      {
        schemaJson: require('./schema.json')
      },
      {
        tagName: 'spaceql',
        schemaJson: require('./spacex.json')
      }
    ]
  }
}
```

We added this object:

```
{
  tagName: 'spaceql',
  schemaJson: require('./spacex.json')
}
```

Which says, “for any GraphQL document created with the template literal tag name `spaceql`, validate it against the schema located in `spacex.json`.” We can get `spacex.json` with `npm run update-schema-spacex`:

```
  "update-schema-spacex": "apollo schema:download --endpoint https://api.spacex.land/graphql spacex.json"
```

And now when we lint, we get one fewer error ✅. The next set of errors is:

```
/Users/me/gh/guide/src/components/Section.js
  18:7   error  Cannot query field "scrollY" on type "Section"            graphql/template-strings
  31:9   error  Cannot query field "scrollY" on type "Section"            graphql/template-strings
  47:9   error  Cannot query field "scrollY" on type "Section"            graphql/template-strings
  70:9   error  Cannot query field "scrollY" on type "Section"            graphql/template-strings
  169:11 error  Cannot query field "scrollY" on type "Section"            graphql/template-strings
```

`scrollY` is the piece of [local state](local-state.md) in our Section queries:

[`src/components/Section.js`](https://github.com/GraphQLGuide/guide/blob/27_1.0.0/src/components/Section.js)

```js
const NEXT_SECTION_QUERY = gql`
  query NextSection($id: String!) {
    section(id: $id) {
      id
      next {
        id
        content
        views
        scrollY @client
      }
    }
  }
`
```

Since `scrollY` is local, ESLint won’t find it in the Guide API schema. We can suppress the error by adding this line to the top of the file:

```js
/* eslint-disable graphql/template-strings */
```

Lastly, we have:

```
/Users/me/gh/guide/src/lib/apollo.js
  41:3  error  The "Section" definition is not executable  graphql/template-strings
```

This refers to the `Section` in our local state schema:


```js
const typeDefs = gql`
  extend type Section {
    scrollY: Int
  }
`
```

Instead of `eslint-disable`-ing the whole file, let’s just disable part of it. That way, if we later add a document to a different part of the file, it will be linted.

[`src/lib/apollo.js`](https://github.com/GraphQLGuide/guide/blob/27_1.0.0/src/lib/apollo.js)

```js
/* eslint-disable graphql/template-strings */
const typeDefs = gql`
  extend type Section {
    scrollY: Int
  }
`
/* eslint-enable graphql/template-strings */
```

Now when we lint, we don’t see an error, and we get a successful exit code 😊.

```sh
$ npm run lint

> guide@1.0.0 lint /Users/me/gh/guide
> eslint src/

$ echo $?
0
```

### Using linting

Usually people don’t manually run `npm run lint` on the command line. Instead, they set up one or more of the following, which all automatically run the linter:

- [Editor integration](#editor-integration)
- [Pre-commit hook](#pre-commit-cook)
- [Continuous integration](#continuous-integration)

#### Editor integration

Most editors have a linting plugin. VSCode has this [ESLint plugin](https://github.com/Microsoft/vscode-eslint). It looks for a configuration file in the current workspace (for us it would find `.eslintrc.js`) and runs ESLint in the background whenever we type something new into the editor. For instance, if we type in `first` as a field of `currentUser`, it is underlined:

![ESLint underlining error in VSCode](../img/eslint-vscode.png)

And if we hover over the word, we see the linting error:

![ESLint error message tooltip](../img/eslint-vscode-tooltip.png)

> Cannot query field "first" on type "User". Did you mean "firstName"?

Since ESLint has the schema, it knows that `currentUser` resolves to a `User`, and that `first` isn’t one of the fields of the `User` type. When we change it to `firstName`, the error underline goes away.

Some linting errors have automatic fixes, and we can have the plugin make those fixes whenever we save the file by enabling this setting:

```
"eslint.autoFixOnSave": true
```

#### Pre-commit hook

Git has [a lot of hooks](https://git-scm.com/docs/githooks)—times when git will run a program for you. One such hook is pre-commit. A pre-commit hook will be called when a dev enters `git commit` and before git actually does the committing. If the hook program ends with a non-zero exit code, the commit will be canceled. The best way to set up git hooks in our project is with [Husky](https://github.com/typicode/husky). To do that, we would:

```
npm install husky --save-dev
```

And add to our `package.json`:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run lint"
    }
  }
}
```

Then if we tried to commit but `npm run lint` failed, the commit would be canceled, and we would see the ESLint output with the problem(s) we need to fix. 

#### Continuous integration

Background: [Continuous integration (CI)](../background/continuous-integration.md)

Our CI server can do `npm run lint` as one of its tests, prevent deployment if linting fails, display a build failure symbol next to the commit or PR, and link to its site where we can view the error output.

