# HTTP

HTTP is a format for sending messages over the internet. It is used on top of two other message formats—IP (which has an *IP address* and routes the message to the right machine) and TCP (which has a port number and resends any messages that are lost in transit). An HTTP message adds a *method* (like `GET` or `POST`), a path (like `/graphql`), headers (like the `Bearer` header we use for [authentication](authentication.md)), and a body (where GraphQL queries and responses go). 

When we enter a URL, like `http://graphql.guide/`, into our browser, it goes through these steps:

- Browser asks DNS server what the IP address of `graphql.guide` is.
- DNS server responds with `104.27.191.39`.

We can see for ourselves what the DNS server says using the `nslookup` command:

```sh
$ nslookup graphql.guide
Server:         8.8.4.4
Address:        8.8.4.4#53

Non-authoritative answer:
Name:   graphql.guide
Address: 104.27.191.39
```

- Browser sends out a message to the internet that looks like this:

```
IP to 104.27.191.39
TCP to port 80
HTTP GET /
```

- Internet routers look at the IP part, see it is addressed to `104.27.191.39`, and pass it off to a router that is closer to `104.27.191.39`.

- The message arrives at `104.27.191.39` (the IP address of the Guide server), which opens the message, sees that it’s trying to connect to port 80, and passes the message to whatever server program (in this case, a Node.js process) is listening at the port. 

> An *IP address* is the number ID of a computer on the internet, and we can think of a *port* as the number of a program running on that computer.

- The server process sees that the client wants to GET /, the root path, and sends back an `index.html` to the client.

> This sequence is a little simplified—it actually takes a separate round-trip message to set up the TCP connection, and for `graphql.guide`, the client is actually redirected to HTTPS at the beginning, which uses port 443 and sets up an SSL connection before sending HTTP GET /.

