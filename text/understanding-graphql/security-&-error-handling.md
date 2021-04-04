---
title: Security & error handling
---

# Security & error handling

When it comes to the security of our data (validating the permissions of those that are attempting to access it) and the handling of errors, REST APIs have an idiomatic solution: returning a specific error code. For example, if we attempt to access data which we don’t have permission to access, we might get an HTTP 403 Forbidden code in response. If our request results in an error, then we might get an HTTP 500 Internal Server Error code. Some REST APIs might include detailed information on the failure inside the response body (such as the error message or the specific data that we don’t have permission to access), but the error codes are generally used to designate the class of error, not the specific error itself.

In GraphQL every request is expected to return a result, even if that result doesn’t have the data we request. GraphQL tends to treat security and error-handling issues similarly. If there’s a problem with accessing a specific piece of data, then `null` is returned in its place. This calls for a defensive, but smart, way of coding an application. Since no field is guaranteed to be there, we need to ensure that it exists before attempting to use it.

For example, let’s say the MongoDB server wasn’t running. The output from our server might look something like this:

```json
{
  "errors": [
    {
      "message": "failed to reconnect after 30 attempts with interval 1000 ms",
      "locations": [
        {
          "line": 2,
          "column": 3
        }
      ],
      "path": [
        "users"
      ]
    }
  ],
  "data": {
    "users": null
  }
}
```

In this case, the `"users"` property ends up being `null`, and there’s an additional `"errors"` property that has a list of errors that were thrown, including where each error came from—the field name and the location in the query.

Whether a user doesn’t have permission to access a piece of information or the data doesn’t exist, the end result is similar: the user doesn’t get that data and is given a `null` result instead, like in the following:

![null group result in GraphiQL](../img/null-group.jpg)
*An example of a failed load for a group child object inside the GraphiQL web interface.*

In this case, we either didn’t have an associated group or we didn’t have permission to access that group, so we were given a `null` value. GraphQL gives the user as much data as it possibly can, leaving out anything that’s missing (for one reason or other). This also allows the application to render a version of the site that has some portion of the interface available, and allows it to make note of missing information, rather than displaying a general “Error!” message that contains no context.

GraphQL’s design provides a level of consistency that should be greatly appreciated by all developers. Every request will return a valid JSON response (unless something goes very wrong). There is no guarantee that the response will contain all of the data we request, so we end up building more resilience into our application. This should be a best practice, as it provides an optimal experience to the user.

