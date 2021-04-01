# Field aliases

We can give a field an [*alias*](http://spec.graphql.org/draft/#sec-Field-Alias) to change its name in the response object. In this query, we want to select `profilePic` twice, so we give the second instance an alias:

```gql
{
  user(id: 1) {
    id
    name
    profilePic(width: 400)
    thumbnail: profilePic(width: 50)
  }
}
```

The response object is:

```
{
  "user": {
    "id": 1,
    "name": "John Resig",
    "profilePic": "https://cdn.site.io/john-400.jpg",
    "thumbnail": "https://cdn.site.io/john-50.jpg"
  }
}
```

