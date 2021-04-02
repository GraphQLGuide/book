<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents** 

- [Supporting](#supporting)
- [Contributors](#contributors)
- [Contributing](#contributing)
  - [Text](#text)
    - [Formatting](#formatting)
    - [Setup](#setup)
  - [Site](#site)
    - [With local theme](#with-local-theme)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Supporting 

If you'd like to read the Guide, and if you can afford to purchase it or if your company reimburses you for educational materials (most do 👍), we would value your support: [https://graphql.guide](https://graphql.guide).

## Contributors

[/GraphQLGuide/book/graphs/contributors](https://github.com/GraphQLGuide/book/graphs/contributors)

Thank you to everyone who has contributed 😃🙌

## Contributing

We welcome issues and PRs! For large changes, we recommend opening an issue first to get feedback before putting in the work of a PR. Minor things like typo fixes or suggested rewordings can go directly to PRs and will usually get a quick response 😊

### Text

#### Formatting

- Use curly quotes (“ ‘ ’ ”) unless inside code blocks, in which case use straight quotes (' ")

#### Setup

If you're working on gitbook-related issues or want to see how your PR will be formatted, follow these steps to get set up after cloning:

```sh
npm i -g gitbook-cli
gitbook install
mkdir out/
cd scripts
./build.sh
```

### Site

#### With local theme

```
git clone https://github.com/GraphQLGuide/book.git
cd book/
connect-deps link ../gatsby-theme-apollo/packages/gatsby-theme-apollo-docs ../gatsby-theme-apollo/packages/gatsby-theme-apollo-core --connect --watch
```

---

[Changelog](https://github.com/GraphQLGuide/book/releases)
