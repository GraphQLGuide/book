---
title: Webhooks
---

# Webhooks

Webhooks are a system for how one server can notify another server when something happens. Some sites, including GitHub, allow us to provide them with a URL, for instance,  `https://api.graphql.guide/github-hook`, to which they make an [HTTP](http.md) request when a certain event occurs. If we tell GitHub we want to know about the [`watch` event](https://developer.github.com/v3/activity/events/types/#watchevent) on the Guide repo, then they will send a POST to our server (using the given URL) whenever the repo is starred. The POST will contain a JSON body with information about the event, for example:

```json
{
  "action": "started",
  "repository": {
    "name": "guide",
    "full_name": "GraphQLGuide/guide",
    "watchers_count": 9,
    …
  },
  "sender": {
    "login": "lorensr",
    "type": "User",
    "html_url": "https://github.com/lorensr",
    …
  }
}
```

Then our server parses the JSON to figure out what happened. In this case, the `sender` is the user who performed the action, and we see under the `repository` attribute that the repo now has 9 watchers.

