# Subscriptions

[Subscriptions](http://spec.graphql.org/draft/#sec-Subscription) are long-lived requests in which the server sends the client data from events as they happen. The manner in which the data is sent is not specified, but the most common implementation is WebSockets, and other implementations include HTTP long polling, server-sent events (supported by all browsers except for IE 11), and webhooks (when the client is another publicly-addressable server). 

The client initiates a subscription with:

```gql
subscription {
  reviewCreated {
    id
    text
    createdAt
    author {
      name
      photo
    }
  }
}
```

As with mutations, we call the subscription operation’s root field the “subscription,” and its selection set is the data that the server sends the client on each event. In this example, the event is the creation of a review. So whenever a new review is created, the server sends the client data like this:

```json
{
  "data": {
    "reviewCreated": {
      "id": 1,
      "text": "Now that’s a downtown job!",
      "createdAt": 1548448555245,
      "author": {
        "name": "Loren",
        "photo": "https://avatars2.githubusercontent.com/u/251288"
      }
    }
  }
}
```