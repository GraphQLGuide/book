---
title: React
---

# React

[React](https://reactjs.org/) was released by Facebook in 2013, and it has since steadily increased in popularity, surpassing Angular in GitHub stars in 2016 to become the most popular JavaScript view library. (And while Vue passed React in star count in 2018, React had 5x the number of npm downloads at the time of writing.) React continues to be developed by a team at Facebook, who have merged in contributions from over one thousand developers.

As a view library, React is responsible for what the user sees on the screen. So its job is putting DOM nodes on the page and updating them. Different view libraries accomplish this in different ways and provide different APIs for us—the developers—to use. The primary features of React are:

- **JSX**: JSX (JavaScript XML) is an extension to JavaScript that allows us to write HTML-like code, with JavaScript expressions inside curly brackets `{}`.
- **Components**: Components are functions or classes that receive arguments (called *props*) and return JSX to be rendered. They can also be used as HTML tags inside JSX: `<div><MyComponent /></div>`.
- **Declarative**: Components automatically get re-run whenever their props or state changes, and the new JSX they return automatically updates the page. This process is called declarative because we declare what our props and state are, which determines how the JSX looks. This is in contrast to an *imperative* view library, like jQuery, in which we would make changes to the page ourselves (for example, by adding an `<li>` to a `<ul>` with `$('ul').append('<li>New list item</li>')`).
- **One-way data binding**: Component state determines the values of form controls, and when the user changes form controls, the state isn’t automatically updated. (Whereas in Angular’s [two-way binding](https://angular.io/guide/two-way-binding#adding-two-way-data-binding), state can be automatically updated.)
- **Virtual DOM**: React creates a model of the page, and when we return different JSX from our components, React compares the new JSX to the previous JSX, and uses the difference to make the smallest possible changes to the DOM. This process improves the rendering speed.

To learn React, we recommend Kent C. Dodds’s course: [Epic React](https://epicreact.dev/).
