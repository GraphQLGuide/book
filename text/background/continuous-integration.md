---
title: Continuous integration
---

# Continuous integration

While continuous integration (CI) technically means merging to `master` frequently, in modern web development it usually means the process of tests being run automatically on each commit. It’s often done with a service like [CircleCI](https://circleci.com/) that monitors our commits on GitHub, runs the tests, and provides a webpage for each commit where we can view the test output. We can also set it up to do something after the test, such as:

- Mark a pull request as passing or failing the tests.
- Mark that commit as passing or failing by adding a red X or green checkmark next to the commit in the repository’s history.
- If successful, deploy the code to a server—for example the staging or production server.

When the last step is included, the process may also be called continuous delivery or continuous deployment.

