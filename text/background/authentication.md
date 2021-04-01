# Authentication

## Tokens vs. sessions

There are two main ways in which a server can verify that a client is a certain user: signed tokens and sessions. 

A **signed token** is piece of data that is *cryptographically signed*—which means we can mathematically verify who wrote the data. When the data is a user ID, for example `123`, and the signer is someone we trust (either our server, or a trusted third-party server when we’re using an authentication service like Auth0), then we can verify the signature and know that the client is user `123`. The most common type of signed token is a JWT, or [JSON Web Token](https://jwt.io/).

A **session** is a period of time during which a certain client is considered logged in as a particular user. The server stores data about the session, for instance:

```js
{
  sessionId: 'abc',
  userId: 123,
  expiresAt: 1595627896095
}
```

And gives the client a secret: in this case, the `sessionId`. Whenever the client contacts the server, the client includes the secret so that the server can look up the session data. For instance, if the client sends `'abc'`, the server can look up the above record, and if the session hasn’t expired, the server knows the client is user `123`.

Both methods can contain additional information about the user—information commonly included in order to prevent the server from having to take the time to look up the user record from the database. For example, we could include authorization info like `isAdmin` or profile info like `name` and `email`.

There are some pros and cons to each method:

- **State**: Sessions are stateful—the server has to record the session data somewhere (in Redis, or in memory with sticky sessions), and that introduces complexity (and increased [latency](latency.md) in the case of Redis). Signed tokens are stateless—all the information that the server needs is contained in the token.
- **Invalidation**: When a session secret is compromised, we can invalidate that session by deleting it from the data store. When a token is compromised, we can’t invalidate it—it’s already been signed and will continue to be valid until the expiration. We’d have to add a list of invalid tokens—either in code and re-deploy, or in a data store—and add logic to check them.

The differences are small enough that for most applications, we recommend using whichever method is easier to build.

## localStorage vs. cookies

We can store session secrets and signed tokens in either localStorage or cookies, which have different pros and cons:

- **Size**: Cookies can’t be larger than 4KB, and, in some cases, we might want to store more than 4 KB of data in our token, in which case we’d need to use localStorage.
- **Flexibility**: Data you put in localStorage can be managed by client-side JavaScript and sent to any domain, whereas cookies can only be set by the server and can only be shared among subdomains.
- **XSS**: Cookies are set by the server and can be configured to be inaccessible from client-side JS, so they can’t be read by [XSS attacks](https://en.wikipedia.org/wiki/Cross-site_scripting). Data stored in localStorage is vulnerable to XSS because it can be read by any JS running on your page (from any source allowed by your [CSP](https://en.wikipedia.org/wiki/Content_Security_Policy)).
- **CSRF**: Cookies are vulnerable to [CSRF attacks](https://en.wikipedia.org/wiki/Cross-site_request_forgery), whereas localStorage is not.

While the XSS issue is a serious concern, a common mitigation is setting short expirations, and for applications without strict security requirements, we again recommend using whichever method is easier to set up.

