---
title: File uploads
description: Implementing file uploads with GraphQL
---

## File uploads

Originally, web servers saved files to their hard drives or to colocated file servers. Most modern web servers use a third-party file-storage service like Amazon S3 or Cloudinary. When a user wants to upload a file, there are a few different ways the client can get it to a storage service:

- [Client-side](#client-side): The client sends the file directly to the storage service.
  - Signed: Our API server gives a signature to the client to give to the storage service along with the file. If our API server doesn’t give the client a signature (for any reason—for example the client isn’t logged in, or the logged-in user doesn’t have upload permissions), then the storage service won’t accept the file.
  - Unsigned: Our server is not involved, and the storage service accepts any file from any client.
- [Server-side](#server-side): The client sends the file to our server, and we forward it to the storage service.
  - Through GraphQL: The file goes through our GraphQL endpoint.
  - Outside GraphQL: We create a separate endpoint or server for the file to go through.

We recommend unsigned client-side file uploads unless the lack of signatures becomes a problem. If it does, we suggest switching to signed client-side. We prefer unsigned file uploads because they’re the easiest to set up. And the client-side upload process is faster than server-side and reduces load on the GraphQL server.

Not all storage services support client-side uploads, and among those that do, only some support unsigned uploads. S3, for instance, doesn’t really support it (we can configure an S3 bucket for public write access, but then anyone can delete user uploads). Cloudinary not only supports unsigned uploads, but they also take security measures to prevent abuse.

In the first section we’ll go over client-side uploads, and in [the second](#server-side) we’ll do server-side through GraphQL.

### Client-side

> If you’re jumping in here, `git checkout 25_0.2.0` (tag [25_0.2.0](https://github.com/GraphQLGuide/guide-api/tree/25_0.2.0), or compare [25...files](https://github.com/GraphQLGuide/guide-api/compare/25_0.2.0...files_0.2.0))

In this section we’ll add the server code to support an unsigned client-side upload—and at the end, we’ll show the additional code needed for a signed upload. All we need is a mutation for the client to tell the server the filename, ID, or path, depending on which file-storage service we’re using. If we wanted to make it general-purpose, we could use the file’s full URL instead. For the Guide, we’ll use Cloudinary, which gives the client the file’s path after the upload is complete (the client-side upload process is [described in Chapter 6](../../react/extended-topics/uploading-files.md)). The server then combines the path—for example `v1551850855/jeresig.jpg`—with our account URL (`https://res.cloudinary.com/graphql/`) to form the full URL: 

[https://res.cloudinary.com/graphql/v1551850855/jeresig.jpg](https://res.cloudinary.com/graphql/v1551850855/jeresig.jpg)

We’ll use the file-upload feature to allow users to add a profile photo (instead of using their current GitHub photo), so we’ll call the mutation `setMyPhoto` and add it to `User.graphql`:

[`src/schema/User.graphql`](https://github.com/GraphQLGuide/guide-api/compare/25_0.2.0...files_0.2.0)

```gql
extend type Mutation {
  ...
  setMyPhoto(path: String!): User!
}
```

Since `setMyPhoto` will be changing a `User` field, we return the modified `User` object.

In the resolver, we check if the client is logged in and call a new data source method `setPhoto()`:

[`src/resolvers/User.js`](https://github.com/GraphQLGuide/guide-api/compare/25_0.2.0...files_0.2.0)

```js
export default {
  ...
  Mutation: {
    createUser: ...,
    setMyPhoto(_, { path }, { user, dataSources }) {
      if (!user) {
        throw new ForbiddenError('must be logged in')
      }

      return dataSources.users.setPhoto(path)
    }
  }
}
```

The method constructs the full photo URL, saves it to the database, and returns the updated user object: 

[`src/data-sources/Users.js`](https://github.com/GraphQLGuide/guide-api/compare/25_0.2.0...files_0.2.0)

```js
export default class Users extends MongoDataSource {
  ...

  async setPhoto(path) {
    const { user } = this.context
    const photo = `https://res.cloudinary.com/graphql/${path}`
    await this.collection.updateOne({ _id: user._id }, { $set: { photo } })
    return {
      ...user,
      photo
    }
  }
}
```

Now that some user documents will contain a `photo` field, we need to update our resolver:

[`src/resolvers/User.js`](https://github.com/GraphQLGuide/guide-api/compare/25_0.2.0...files_0.2.0)

```js
export default {
  ...
  User: {
    id: ...,
    email: ...,
    photo(user) {
      if (user.photo) {
        return user.photo
      }

      // user.authId: 'github|1615'
      const githubId = user.authId.split('|')[1]
      return `https://avatars.githubusercontent.com/u/${githubId}`
    },
    createdAt: ...
  },
  Mutation: {
    createUser: ...,
    setMyPhoto: ...
  }
}
```

We return early if the `user` object fetched from the database has a `photo` property. 

We can test out the mutation in Playground with either a valid Authorization header or by hard coding the `authId` in `src/context.js`:

![setMyPhoto mutation in Playground](../img/setMyPhoto.png)

If we wanted to do signed client-side upload, we’d need to make a Query for the client to fetch the signature. Our resolver would call [cloudinary.utils.api_sign_request()](https://cloudinary.com/documentation/upload_images#using_cloudinary_server_side_sdks_to_generate_authentication_signatures) like this:


```js
export default {
  Query: {
    ...
    uploadSignature(_, { uploadParams }, { user }) {
      if (!user) {
        throw new ForbiddenError('must be logged in')
      }

      return cloudinary.utils.api_sign_request(uploadParams, CLOUDINARY_API_SECRET)
    }
  }
}
```

Then the client would send the signature along with the file to Cloudinary’s servers (and we would disable unsigned uploads in our Cloudinary account settings). 

If we were using Amazon S3, then we’d use the [`s3.createPresignedPost()`](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#createPresignedPost-property) function to create the signature.

### Server-side

> If you’re jumping in here, `git checkout files_0.2.0` (tag [files_0.2.0](https://github.com/GraphQLGuide/guide-api/tree/files_0.2.0), or compare [files...files2](https://github.com/GraphQLGuide/guide-api/compare/files_0.2.0...files2_0.2.0))

We go over the differences between client-side and server-side [above](file-uploads.md#file-uploads). In this section, we’ll do server-side file uploads, where the client sends the file to the GraphQL server, which sends it to the storage service (we could send to Cloudinary again, but we’ll use Amazon S3 this time for diversity). There are different methods for the client to send the file, and the most common is a multipart HTTP request, which works through:

- an [`Upload`](https://www.apollographql.com/docs/apollo-server/data/file-uploads/) scalar provided by Apollo Server
- the Apollo Link [`apollo-upload-client`](https://github.com/jaydenseric/apollo-upload-client) on the client side

We create a mutation with an argument of type `Upload`:

[`src/schema/User.graphql`](https://github.com/GraphQLGuide/guide-api/compare/files_0.2.0...files2_0.2.0)

```gql
extend type Mutation {
  createUser(user: CreateUserInput!, secretKey: String!): User
  setMyPhoto(path: String!): User!
  uploadMyPhoto(file: Upload!): User!
}
```

We’ll need an instance of the AWS S3 client library ([`aws-sdk`](https://aws.amazon.com/sdk-for-node-js/)) to upload to S3:

[`src/util/s3.js`](https://github.com/GraphQLGuide/guide-api/blob/files2_0.2.0/src/util/s3.js)

```js
import AWS from 'aws-sdk'

export default new AWS.S3()
```

We’ll import and use it in the resolver:

[`src/resolvers/User.js`](https://github.com/GraphQLGuide/guide-api/compare/files_0.2.0...files2_0.2.0)

```js
import s3 from '../util/s3'

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export default {
  ...
  Mutation: {
    ...
    uploadMyPhoto: async (_, { file }, { user, dataSources }) => {
      if (!user) {
        throw new ForbiddenError('must be logged in')
      }

      const { createReadStream, filename, mimetype } = await file

      if (!IMAGE_MIME_TYPES.includes(mimetype)) {
        throw new InputError({ file: 'must be an image file' })
      }

      const stream = createReadStream()
      const { Location: fileUrl } = await s3
        .upload({
          Bucket: 'guide-user-photos',
          Key: filename,
          Body: stream
        })
        .promise()

      return dataSources.users.setPhoto(fileUrl)
    }
  }
}
```

We first check if the user is logged in, then we check the file type (valid values taken from a [list of MIME types](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types)), and then we create a Node.js file stream, which we pass to [`s3.upload()`](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#upload-property) along with the filename and S3 *bucket* (the top-level folder in S3, and the subdomain of the file’s URL). Finally, we call the data source `setPhoto()` method, which used to take a path, but let’s refactor it to take a full URL:

[`src/data-sources/Users.js`](https://github.com/GraphQLGuide/guide-api/compare/files_0.2.0...files2_0.2.0)

```js
export default class Users extends MongoDataSource {
  ...
  
  async setPhoto(photo) {
    const { user } = this.context
    await this.collection.updateOne({ _id: user._id }, { $set: { photo } })
    return {
      ...user,
      photo
    }
  }
}
```

Changing the parameter means we need to update where we used it previously:

[`src/resolvers/User.js`](https://github.com/GraphQLGuide/guide-api/compare/files_0.2.0...files2_0.2.0)

```js
export default {
  ...
  Mutation: {
    createUser...
    setMyPhoto(_, { path }, { user, dataSources }) {
      if (!user) {
        throw new ForbiddenError('must be logged in')
      }

      return dataSources.users.setPhoto(
        `https://res.cloudinary.com/graphql/${path}`
      )
    },
    uploadMyPhoto...
  }
}
```

We pass the full cloudinary URL instead of just the path.

In order for the AWS SDK to authenticate our account, we need to add `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` to our `.env`.

> To test this section yourself, you need an AWS account, a bucket created in the [S3 management console](https://s3.console.aws.amazon.com/s3/home), and access keys created in the [Identity and Access Management console](https://console.aws.amazon.com/iam/home). You’d replace `'guide-user-photos'` in `src/resolvers/User.js` with your bucket name, and you’d put your own access keys in `.env`. Then you’d write [a test like this](https://github.com/jaydenseric/graphql-upload/blob/b70a67dd4d0aee4eeccbd261ae6105a2bace418e/test/lib/graphqlUploadExpress.test.js#L37-L64) or create a small web app that used [`apollo-upload-client`](https://github.com/jaydenseric/apollo-upload-client) to send a file in an `uploadMyPhoto` Mutation.

When the `uploadMyPhoto` Mutation is run, the upload is successful, and the server saves a URL like this in the `photo` field of the current user’s MongoDB document:

`https://guide-user-photos.s3.amazonaws.com/filename.jpg`

