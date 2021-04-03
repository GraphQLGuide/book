---
title: SSR
---

# SSR

SSR (server-side rendering) is when, instead of sending a small HTML file and a JS bundle that we ask the client to parse and render into HTML, our server sends fully rendered HTML (that it created by running the JS view code on the server). When that rendered HTML is cached, the client browser will display the page faster than a normal SPA (a normal SPA displays a blank or skeleton HTML page, and then JavaScript constructs the view and puts it on the page). We also have code from our view library that, once the browser loads the static HTML, attaches our app’s event handlers (like `onClick`, `onSubmit`, etc.) to the page (through a process called *hydration*).

SSR was traditionally necessary for allowing search engines to index page content. However, Google and Bing now use JavaScript to render web pages, so SPAs are usually indexed fine. (You can check by searching `site:mydomain.com` or using Google’s [URL Inspection Tool](https://support.google.com/webmasters/answer/9012289?hl=en).)
