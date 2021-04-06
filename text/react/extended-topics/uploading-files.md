---
title: Uploading files
---

## Uploading files

Background: [CDN](../../background/cdn.md)

There are two ways to do file uploads: client-side and server-side. In client-side uploads, the client sends the file directly to a cloud service that stores the files. In server-side, the client sends the file to our server, which then stores it someplace (either on a hard drive or with a cloud service—usually the latter). For ease of coding, we recommend client-side. The only possible downside is that someone could upload a lot of files to our service, costing us more money. However, in the unlikely event that this becomes a problem, there are ways with most services to make sure only logged-in users can upload.

The two main services we recommend are: 

- Cloudinary (file storage, CDN, and media file processor)
- Amazon S3 (file storage) and CloudFront ([CDN](../../background/cdn.md))

Usually, an app needs to process images or videos—resizing an image, centering on a face and cropping it, brightening, etc.—before using them. For these apps, we recommend Cloudinary as the all-in-one solution. If you’re just saving files that need to be stored, and maybe downloaded later unchanged, then S3 is fine.

### Client-side

There are two ways to upload to Cloudinary from the client—we can use their upload UI, or we can create our own. Here’s what [theirs](https://cloudinary.com/documentation/upload_widget) looks like:

![Cloudinary upload widget](../../img/cloudinary-upload-widget.jpg)

When we open the widget, we give it a callback. The user uses the widget to upload a file to our Cloudinary account, and the widget calls our callback, providing us the ID of the file as an argument. We send the ID to our server in a mutation, and our server saves it to our database. We use the ID to construct the URL of the file, for example:

```
http://res.cloudinary.com/graphql/guide/file-id.jpg
```

If we want our own UI, we can render a file input styled however we want, and then we POST the input file to the Cloudinary server [like in this React example](https://github.com/cloudinary/cloudinary-react/blob/f83e4e561f9709268afbe11812f116f382cc117f/samples/photo_album/src/components/PhotosUploader.js#L99-L119). (And then, as before, we get an ID back to send in a mutation to the server.)

### Server-side

Here’s what we would do to upload a file to our server:

```sh
npm install apollo-upload-client
```

`apollo.js`

```js
import { ApolloClient, InMemoryCache } from '@apollo/client'
import { createUploadLink } from 'apollo-upload-client'

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: createUploadLink({
    uri: 'https://api.graphql.guide/graphql'
  })
})
```

`FileUpload.js`

```js
import { gql, useMutation } from '@apollo/client'

const UPLOAD_FILE_MUTATION = gql`
  mutation UploadFile($file: Upload!) {
    uploadFile(file: $file) {
      id
      fileName
    }
  }
`

export default function () {
  const [uploadFile] = useMutation(UPLOAD_FILE_MUTATION)

  return (
    <input
      type="file"
      required
      onChange={({
        target: {
          validity,
          files: [file]
        }
      }) => validity.valid && uploadFile({ 
        variables : { file } 
      })}
    />
  )
}

export default FileUpload
```

Our server needs to support the [GraphQL multipart request spec](https://github.com/jaydenseric/graphql-multipart-request-spec#server). Apollo server supports it, or, if we’re using a different JS server, we can add support with the [`graphql-upload`](https://github.com/jaydenseric/graphql-upload) package. We’ll see the Apollo server implementation in [Chapter 11: Server Dev > File uploads > Server-side](../../server/extended-topics/file-uploads.md).

