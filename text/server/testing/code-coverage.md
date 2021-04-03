---
title: Code coverage
---

## Code coverage

> If you’re jumping in here, `git checkout 21_0.2.0` (tag [21_0.2.0](https://github.com/GraphQLGuide/guide-api/tree/21_0.2.0), or compare [21...22](https://github.com/GraphQLGuide/guide-api/compare/20_0.2.0...22_0.2.0))

Jest analyzes *code coverage*—how much of our code gets run during our tests—with the `--coverage` flag. We can look at code coverage to see which parts of the code aren’t covered by tests, so that we know what our new tests should cover. 

Let’s update our test script:

[`package.json`](https://github.com/GraphQLGuide/guide-api/compare/21_0.2.0...22_0.2.0)

```js
{
  ...
  "scripts": {
    ...
    "test": "jest --coverage",
    "open-coverage": "open coverage/lcov-report/index.html"
  },
```

When `jest --coverage` runs, it both logs statistics and updates the coverage report, which is located in the `coverage/` directory. We can now do `npm run open-coverage` for opening the HTML report. We can run jest without coverage with:

```sh
$ npx jest
``` 

Or to keep it open, re-running tests whenever we edit our code:

```sh
$ npx jest --watch
```

Or to keep it open with code coverage, one of these commands:

```sh
$ npx jest --coverage --watch
$ npm test -- --watch
```

> `--` after an npm script tells npm to apply the subsequent arguments to the script.

We should tell git to ignore the generated `coverage/` report directory:

[`.gitignore`](https://github.com/GraphQLGuide/guide-api/compare/21_0.2.0...22_0.2.0)

```
node_modules/
dist/
.env
coverage/
```

And we need to tell Jest which JavaScript files it should analyze coverage for, using the `collectCoverageFrom` config:

[`jest.config.js`](https://github.com/GraphQLGuide/guide-api/compare/21_0.2.0...22_0.2.0)

```js
module.exports = {
  moduleDirectories: ['node_modules', path.join(__dirname, 'test')],
  collectCoverageFrom: ['src/**/*.js']
}
```

Here’s the new output of `npm test`:

![Jest with coverage statistics](../../img/coverage-bash.png)

We see the coverage overall, for each directory, and each JS file, in percentage of statements, logic branches, functions, and lines. To see which lines of code are covered, we can view the HTML report:

```sh
$ npm run open-coverage
```

![Coverage report overview HTML page](../../img/coverage-web.png)

And follow links to a particular file we’d like to look at, like `src/index.js`:

![Coverage report for src/index.js](../../img/coverage-index.png)

The red highlighted code shows what wasn’t run during the test. Anything at the top level was run, like the imports, `ApolloServer` instance creation, and the if statement condition, but the body of the if statement—and the body of the start function, which wasn’t called—wasn’t run and thus is red. The highlighting isn’t perfect—notice that `.listen` and `.then` should also be red but aren’t.

If we want to make sure that contributors to our project write tests that cover new code, we can set a minimum coverage threshold, below which the test command will fail. We can set it for any statistic—statements, branches, functions, or lines—and either globally or for individual files. Let’s set a global statement threshold of 40%:

[`jest.config.js`](https://github.com/GraphQLGuide/guide-api/compare/21_0.2.0...22_0.2.0)

```js
module.exports = {
  moduleDirectories: ['node_modules', path.join(__dirname, 'test')],
  collectCoverageFrom: ['src/**/*.js'],
  coverageThreshold: {
    global: {
      statements: 40
    }
  }
}
```

Now the test will fail whenever the code coverage statement ratio is below 40%. We’re currently below 40%, so when we re-run `npm test`, it fails:

![global coverage threshold for statements (40%) not met: 34.39%](../../img/coverage-below-threshold.png)

