## Static testing

> If you’re jumping in here, `git checkout 19_0.2.0` (tag [19_0.2.0](https://github.com/GraphQLGuide/guide-api/tree/19_0.2.0), or compare [19...20](https://github.com/GraphQLGuide/guide-api/compare/19_0.2.0...20_0.2.0))

Static testing is done through linting, a type of static code analysis. It’s called *static* because, unlike the tests we write code for, no code is being run during static testing—instead, a tool analyzes the code for certain types of mistakes that can be found by just looking at the code and not running it. One such mistake is when we use a variable without declaring it. In JavaScript, the main tool for static analysis is [ESLint](https://eslint.org/docs/about/), and here’s a [list of possible *rules*](https://eslint.org/docs/rules/)—things it can analyze that we can choose to disallow in our code. 

We have `eslint` and `eslint-plugin-node` installed as dev dependencies, so all we need to do is configure ESLint:

[`.eslintrc.js`](https://github.com/GraphQLGuide/guide-api/blob/20_0.2.0/.eslintrc.js)

```js
module.exports = {
  env: {
    es6: true,
    node: true
  },
  extends: 'plugin:node/recommended',
  parserOptions: {
    sourceType: 'module'
  }
}
```

`env` says that we’re using ES6 in Node.js, `extends` says to use `eslint-plugin-node`’s set of recommended linting rules, and `sourceType: 'module'` means that we’re using modules. We can add an npm script for linting:
 
[`package.json`](https://github.com/GraphQLGuide/guide-api/compare/19_0.2.0...20_0.2.0)

```js
{
  ...
  "scripts": {
    ...
    "lint": "eslint src/"
  }
}
```

When we try it out (`npm run lint`), we get errors saying:

```
error  Import and export declarations are not supported yet  node/no-unsupported-features/es-syntax
```

It’s warning us that using the keywords `import` and `export` in our code won’t work because it’s not supported by node. Our code actually does work, because we’re using babel. So let’s disable this rule (the name of the rule is printed at the end):

[`.eslintrc.js`](https://github.com/GraphQLGuide/guide-api/blob/20_0.2.0/.eslintrc.js)

```js
module.exports = {
  ...
  rules: {
    'node/no-unsupported-features/es-syntax': 0
  }
}
```

Now when we do `npm run lint`, it succeeds—no errors are found.

A common practice is setting up linting to occur as a *pre-commit hook*—that is, a command that will automatically be run whenever we enter `git commit`, and if the command fails, the commit will be canceled. The easiest way to set this up is with [husky](https://github.com/typicode/husky), one of our dev dependencies, which simply uses a `package.json` attribute:

[`package.json`](https://github.com/GraphQLGuide/guide-api/compare/19_0.2.0...20_0.2.0)

```json
{
  ...
  "husky": {
    "hooks": {
      "pre-commit": "npm run lint"
    }
  }
}
```

Now if we commit, we see that `eslint src/` is run before the commit happens:

```sh
$ git commit -m 'Set up linting'
husky > pre-commit (node v8.11.3)

> guide-api@0.1.0 lint /guide-api
> eslint src/

[20 bfe4bf1] Set up linting
 2 files changed, 21 insertions(+), 1 deletion(-)
 create mode 100644 .eslintrc.js
```

