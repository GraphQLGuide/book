---
title: Node, npm, and nvm
---

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

