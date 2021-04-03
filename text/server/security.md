---
title: Security
description: General security and auth in GraphQL
---

## Security

Background: [HTTP](../background/http.md), [Databases](../background/databases.md), [Authentication](../background/authentication.md)

* [Auth options](#auth-options)
  * [Authentication](#authentication)
  * [Authorization](#authorization)
* [Denial of service](#denial-of-service)

In this section, we’ll start out with an overview of general server-side security and then get to a few topics specific to  GraphQL. 

Computer security is protecting against:

- Unauthorized actions
- Theft or damage of data
- Disruption of service

Here are a few levels of vulnerability relevant to securing servers from the above threats, along with some methods of risk management:

- **People and their devices**: People that have access to our systems, like employees at our company, hosting companies, and service companies like Auth0.
  - Train employees on security, including avoiding the most common malware avenues: visiting websites and opening files.
  - Avoid personal use of work devices.
  - Install [antivirus](https://thewirecutter.com/blog/best-antivirus/) on work computers.
  - [Vet](https://checkr.com/) employee candidates.
  - Access production systems and data from a limited number of devices that are not used for email or web browsing.
- **Physical access**: The capability to physically get to servers that store or handle our data.
  - Make sure device hard drives are encrypted with complex login passwords, or locked away when not in use.
  - Assess risk level of our service companies (for example [AWS perimeter security](https://aws.amazon.com/compliance/data-center/perimeter-layer)).
- **Network**: Users being able to access our server over the internet or view data in transit.
  - Keep our server IP addresses private.
  - Use a DNS provider that hides our server IPs and handles DDoS attacks (like [Cloudflare](https://www.cloudflare.com/) or AWS’s [Sheild Standard, CloudFront, & Route 53](https://aws.amazon.com/answers/networking/aws-ddos-attack-mitigation/)).
  - Force HTTPS: When a client makes a connection to our server on port 80 (unencrypted), redirect them to port 443, which will ensure all further data sent between us and the client is encrypted.
- **Operating system**: Hackers exploiting a vulnerability in our server OS (usually Linux).
  - Apply security patches or use a PaaS or FaaS, where OS security is taken care of for us.
- **Server platform**: Node.js.
  - Apply security updates to Node.js, or use a PaaS or FaaS, where security updates are done automatically.
- **Application layer**: GraphQL execution and our code. The following sections cover this area of security.

After we implement protections, we can hire a firm to do a [security audit](https://en.wikipedia.org/wiki/Information_security_audit) and use [HackerOne](https://www.hackerone.com/) to find areas we didn’t sufficiently cover. 

Any system can be hacked—it’s just a matter of the level of resources put into hacking. The two largest sources relevant to companies are eCrime (criminal hacking—often financial or identity theft) and the Chinese government (stealing trade secrets from foreign companies). Most large companies have been hacked at some point to some degree.

After we have been hacked, it’s important to be able to:

1. Figure out how it happened.
2. Ensure the attackers no longer have access.
3. Know what data was accessed.
4. Recover deleted data.

For #1 and #3, we can set up access logs for our production servers, databases, and sensitive services, and for #4, we can set up automatic database backups (MongoDB Atlas has options for either snapshots or continuous backups). Step #2 depends on #1—if one of our service accounts was compromised, we can change the password. If one of our API user’s accounts was stolen (session token, JWT, or password), then we need to delete their session or re-deploy with code that blocks their JWT (and if we’re using password authentication, delete their current password hash and send a password reset email).

One important way to mitigate the damage of a database hack is hiding sensitive database fields—either by storing only hashes, in the case of passwords, or by storing fields encrypted (using an encryption key that’s not stored in the database). Then an attacker won’t know the user’s password (which they’d likely be able to use to log in to the user’s accounts on other sites), and they won’t be able to read sensitive data unless they also gain access to the encryption key.

Here are a few application-layer security risks that apply to API servers in general—not just GraphQL servers:

- Parameter manipulation: When clients alter operation arguments. We protect against this by checking arguments to ensure they’re valid, and by not trusting them (for instance, we should use the `userId` from the context instead of from an argument).
- Outdated libraries: Our code depends on a lot of libraries, any of which may have security vulnerabilities that affect our app. For Node.js, we can use `npm audit` to check for vulnerabilities in our libraries.
- Database injection like [SQL injection](https://en.wikipedia.org/wiki/SQL_injection) and [MongoDB injection](https://blog.websecurify.com/2014/08/hacking-nodejs-and-mongodb.html)
- [XSS](https://developer.mozilla.org/en-US/docs/Glossary/Cross-site_scripting): On the client, preventing XSS involves sanitizing user-provided data before it’s added to the DOM, but on the server, we use a [Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy) header.
- [Clickjacking](https://en.wikipedia.org/wiki/Clickjacking): Use [X-Frame-Options headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/
- Race conditions, especially [TOCTOU](https://en.wikipedia.org/wiki/Time-of-check_to_time-of-use): Imagine multiple of our servers are running the same mutation from the same user at the same time. We may need to use database transactions or other logic to prevent this type of attack.
- Number processing: Bugs that involve working with numbers, including conversion, rounding, and overflows.

### Auth options

*Auth* is an imprecise term—sometimes it’s used to mean authentication, sometimes authorization, and sometimes both. In this case, we mean both:

- [Authentication](#authentication)
- [Authorization](#authorization)

#### Authentication

Background: [Authentication](../background/authentication.md)

The server receives a JWT or session ID in an HTTP header, which it uses to decode or look up the user. If we’re putting our GraphQL server in front of existing REST APIs, then we may want to just pass the header along to the REST APIs—they can continue doing the authentication (and authorization), returning null or returning errors that we can format as GraphQL errors. 

However, usually we’ll handle user decoding in the GraphQL server. In the case of federation, we decoded the user [in the gateway](../federation/federated-gateway.md) and passed the object in a `user` header to the services. In the case of our monolith, we decoded [in the `context` function](building/authentication.md) and provided `context.user` to the resolvers.

But how does the client get the JWT or session ID in the first place? In our case, we used an external service: We [opened a popup](../react/#authentication) to an Auth0 site that did both signup and login and provided the client with a JWT. Other options include:

- Hosting our own identity server (for example the free, open-source [Ory server](https://www.ory.sh/kratos/)). 
- Adding HTTP endpoints to our GraphQL server (for example with the [Passport library](http://www.passportjs.org/)).
- Adding mutations to our GraphQL server (for example the [accounts-js](https://github.com/accounts-js/accounts) library adds `Mutation.register`, `Mutation.authenticate`, etc. to our schema).
- Using our hosting provider’s identity service (for example [Netlify Identity](https://docs.netlify.com/functions/functions-and-identity/#access-identity-info-via-clientcontext) if our server is hosted with [Netlify Functions](https://www.apollographql.com/docs/apollo-server/deployment/netlify/), or [Amazon Cognito](https://aws.amazon.com/cognito/) with AWS Lambda).

Hosting our own separate identity server might be the most common solution.

#### Authorization

After we authenticate the client, we either have their decoded token object (in the case of JWTs) or their user object (in the case of sessions). Both the token and the user object should have the user’s permissions. Permissions can be stored in different ways—usually a list of roles or scopes, or, at its most simple, as an `admin` boolean field.

Once we have the user’s permission info, our server has to determine which data to allow the user to query and which mutations to allow the user to call. There are a number of different places where we can make this determination:

- **REST services**: In the case of putting a GraphQL gateway in front of existing REST services that already do authorization checks, we can continue to let them do the checks.
- **Context**: If we only want logged-in users to be able to use our API, we can throw an `AuthenticationError` in our `context()` function whenever the HTTP header is missing or the decoding/session lookup fails.
- **Model**: We can do the checks in our data-fetching code. This is the best option when we have both a GraphQL and REST API, both of which call the model code. (This way, we don’t have to duplicate authorization checks.)
- **Directives**: We can add directives to fields or types in our schema—for instance, `@isAuthenticated` or `@hasRoles(roles: [ADMIN])`. A library we can use that defines these directives for us is [graphql-auth-directives](https://github.com/grand-stack/graphql-auth-directives).
- **Resolvers**: In the server we built in this chapter, we did all our authorization checks in our resolver functions. The biggest downside to this approach is repetition as the schema gets larger—for instance, we’d probably wind up with a lot of `if (!user) { throw new ForbiddenError('must be logged in') }`. It’s also harder to get a broader sense of which parts of the schema have which authorization rules. With directives, we can easily scan through the schema, and with middleware, we can look at the below `shield({ ... })` configuration and see everything together.
- **Middleware**: We can use [`graphql-middleware`](https://github.com/prisma-labs/graphql-middleware)—functions that are called before our resolvers are called. In particular, we can configure the [GraphQL Shield](https://github.com/maticzav/graphql-shield) middleware library to run authorization functions before our resolvers like this:

```js
const isAuthenticated = rule({ cache: 'contextual' })(
  async (parent, args, context, info) => {
    return context.user !== null
  }
)

const isAdmin = rule({ cache: 'contextual' })(
  async (_, __, context) => {
    return context.user.roles.includes('admin')
  }
)

const isMe = rule({ cache: 'strict' })(
  async (parent, _, context) => {
    return parent._id.equals(context.user._id)
  }
)

const permissions = shield({
  Query: {
    me: isAuthenticated,
    secrets: isAdmin
  },
  Mutation: {
    createReview: isAuthenticated
  },
  User: {
    email: chain(isAuthenticated, isMe)
  },
  Secret: isAdmin
})
```

The equivalent **directives** schema would be:

```gql
type Query {
  user(id: ID!): User
  me: User @isAuthenticated  
}

type Mutation {
  createReview(review: CreateReviewInput!): Review @isAuthenticated
}

type Secret @hasRole(roles: [ADMIN]) {
  key: String
}
```

And for `User.email`, we could either do a resolver check or create a new directive.

In each of the last three authorization locations—**directives, resolvers, and middleware**—we have to be careful about adding rules only to our root query fields. Since our data graph is interconnected, oftentimes there will be other ways to reach a sensitive type through a connection from another field. So it’s usually necessary to add rules to types, as we do with the `Secret` type above. Unfortunately, we can’t do that in resolvers—just directives and middleware.

### Denial of service

This content is included in the Full edition of the book:

[Preventing DoS Attacks](../preventing-dos-attacks/index.md)

