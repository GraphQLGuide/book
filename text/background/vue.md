---
title: Vue
---

# Vue 

[Vue.js](https://v3.vuejs.org/guide/introduction.html) was created in 2014 by Evan You after working with Angular.js at Google. Evan wanted a lightweight view library that had the good parts of Angular. It has since evolved a lot, is now in its third major version, and has a number of accompanying tooling and libraries, including a devtools browser extension, a CLI, a webpack loader, and a router library. 

Similarly to React, Vue has components, declarative templating, and a virtual DOM. Instead of JSX, Vue uses an HTML-based syntax with double curly brace interpolation and special attributes called *directives*. Javascript expressions can be used inside both. Like React, Vue has reactivity, but in a different fashion. React components have functions that re-run whenever a prop or piece of state changes. In Vue, the `setup()` function is run once. The template includes reactive objects, and when any of its reactive objects are changed, it gets re-rendered. 

Vue also has [two-way data binding](https://v3.vuejs.org/guide/forms.html#basic-usage) on form inputs: when a data object is bound to a form input, the object is updated when the user makes a change (for example, typing in an `<textarea>` or checking a checkbox), and when the object is changed by code, the element’s value is updated.

