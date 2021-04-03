---
title: CDN
---

# CDN

A CDN, or *Content Delivery Network*, has servers around the world that deliver our content to users. Because their servers are closer to our users than our servers are, they can respond faster than we can, improving [latency](latency.md). Here is the way they typically deliver our content:

- We tell our domain name registrar (where we bought the domain) to set the CDN as our [DNS](http.md) server.
- We have our server set a `Cache-Control` header on our responses to HTTP requests. The header tells the CDN how long to serve that response to users.

Then, when a user makes a request, this is what happens the first time:

- The client asks the DNS server: “Where is `ourdomain.com/foo`?”
- The DNS server, which is run by our CDN, replies: “It’s at `1.2.3.4`”, which is the IP address of a nearby server run by the CDN.
- The client connects to `1.2.3.4` and makes the request, saying: `GET ourdomain.com/foo`.
- The `1.2.3.4` CDN server doesn’t know what the `/foo` response should be, so it makes this request to our server: `GET ourapp.herokudns.com/foo`.
- The `1.2.3.4` CDN server forwards the response from our server to the client.
- If the response from our server had an HTTP header that says `Cache-Control: max-age=60`, then the CDN caches it for 60 seconds.

After the CDN caches it, during the next minute, here is what happens when other users make the same request:

- The client asks DNS server: “Where is `ourdomain.com/foo`?”
- The DNS server, which is run by our CDN, replies: “It’s at `5.6.7.8`”, which is the IP address of a nearby server run by the CDN.
- The client connects to `5.6.7.8` and makes the request, saying: `GET ourdomain.com/foo`.
- The `5.6.7.8` CDN server finds the `/foo` response in its cache, and sends it to the client.

These subsequent requests take much less time to complete than requests to our server because: A) the CDN servers are closer, so it takes less time to reach them over the internet, and B) the CDN servers have the whole response ready to quickly return, whereas our server would spend time constructing the response.

