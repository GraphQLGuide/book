---
title: Browser performance
description: A few different measures of browser performance and targets to stay under
---

# Browser performance

Users notice when sites are slow, and they don’t like it 😄. So if we want our users to feel good using our site, we want different things in the browser to happen at certain speeds. 

First, let’s go over how the browser works. Because JavaScript is single-threaded, it can only run on a single CPU core. We can have particular pieces of JS run in [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers), which can run on different cores, but most of our JS runs on one core, in the browser’s **main thread**. The browser also needs to do most of its page **rendering** (parsing HTML and CSS, laying out elements, painting pixels into images, etc.) in the main thread. 

> **Composition**, in which the pixel images are positioned, happens on the GPU.

A CPU core has a limited speed—it can only do a certain amount of work each millisecond. And because both JS and rendering happen on the same core, every millisecond our JS takes up is another millisecond the browser rendering has to wait before it can run. And the user won’t see the page update until the browser has a chance to render.

Now that we know what’s going on, let’s think about different situations the user is in and how fast our site should be in each:

- **Page load**: The faster the better, but good targets are under 5 seconds *time to interactive* (the page is interactive when content has been displayed and the page is interactable—it can be scrolled, things can be clicked on, etc.) for the first visit and under 2 seconds for subsequent visits.
- **Response**: When humans take an action like clicking a button, and the page changes within 100 milliseconds, they generally perceive the response as immediate. If the response takes over 100ms, humans perceive a delay. If our click event handler runs code that takes 100ms on slow devices, then we want to break the code into two pieces: the minimum amount that will trigger the desired UI change, and the rest. And we schedule the rest to be done later:

```js
button.onclick = () => {
  updateUI()
  window.requestIdleCallback(doTheRest)
}
```

or in React:

```js
class Foo extends Component {
  onClick = () => {
    this.setState({ something: 'different' })
    window.requestIdleCallback(this.doTheRest)
  }
}
```

[requestIdleCallback()](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback) runs the given function when the browser is idle, after it has finished rendering the changes triggered by `updateUI()`/`this.setState()`.

- **Animation**: Humans perceive a motion as smooth at 60 fps—when 60 frames are rendered per second. If we take 1,000 milliseconds and divide by 60, we get 16. So while something is moving on the page, we want the browser to be able to render every 16ms. The browser needs 6ms to paint, which gives us 10ms left to run JS. “Something moving” includes visual animations like entrances/exits and loading indicators, scrolling, and dragging.


