# JSON

JSON is a file format for data objects. The objects are structured in attribute–value pairs, where the attribute is a string and the value can be one of the following types:

- Number: `1.14`
- String: `"foo"`
- Boolean: `true`
- null: `null` 😄
- Array of other types: `["foo", true, 1.14]`
- Object: `{ "name": "john" }`

In JSON documents, whitespace doesn’t matter, and commas go between attribute–value pairs and between items in arrays. Here’s an example, formatted with nice whitespace:

```json
{
  "authors": [
    {
      "name": "john",
      "wearsGlasses": true
    },
    {
      "name": "loren",
      "wearsGlasses": true
    }
  ]
}
```

> It’s also valid JSON to have an array at the top level of the document, e.g.:
> 
> `[{ "name": "john" }, { "name": "loren" }]`

In JavaScript, if we have this document in a string, we can parse it to create a JavaScript object with the same data:

```js
const jsObject = JSON.parse(jsonString)
```

When working with raw [HTTP](http.md) responses that contain a JSON body, we have to use `JSON.parse()` to get the data into an object. But we’ll mostly be working with libraries that take care of this step for us.


