# Mutating

Section contents:

* [First mutation](#first-mutation)
* [Listing reviews](#listing-reviews)
* [Optimistic updates](#optimistic-updates)
* [Arbitrary updates](#arbitrary-updates)
* [Creating reviews](#creating-reviews)
* [Using fragments](#using-fragments)
* [Deleting](#deleting)
* [Error handling](#error-handling)
* [Editing reviews](#editing-reviews)

## First mutation

> If you’re jumping in here, `git checkout 8_0.2.0` (tag [`8_0.2.0`](https://github.com/GraphQLGuide/guide/tree/8_0.2.0)). Tag [`9_0.2.0`](https://github.com/GraphQLGuide/guide/tree/9_0.2.0) contains all the code written in this section.

We haven’t yet changed any of the data in the Guide’s database (just the star count in GitHub’s database). When we want to change data (or more broadly, trigger side effects), we need to send a mutation to the server. Let’s start with something simple—at the bottom of `<Section>`, let’s add the count of how many times the current section has been viewed. Then we can increment the count whenever it’s viewed.

First we add the `views` field to each of our three section queries:

[`src/components/Section.js`](https://github.com/GraphQLGuide/guide/blob/9_0.2.0/src/components/Section.js)

```js
const SECTION_BY_ID_QUERY = gql`
  query SectionContent($id: String!) {
    section(id: $id) {
      id
      content
      views
    }
  }
`

const SECTION_BY_CHAPTER_TITLE_QUERY = gql`
  query SectionByChapterTitle($title: String!) {
    chapterByTitle(title: $title) {
      title
      section(number: 1) {
        id
        content
        views
      }
    }
  }
`

const SECTION_BY_NUMBER_QUERY = gql`
  query SectionByNumber($chapterNumber: Int!, $sectionNumber: Int!) {
    chapterByNumber(number: $chapterNumber) {
      number
      section(number: $sectionNumber) {
        id
        number
        title
        content
        views
      }
    }
  }
`
```

In addition to `views`, we have to add `id` to the query’s selection set so that the `Section` gets [normalized](../client/#caching) correctly. 

For the first query, we also need to add `views: get(data, 'section.views')` to `section`:

```js
  switch (query) {
    case SECTION_BY_ID_QUERY:
      section = {
        ...state.section,
        content: get(data, 'section.content'),
        views: get(data, 'section.views'),
      }
      chapter = state.chapter
      break
```

Next we display the new data:

[`src/components/Section.js`](https://github.com/GraphQLGuide/guide/blob/9_0.2.0/src/components/Section.js)

```js
  let headerContent = null,
    sectionContent = null,
    footerContent = null

  if (loading) {
    ...
  } else if (!section) {
    ...
  } else {
    ...

    sectionContent = section.content
    footerContent = `Viewed ${section.views.toLocaleString()} times`
  }

  return (
    <section className="Section">
      ...
      <footer>{footerContent}</footer>
    </section>
  )
```

![Section views](../img/section-views.png)

Now look for the mutation we need in Playground—we need the name, arguments, and return type.

![viewedSection selected among list of available mutations](../img/viewedSection-schema.png)

And we write out the mutation string just like we write queries:

[`src/components/Section.js`](https://github.com/GraphQLGuide/guide/blob/9_0.2.0/src/components/Section.js)

```js
const VIEWED_SECTION_MUTATION = gql`
  mutation ViewedSection($id: String!) {
    viewedSection(id: $id) {
      id
      views
    }
  }
`
```

Like in the queries, we need the `id` field so that Apollo knows which `Section` is being returned in the mutation response. Now the response’s `views` field will update the normalized `Section` object in the Apollo cache, which will update any hook queries that select that field. We’ll be able to see this in action in a bit.

The mutation hook is simple:

[`src/components/Section.js`](https://github.com/GraphQLGuide/guide/blob/9_0.2.0/src/components/Section.js)

```js
import { useMutation } from '@apollo/client'

...

  const [viewedSection] = useMutation(VIEWED_SECTION_MUTATION)
```

`useMutation()` returns a function, which we’re naming `viewedSection`. We want to call it whenever a section is viewed, so inside a `useEffect()` hook:

[`src/components/Section.js`](https://github.com/GraphQLGuide/guide/blob/9_0.2.0/src/components/Section.js)

```js
export default () => {
  ...

  let section, chapter

  switch(query) { ... }

  const [viewedSection] = useMutation(VIEWED_SECTION_MUTATION)

  const id = get(section, 'id')

  useEffect(() => {
    const timeoutID = setTimeout(() => {
      viewedSection({ variables: { id } })
    }, 2000)

    return () => clearTimeout(timeoutID)
  }, [id, viewedSection])

  ...
}
```

We give `viewedSection()` the section ID variable. We put it in a timeout so that we have time to scroll down to the bottom of the section to see the count change (End key or Cmd-⬇️ on Mac). We add `id` as a dependency so that whenever it changes, `viewSection()` is called again.

We should now be able to see the count change at the bottom of the page when we switch between sections.

## Listing reviews

> If you’re jumping in here, `git checkout 9_0.2.0` (tag [`9_0.2.0`](https://github.com/GraphQLGuide/guide/tree/9_0.2.0)). Tag [`10_0.2.0`](https://github.com/GraphQLGuide/guide/tree/10_0.2.0) contains all the code written in this section.

Before we get to more advanced mutations, we need more material to work with! Let’s make a new page that lists book reviews, and then in the [next section](#optimistic-updates), we can implement features that require mutations: favoriting reviews, creating new reviews, and editing and deleting our own reviews.

Let’s start out by adding a link to the bottom of the table of contents:

[`src/components/TableOfContents.js`](https://github.com/GraphQLGuide/guide/blob/10_0.2.0/src/components/TableOfContents.js)

```js
export default () => {
  const { data: { chapters } = {}, loading } = useQuery(CHAPTER_QUERY)

  return (
    <nav className="TableOfContents">
      ...
          <li>
            <NavLink className="TableOfContents-reviews-link" to="/reviews">
              Reviews
            </NavLink>
          </li>
        </ul>
      )}
    </nav>
  )
}
```

And we can add the new route with another `<Switch>`:

[`src/components/App.js`](https://github.com/GraphQLGuide/guide/blob/10_0.2.0/src/components/App.js)

```js
import Reviews from './Reviews'

const Book = () => (
  <div>
    <TableOfContents />
    <Switch>
      <Route exact path="/reviews" component={Reviews} />
      <Route component={Section} />
    </Switch>
  </div>
)
```

Our `<Reviews>` component is going to need some data! We know how to do that now. Let’s search through the schema for the right query:

![Schema: reviews](../img/schema-reviews.png)

We find the `reviews` root query field, and since fetching them all might be a lot of data, let’s use the `limit` argument. And for each review, we want to display the author’s name, photo, and a link to their GitHub, so we need:

[`src/components/Reviews.js`](https://github.com/GraphQLGuide/guide/blob/10_0.2.0/src/components/Reviews.js)

```js
const REVIEWS_QUERY = gql`
  query ReviewsQuery {
    reviews(limit: 20) {
      id
      text
      stars
      createdAt
      favorited
      author {
        id
        name
        photo
        username
      }
    }
  }
`
```

As before, we will use `useQuery()` to get `reviews` and `loading`, and it should have a similar structure to `<Section>`:

[`src/components/Reviews.js`](https://github.com/GraphQLGuide/guide/blob/10_0.2.0/src/components/Reviews.js)

```js
import React from 'react'
import { gql, useQuery } from '@apollo/client'

import Review from './Review'

const REVIEWS_QUERY = ...

export default () => {
  const { data: { reviews } = {}, loading } = useQuery(REVIEWS_QUERY)

  return (
    <main className="Reviews mui-fixed">
      <div className="Reviews-header-wrapper">
        <header className="Reviews-header">
          <h1>Reviews</h1>
        </header>
      </div>
      <div className="Reviews-content">
        {loading ? (
          <div className="Spinner" />
        ) : (
          reviews.map((review) => <Review key={review.id} review={review} />)
        )}
      </div>
    </main>
  )
}
```

Next up is the `<Review>` component. So far we’ve mostly been using plain HTML tags and CSS classes for styling. For many components of an app, it’s easier to use a library instead of building and styling them ourselves. One of the most popular React component libraries is [Material-UI](http://www.material-ui.com/), based on Google’s [design system](https://material.io/guidelines/material-design/introduction.html). 

> Here are some of the other [major React component libraries](https://blog.bitsrc.io/11-react-component-libraries-you-should-know-178eb1dd6aa4).

We can explore their component demos to find components we want to use to make up a `<Review>`, and we can browse the [material icons listing](https://material.io/icons/). Let’s put each review on a [Card](https://material-ui.com/demos/cards/), with an [Avatar](https://material-ui.com/demos/avatars/) for the author’s photo, a [MoreVert](https://material.io/tools/icons/?icon=more_vert&style=baseline) and [Menu](https://material-ui.com/demos/menus/) for editing and deleting, and a more prominent [FavoriteBorder](https://material.io/tools/icons/?icon=favorite_border&style=baseline) as a bottom action:

[`src/components/Reviews.js`](https://github.com/GraphQLGuide/guide/blob/10_0.2.0/src/components/Reviews.js)

```js
import React, { useState } from 'react'
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  IconButton,
  Typography,
  Avatar,
  Menu,
  MenuItem,
} from '@material-ui/core'
import {
  MoreVert,
  Favorite,
  FavoriteBorder,
  Star,
  StarBorder,
} from '@material-ui/icons'
import formatDistanceToNow from 'date-fns/formatDistanceToNow'
import times from 'lodash/times'

const FavoriteButton = ({ favorited }) => {
  function toggleFavorite() {}

  return (
    <IconButton onClick={toggleFavorite}>
      {favorited ? <Favorite /> : <FavoriteBorder />}
    </IconButton>
  )
}

const StarRating = ({ rating }) => (
  <div>
    {times(rating, (i) => (
      <Star key={i} />
    ))}
    {times(5 - rating, (i) => (
      <StarBorder key={i} />
    ))}
  </div>
)

export default ({ review }) => {
  const { text, stars, createdAt, favorited, author } = review

  const [anchorEl, setAnchorEl] = useState()

  function openMenu(event) {
    setAnchorEl(event.currentTarget)
  }

  function closeMenu() {
    setAnchorEl(null)
  }

  function editReview() {
    closeMenu()
  }

  function deleteReview() {
    closeMenu()
  }

  function toggleFavorite() {}

  const LinkToProfile = ({ children }) => (
    <a
      href={`https://github.com/${author.username}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  )

  return (
    <div>
      <Card className="Review">
        <CardHeader
          avatar={
            <LinkToProfile>
              <Avatar alt={author.name} src={author.photo} />
            </LinkToProfile>
          }
          action={
            <IconButton onClick={openMenu}>
              <MoreVert />
            </IconButton>
          }
          title={<LinkToProfile>{author.name}</LinkToProfile>}
          subheader={stars && <StarRating rating={stars} />}
        />
        <CardContent>
          <Typography component="p">{text}</Typography>
        </CardContent>
        <CardActions>
          <Typography className="Review-created">
            {formatDistanceToNow(createdAt)} ago
          </Typography>
          <div className="Review-spacer" />
          <FavoriteButton {...review} />
        </CardActions>
      </Card>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
        <MenuItem onClick={editReview}>Edit</MenuItem>
        <MenuItem onClick={deleteReview}>Delete</MenuItem>
      </Menu>
    </div>
  )
}
```

The `MoreVert` button controls whether the `Menu` is open and where it is placed (or "anchored").

We should now see a list of the 20 most recent reviews! 💃

## Optimistic updates

> If you’re jumping in here, `git checkout 10_0.2.0` (tag [`10_0.2.0`](https://github.com/GraphQLGuide/guide/tree/10_0.2.0)). Tag [`11_0.2.0`](https://github.com/GraphQLGuide/guide/tree/11_0.2.0) contains all the code written in this section.

Optimistic UI is when the client acts as if a user action has immediate effect instead of waiting for a response from the server. For example, normally if the user adds a comment to a blog post, the client sends the mutation to the server, and when the server responds with the new comment, the client adds it to the cache, which updates the comment query results, which re-renders the page. Optimistic UI is when the client sends the mutation to the server and updates the cache at the same time, not waiting for a response—*optimistically* assuming that the comment will be successfully saved to the database.

Let’s write a simple example of an optimistic update for favoriting or unfavoriting a review. We can find in the [Playground](https://api.graphql.guide/play) a mutation called `favoriteReview` which takes the review ID and whether the user is favoriting or unfavoriting. First we write the mutation and add it to our component with `useMutation()`:

[`src/components/Review.js`](https://github.com/GraphQLGuide/guide/blob/11_0.2.0/src/components/Review.js)

```js
import { gql, useMutation } from '@apollo/client'

const FAVORITE_REVIEW_MUTATION = gql`
  mutation FavoriteReview($id: ObjID!, $favorite: Boolean!) {
    favoriteReview(id: $id, favorite: $favorite) {
      favorited
    }
  }
`

const FavoriteButton = ({ id, favorited }) => {
  const [favorite] = useMutation(FAVORITE_REVIEW_MUTATION)

  function toggleFavorite() {
    favorite({
      variables: { id, favorite: !favorited },
    })
  }

  return (
    <IconButton onClick={toggleFavorite}>
      {favorited ? <Favorite /> : <FavoriteBorder />}
    </IconButton>
  )
}
```

Now when we click a review’s heart outline icon, it should change to the filled-in icon... right? 😁 But nothing’s happening. Let’s investigate with [Apollo devtools](../client/#devtools). We can open it on our page to the Mutations section. Then when we click a favorite button, `FavoriteReview` shows up in the Mutation log. So we know the mutation is getting called. And when we click on the log entry, we can see that the argument variables are given correctly:

![Favorite mutation in the log](../img/favorite-mutation.png)

So maybe the issue is with the server’s response? Let’s look at that in the Network tab. In the Name section on the left, scroll down to the bottom, and when we click the favorite button again, a new entry should appear. When we click on that, we should see the Headers tab, which at the top says it was an HTTP POST to `https://api.graphql.guide/graphql` (which is the case for all of our GraphQL queries and mutations). It also says the response status code was "200 OK", so we know the server responded without an error. If we scroll to the bottom, we’ll see the Request Payload, which has `operationName: FavoriteReview` and the correct mutation string and variables. Now if we switch to the Response tab, we see:

`{"data":{"favoriteReview":{"favorited":true,"__typename":"Review"}}}`

The server is giving us the correct response, so it looks like the mutation did succeed. Let’s try reloading the page. Now we see that the review did get favorited. Why was the UI not updating? 

We forgot to include `id` in the response selection set, so Apollo didn’t know which part of the cache to update with `favorited: true`. When we add `id`, it works:

```js
const FAVORITE_REVIEW_MUTATION = gql`
  mutation FavoriteReview($id: ObjID!, $favorite: Boolean!) {
    favoriteReview(id: $id, favorite: $favorite) {
      id
      favorited
    }
  }
`
```

![Delayed favoriting](../img/delayed-favoriting.gif)
[*gif: Delayed favoriting*](http://res.cloudinary.com/graphql/guide/delayed-favoriting.gif)

While it works now, we can probably notice a delay between when we click the heart and when it changes. If we don’t, we can switch from "Online" to "Fast 3G" in the dropdown on the far right top of the Network tab in Chrome devtools (which simulates the higher latency of mobile networks), and we’ll notice a two-second delay before the icon changes. Users of our app who are on mobile or on computers far away from our servers notice the delay. Let’s improve their experience by updating the icon immediately. (In reality, it will take some milliseconds to run the Apollo and React code and paint a new screen, but the delay should be imperceptible.)

We can provide an [`optimisticResponse`](https://www.apollographql.com/docs/react/api/react/hooks/#options-2) to our `favorite()` mutation:

[`src/components/Review.js`](https://github.com/GraphQLGuide/guide/blob/11_0.2.0/src/components/Review.js)

```js
  function toggleFavorite() {
    favorite({
      variables: { id, favorite: !favorited },
      optimisticResponse: {
        favoriteReview: {
          __typename: 'Review',
          id,
          favorited: !favorited,
        },
      },
    })
  }
```

`__typename` is an automatically provided field for the type being returned. We’re mimicking the response from the server, which we saw had `"__typename":"Review"`:

``{"data":{"favoriteReview":{"favorited":true,"__typename":"Review"}}}``

The type name, along with the `id`, will allow Apollo to figure out which review object in the cache to update with the new `favorited` value. Now we see that the icon updates right away, even when we set the network speed to fast or slow 3G.

![Optimistic favoriting](../img/optimistic-favoriting.gif)
[*gif: Optimistic favoriting*](http://res.cloudinary.com/graphql/guide/optimistic-favoriting.gif)

In the next section, we’ll implement a more flexible and complex form of optimistic updating.

## Arbitrary updates

> If you’re jumping in here, `git checkout 11_0.2.0` (tag [`11_0.2.0`](https://github.com/GraphQLGuide/guide/tree/11_0.2.0)). Tag [`12_0.2.0`](https://github.com/GraphQLGuide/guide/tree/12_0.2.0) contains all the code written in this section.

In the previous section ([Optimistic updating](#optimistic-updating)), we changed the Apollo cache using the mutation’s `optimisticResponse` option. But that method only let us set the mutation response—an object of type `Review`. Sometimes we need to update different parts of the cache. For our next piece of UI, we’ll need to update the `User` object, and we’ll do so with some new functions—[cache.readQuery()](https://www.apollographql.com/docs/react/caching/cache-interaction/#readquery) and [cache.writeQuery()](https://www.apollographql.com/docs/react/caching/cache-interaction/#writequery-and-writefragment).

In the header of the Reviews page, let’s add the total count of favorited reviews:

![Review count](../img/review-count.png)

First we need to think about how to get the count. We can’t just count how many reviews in the cache have `favorited: true`, because we only have the most recent 20. And fetching all the reviews from the server would be a lot of data on the wire, a lot of memory taken up on the client, and a long list to count through. Instead let’s fetch the current user’s `favoriteReviews` field. When we want to know more about the current user, we need to go back to our `useUser()` hook and add the field to our `USER_QUERY`:

[`src/lib/useUser.js`](https://github.com/GraphQLGuide/guide/blob/12_0.2.0/src/lib/useUser.js)

```js
const USER_QUERY = gql`
  query UserQuery {
    currentUser {
      ...
      favoriteReviews {
        id
      }
    }
  }
```

Since we’re just counting the length, we don’t need many `favoriteReviews` sub-fields—just the `id`. We add the hook to `<Reviews>` to the get the `user`, and then we get the length of the `user.favoriteReviews` array to display as the count:

[`src/components/Reviews.js`](https://github.com/GraphQLGuide/guide/blob/12_0.2.0/src/components/Reviews.js)

```js
import { gql, useQuery } from '@apollo/client'
import get from 'lodash/get'
import { Favorite } from '@material-ui/icons'

import { useUser } from '../lib/useUser'

export default () => {
  const { data: { reviews } = {}, loading } = useQuery(REVIEWS_QUERY)

  const { user } = useUser()
  const favoriteCount = get(user, 'favoriteReviews.length')

  return (
    <main className="Reviews mui-fixed">
      <div className="Reviews-header-wrapper">
        <header className="Reviews-header">
          {favoriteCount ? (
            <div className="Reviews-favorite-count">
              <Favorite />
              {favoriteCount}
            </div>
          )}
          <h1>Reviews</h1>
        </header>
    ...
  )
}
```

Now if we have a non-zero favorite count, we should see it in the Reviews header. However, when we favorite reviews, the count doesn’t go up as it should. We have to reload the page in order to get the count displayed accurately again. From this we know that when we favorite, the user’s `favoriteReviews` list is getting updated on the server, but not on the client. In order to update it on the client, we add another option to our `useMutation()` hook: [`update`](https://www.apollographql.com/docs/react/api/react/hooks/#options-2).

```js
const READ_USER_FAVORITES = gql`
  query ReadUserFavorites {
    currentUser {
      id
      favoriteReviews {
        id
      }
    }
  }
`

const FavoriteButton = ({ id, favorited }) => {
  const [favorite] = useMutation(FAVORITE_REVIEW_MUTATION, {
    update: (cache, { data: { favoriteReview } }) => {
      const { currentUser } = cache.readQuery({ query: READ_USER_FAVORITES })
      let newUser

      if (favoriteReview.favorited) {
        newUser = {
          ...currentUser,
          favoriteReviews: [
            ...currentUser.favoriteReviews,
            { id, __typename: 'Review' },
          ],
        }
      } else {
        newUser = {
          ...currentUser,
          favoriteReviews: currentUser.favoriteReviews.filter(
            (review) => review.id !== id
          ),
        }
      }

      cache.writeQuery({
        query: READ_USER_FAVORITES,
        data: { currentUser: newUser },
      })
    },
  })

  function toggleFavorite() { ... }

  return (
    <IconButton onClick={toggleFavorite}>
      {favorited ? <Favorite /> : <FavoriteBorder />}
    </IconButton>
  )
}
```

The `update()` function is used to update the cache after a mutation. It is given as arguments the `cache` and the result of the mutation. Because we’re providing an `optimisticResponse`, `update()` will be called twice: once with the `optimisticResponse`, and once with the response from the server. We can use the `cache` to read and write data from and to the cache. To read data, we write a query for the data we want to change (in this case `currentUser.favoriteReviews`). To differentiate between queries we send to the server and queries we write just for reading from the cache, we start the name with "Read": `ReadUserFavorites`. We give the query to [`cache.readQuery()`](https://www.apollographql.com/docs/react/caching/cache-interaction/#readquery), and we get back the data. Then we modify the data (either adding or removing a bare-bones `Review` object with an `id` and `__typename`—it doesn’t need to be a complete `Review` because we just want the count to update). Finally, we write the modified data back to the cache with [`cache.writeQuery()`](https://www.apollographql.com/docs/react/caching/cache-interaction/#writequery-and-writefragment). 

For example, if we read this from the cache:

```js
{
  currentUser: {
    __typename: 'User',
    favoriteReviews: [{
      __typename: 'Review',
      id: 'foo'
    }]
  }
}
```

and we favorited a review with ID `'bar'`, then we would write this data object back to the cache:

```js
{
  currentUser: {
    __typename: 'User',
    favoriteReviews: [{
      __typename: 'Review',
      id: 'foo'
    }, {
      __typename: 'Review',
      id: 'bar'
    }]
  }
}
```

Then Apollo would update `USER_QUERY`’s user prop, which would update the `user` in `<Reviews>`, which would find a new `user.favoriteReviews.length` value and display it. We can see that this process works in our app:

![Updating favorite count](../img/updating-favorite-count.gif)
[*gif: Updating favorite count*](http://res.cloudinary.com/graphql/guide/updating-favorite-count.gif) 

In our `update()` function, we create a `newUser` object because we can’t mutate the `currentUser` we read from the cache. If we try, for example with a `.push()`, we get an error like this:

```js
currentUser.favoriteReviews.push({ id, __typename: 'Review' }
```

```
index.js:1 TypeError: Cannot add property 1, object is not extensible
    at Array.push (<anonymous>)
    at update (Review.js:52)
    ...
```

In the [next section](#creating-reviews), we’ll write an `update()` function that adds an item to a list. We can also use `readQuery()` and `writeQuery()` outside of a mutation—we can use the [`useApolloClient()`](https://www.apollographql.com/docs/react/api/react/hooks/#useapolloclient) hook to get our client instance and then call [any client functions](https://www.apollographql.com/docs/react/api/core/ApolloClient/#apolloclient-functions), including `client.readQuery()` and `.writeQuery()`.

There are two more functions we can use—[`readFragment()`](https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.readFragment) and [`writeFragment()`](https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.writeFragment). `readQuery` can only read data from a root query type like `currentUser{ ... }` or `reviews(limit: 20){ ... }`. `readFragment` can read from any normalized object in our cache by its cache ID. 

A *cache ID* is the identifier Apollo uses to [normalize](../client/#caching) objects. [By default](https://www.apollographql.com/docs/react/caching/cache-configuration/#default-identifier-generation), it is `[__typename]:[id]`, for instance: `Review:5a6676ec094bf236e215f488`. We can see these IDs on the left of the Cache section in Apollo devtools:

![View of the cache in devtools](../img/devtools-cache.png)

On the left is the cache IDs of all objects in the cache. There are reviews with their random IDs, as well as sections with cache IDs like `Section:1-1`. We can read a section by its cache ID like this:

```js
import { useApolloClient } from '@apollo/client'

function MyComponent() {
  const client = useApolloClient()

  client.readFragment({
    id: 'Section:intro',
    fragment: gql`
      fragment exampleSection on Section {
        id
        views
        content
      }
    `
  })
}
```

The `readFragment()` arguments are the cache ID and a [fragment](../query-language/#fragments). It returns just that section:

```js
{
  content: "..."
  id: "intro"
  views: 67
  __typename: "Section"
  Symbol(id): "Section:intro"
}
```

Similarly, `writeFragment()` allows us to write to an object with a specific cache ID:

```js
client.writeFragment({
  id: 'Section:intro',
  fragment: gql`
    fragment sectionContent on Section {
      content
      __typename
    }
  `,
  data: {
    content: 'overwritten', 
    __typename: 'Section'
  }
})
```

If we ran this and then navigated to `/Introduction`, the section text would have changed to just the word "overwritten" 😅. Not to worry—we didn’t permanently overwrite a section of the book. It’s just changing the local client-side cache; when we reload, the actual Introduction text gets refetched from the server. We can try it out in the console, but first we have to (temporarily) add this line in any of our js files that imports `gql`:

```js
window.gql = gql
```

And then we replace `client` with `__APOLLO_CLIENT__`, which is a global variable available in development.

![Writing a fragment to the cache](../img/write-fragment.gif)
[*gif: Writing a fragment to the cache*](http://res.cloudinary.com/graphql/guide/write-fragment.gif)

## Creating reviews

> If you’re jumping in here, `git checkout 12_0.2.0` (tag [`12_0.2.0`](https://github.com/GraphQLGuide/guide/tree/12_0.2.0)). Tag [`13_0.2.0`](https://github.com/GraphQLGuide/guide/tree/13_0.2.0) contains all the code written in this section.

Adding the ability to create reviews will give us the opportunity to look at a more complex mutation and a different kind of `update()` function—we’ll be updating our list of reviews with a new review so that it shows up at the top of the Reviews page.

Let’s start out by adding a FAB ([floating action button](https://material-ui.com/demos/buttons/#floating-action-buttons)) that appears on the Reviews page when the user is logged in. The FAB will open a modal that has the form for a new review. Whether the modal is open is a state variable, so we need to convert `<Reviews>` from a function to a stateful component:

[`src/components/Reviews.js`](https://github.com/GraphQLGuide/guide/blob/13_0.2.0/src/components/Review.js)

```js
import React, { useState } from 'react'
import { Favorite, Add } from '@material-ui/icons'
import { Fab, Modal } from '@material-ui/core'

import AddReview from './AddReview'

export default () => {
  const [addingReview, setAddingReview] = useState(false)

  const { data: { reviews } = {}, loading } = useQuery(REVIEWS_QUERY)

  const { user } = useUser()
  const favoriteCount = get(user, 'favoriteReviews.length')

  return (
    ...

        {user && (
          <div>
            <Fab
              onClick={() => setAddingReview(true)}
              color="primary"
              className="Reviews-add"
            >
              <Add />
            </Fab>

            <Modal open={addingReview} onClose={() => setAddingReview(false)}>
              <AddReview done={() => setAddingReview(false)} />
            </Modal>
          </div>
        )}
      </div>
    </main>
  )
}
```

`<AddReview>` will need a way to let us know it’s done (so we can close the modal), so we add a `done` prop. To set a primary color for the FAB that matches the rest of the site, we need a Material UI [theme](https://material-ui.com/customization/themes/). We can see from the [default theme](https://material-ui.com/customization/default-theme/) that `palette.primary.main` is the name of the value to change:

[`src/index.js`](https://github.com/GraphQLGuide/guide/blob/13_0.2.0/src/index.js)

```js
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles'

const GRAPHQL_PINK = '#e10098'

const theme = createMuiTheme({
  palette: { primary: { main: GRAPHQL_PINK } },
  typography: { useNextVariants: true },
})

render(
  <BrowserRouter>
    <ApolloProvider client={client}>
      <MuiThemeProvider theme={theme}>
        <App />
      </MuiThemeProvider>
    </ApolloProvider>
  </BrowserRouter>,
  document.getElementById('root')
)
```

Next up is the `<AddReview>` form:

[`src/components/AddReview.js`](https://github.com/GraphQLGuide/guide/blob/13_0.2.0/src/components/AddReview.js)

```js
import React, { useState } from 'react'
import StarInput from 'react-star-rating-component'
import { Button, TextField } from '@material-ui/core'
import { Star, StarBorder } from '@material-ui/icons'
import pick from 'lodash/pick'

import { validateReview } from '../lib/validators'

const GREY = '#0000008a'

export default ({ done }) => {
  const [text, setText] = useState(),
    [stars, setStars] = useState(),
    [errorText, setErrorText] = useState()

  function handleSubmit(event) {
    event.preventDefault()

    const errors = validateReview({ text, stars })
    if (errors.text) {
      setErrorText(errors.text)
      return
    }

    // TODO send mutation

    done()
  }

  return (
    <form className="AddReview" autoComplete="off" onSubmit={handleSubmit}>
      <TextField
        className="AddReview-text"
        label="Review text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        helperText={errorText}
        error={!!errorText}
        multiline
        rowsMax="10"
        margin="normal"
        autoFocus={true}
      />

      <StarInput
        className="AddReview-stars"
        starCount={5}
        editing={true}
        value={stars}
        onStarClick={(newStars) => setStars(newStars)}
        renderStarIcon={(currentStar, rating) =>
          currentStar > rating ? <StarBorder /> : <Star />
        }
        starColor={GREY}
        emptyStarColor={GREY}
        name="stars"
      />

      <div className="AddReview-actions">
        <Button className="AddReview-cancel" onClick={done}>
          Cancel
        </Button>

        <Button type="submit" color="primary" className="AddReview-submit">
          Add review
        </Button>
      </div>
    </form>
  )
}
```

Before we mutate, we need to validate the form input and show the error message, if any. We’ll use the [revalidate](http://revalidate.jeremyfairbank.com/) library:

[`src/lib/validators.js`](https://github.com/GraphQLGuide/guide/blob/13_0.2.0/src/lib/validators.js)

```js
import {
  createValidator,
  composeValidators,
  combineValidators,
  isRequired,
  hasLengthLessThan,
} from 'revalidate'

const isString = createValidator(
  (message) => (value) => {
    if (!(typeof value === 'string')) {
      return message
    }
  },
  (field) => `${field} must be a String`
)

export const validateReview = combineValidators({
  text: composeValidators(
    isRequired,
    isString,
    hasLengthLessThan(500)
  )('Review text'),
  stars: createValidator(
    (message) => (value) => {
      if (![null, 1, 2, 3, 4, 5].includes(value)) {
        return message
      }
    },
    (field) => `${field} must be a number 1–5`
  )('Stars'),
})
```

We use [`createValidator`](http://revalidate.jeremyfairbank.com/usage/createValidator.html) to create custom validator functions, [`composeValidator`](http://revalidate.jeremyfairbank.com/usage/composeValidators.html) to compose multiple validator functions together, and [`combineValidators`](http://revalidate.jeremyfairbank.com/usage/combineValidators.html) to combine our validators in an object matching our data format, with `text` and `stars` fields. Here are some example outputs:

```js
validateReview({
  text: 1,
  stars: 5
})

// => {text: "Review text must be a String"}

validateReview({
  text: 'my review',
  stars: 'a string'
})

// => {stars: Stars must be a number 1–5`}
```

We don’t need to check for a `stars` error because our `<StarInput>` doesn’t produce an invalid value. But we include it in the validator so we can use the same code on the server.

Next we add the mutation! In the [Playground](https://api.graphql.guide/play), we find the `createReview` mutation. (The convention is that if the data type is `Foo`, the basic [CUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) mutations are called `createFoo`, `updateFoo`, and `deleteFoo`.) We’re used to `gql` and `useMutation()`, but, this time, we’ll have a larger `optimisticResponse` and a different kind of `update()`:

[`src/components/AddReview.js`](https://github.com/GraphQLGuide/guide/blob/13_0.2.0/src/components/AddReview.js)

```js
import { gql, useMutation } from '@apollo/client'
import pick from 'lodash/pick'

import { useUser } from '../lib/useUser'

const ADD_REVIEW_MUTATION = gql`
  mutation AddReview($input: CreateReviewInput!) {
    createReview(input: $input) {
      id
      text
      stars
      createdAt
      favorited
      author {
        id
        name
        photo
        username
      }
    }
  }
`

export default ({ done }) => {
  ...

  const { user } = useUser()

  const [addReview] = useMutation(ADD_REVIEW_MUTATION, {
    update: (store, { data: { createReview: newReview } }) => {
      // TODO
    },
  })

  function handleSubmit(event) {
    event.preventDefault()

    const errors = validateReview({ text, stars })
    if (errors.text) {
      setErrorText(errors.text)
      return
    }

    addReview({
      variables: {
        input: { text, stars },
      },
      optimisticResponse: {
        createReview: {
          __typename: 'Review',
          id: null,
          text,
          stars,
          createdAt: new Date(),
          favorited: false,
          author: pick(user, ['__typename', 'id', 'name', 'photo', 'username']),
        },
      },
    })
    done()
  }

  return ( ... )
}
```

We don’t know what the server-side `id` will be, so we set it to `null`, and it will be updated by Apollo when the server response arrives. Similarly, `createdAt` will be a little different on the server, but not enough to make a difference for optimistic display. We know that `favorited` is `false` because the user hasn’t had a chance to favorite the new review, and the `author` is the current user. 

So far our mutations have updated an existing object in the cache (the one with the same `id`), and that object, since it was part of a query result, triggers a component re-render. But this time, there is no existing object: we’re adding a new object to the cache. And the new object isn’t part of a query result. Apollo will add an object of type `Review` with `id: null` to the cache, but it won’t update the `<Reviews>` component’s `useQuery(REVIEWS_QUERY)` because Apollo doesn’t know the new review object should be part of the `REVIEWS_QUERY` results. So we have to change the `REVIEWS_QUERY` results ourselves in the `update` function. 
 
But first we need access to `REVIEWS_QUERY`, a variable inside `Reviews.js`. We’d run into trouble exporting it from `Reviews.js` because we’d have an import cycle—`Reviews.js` imports `AddReview`. So let’s create a new folder for GraphQL documents, `src/graphql/`, and make a new file:

[`src/graphql/Review.js`](https://github.com/GraphQLGuide/guide/blob/13_0.2.0/src/graphql/Review.js)

```js
import gql from 'graphql-tag'

export const REVIEWS_QUERY = gql`
  query ReviewsQuery {
    reviews(limit: 20) {
      id
      text
      stars
      createdAt
      favorited
      author {
        id
        name
        photo
        username
      }
    }
  }
`
```

And in `Reviews.js` and `AddReview.js`, we import it:

[`src/components/Reviews.js`](https://github.com/GraphQLGuide/guide/blob/13_0.2.0/src/components/Reviews.js)

```js
import { REVIEWS_QUERY } from '../graphql/Review'
```

[`src/components/AddReview.js`](https://github.com/GraphQLGuide/guide/blob/13_0.2.0/src/components/AddReview.js)

```js
import { REVIEWS_QUERY } from '../graphql/Review'

...

  const [addReview] = useMutation(ADD_REVIEW_MUTATION, {
    update: (store, { data: { createReview: newReview } }) => {
      const { reviews } = store.readQuery({
        query: REVIEWS_QUERY,
      })
      store.writeQuery({
        query: REVIEWS_QUERY,
        data: { reviews: [newReview, ...reviews] },
      })
    },
  })
```

The second parameter to [`update`](https://www.apollographql.com/docs/react/basics/mutations.html#graphql-mutation-options-update) has the mutation response—it’s called first with the optimistic response, and then with the server response. So initially, `data.createReview` is the `optimisticResponse.createReview` object we just created. First we call `readQuery`, reading the current results from the cache. Then we call `writeQuery()` with the new array that has `newReview` at the beginning so that it shows up first, at the top of the page. 

![Optimistically adding review](../img/adding-review.gif)
[*gif: Optimistically adding review*](http://res.cloudinary.com/graphql/guide/adding-review.gif)

## Using fragments

[Fragments](../query-language/#fragments) are good for more than just [reading from and writing to the cache](#arbitrary-updates): they also can [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) up our queries and mutations. The selection set on `reviews` in the query we just relocated was the same as the selection set on `createReview` we used in our mutation. Let’s put that selection set in a fragment:

[`src/graphql/Review.js`](https://github.com/GraphQLGuide/guide/blob/13_0.2.0/src/graphql/Review.js)

```js
import gql from 'graphql-tag'

export const REVIEW_ENTRY = gql`
  fragment ReviewEntry on Review {
    id
    text
    stars
    createdAt
    favorited
    author {
      id
      name
      photo
      username
    }
  }
`

export const REVIEWS_QUERY = gql`
  query ReviewsQuery {
    reviews(limit: 20) {
      ...ReviewEntry
    }
  }
  ${REVIEW_ENTRY}
`
```

We can’t name the fragment `Review` because that’s the name of a type, so the convention is `ReviewEntry`. 

> If we were using prop types, we could now greatly simplify our `Review.propTypes` with our new fragment and the `propType()` function from [`graphql-anywhere`](https://github.com/apollographql/apollo-client/tree/master/packages/graphql-anywhere):

```js
import { propType } from 'graphql-anywhere'
import { REVIEW_ENTRY } from '../graphql/Review'

Review.propTypes = {
  review: propType(REVIEW_ENTRY).isRequired,
  favorite: PropTypes.func.isRequired
}
```

> `propType()` generates a React `propTypes`-compatible type-checking function for the `review` object from our `ReviewEntry` fragment. 

Lastly, we use the fragment in `AddReview.js`:

[`src/components/AddReview.js`](https://github.com/GraphQLGuide/guide/blob/13_0.2.0/src/components/AddReview.js)

```js
import { REVIEW_ENTRY } from '../graphql/Review'

const ADD_REVIEW_MUTATION = gql`
  mutation AddReview($input: CreateReviewInput!) {
    createReview(input: $input) {
      ...ReviewEntry
    }
  }
  ${REVIEW_ENTRY}
`
```

## Deleting

> If you’re jumping in here, `git checkout 13_0.2.0` (tag [`13_0.2.0`](https://github.com/GraphQLGuide/guide/tree/13_0.2.0)). Tag [`14_0.2.0`](https://github.com/GraphQLGuide/guide/tree/14_0.2.0) contains all the code written in this section.

Next let’s see how deleting an item works. We can add a dialog box confirming deletion, and when it’s confirmed, we’ll send the `removeReview` mutation:

[`src/components/Review.js`](https://github.com/GraphQLGuide/guide/blob/14_0.2.0/src/components/Review.js)

```js
import  {  
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button
} from 'material-ui/core'

const REMOVE_REVIEW_MUTATION = gql`
  mutation RemoveReview($id: ObjID!) {
    removeReview(id: $id)
  }
`

export default ({ review }) => {
  const { id, text, stars, createdAt, author } = review

  const [anchorEl, setAnchorEl] = useState()
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)

  const [removeReview] = useMutation(REMOVE_REVIEW_MUTATION, {

  ...

  function deleteReview() {
    closeMenu()
    removeReview({ variables: { id } })
  }

  ...

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
        <MenuItem onClick={editReview}>Edit</MenuItem>
        <MenuItem
          onClick={() => {
            closeMenu()
            setDeleteConfirmationOpen(true)
          }}
        >
          Delete
        </MenuItem>
      </Menu>

      <Dialog
        open={deleteConfirmationOpen}
        onClose={() => setDeleteConfirmationOpen(false)}
      >
        <DialogTitle>{'Delete review?'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            A better UX is probably just letting you single-click delete with an
            undo toast, but that's harder to code right{' '}
            <span role="img" aria-label="grinning face">
              😄
            </span>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmationOpen(false)}>
            Cancel
          </Button>
          <Button onClick={deleteReview} color="primary" autoFocus>
            Sudo delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
```

We see in the [Playground schema](https://api.graphql.guide/play) that `removeReview` resolves to a scalar type (`Boolean`), so unlike our previous mutations, it doesn’t have a selection set.

![Schema: removeReview](../img/schema-removeReview.png)

When we try out the new delete dialog, we notice that the review remains on the page. Did it work? We can check on the devtools Network tab, selecting the last `graphql` request, and switching to the Response tab: 

```json
{"data":{"removeReview":true}}
```

![Server response to removeReview](../img/remove-review-response.gif)
[*gif: Server response to removeReview*](http://res.cloudinary.com/graphql/guide/remove-review-response.gif)

So the deletion was successful (and when we refresh the page, the review is gone), but Apollo client didn’t know it should remove the review object from the cache. We can tell it to do so with `update()`:

```js
const [removeReview] = useMutation(REMOVE_REVIEW_MUTATION, {
  update: (cache) => {
    const { reviews } = cache.readQuery({ query: REVIEWS_QUERY })
    cache.writeQuery({
      query: REVIEWS_QUERY,
      data: { reviews: reviews.filter((review) => review.id !== id) },
    })

    const { currentUser } = cache.readQuery({ query: READ_USER_FAVORITES })
    cache.writeQuery({
      query: READ_USER_FAVORITES,
      data: {
        currentUser: {
          ...currentUser,
          favoriteReviews: currentUser.favoriteReviews.filter(
            (review) => review.id !== id
          ),
        },
      },
    })
  },
})
```

We need to remove the review not only from the `REVIEWS` query, but also from `currentUser.favoriteReviews`—otherwise, when we delete a favorited review, the count in the header of the reviews page will be inaccurate. 

We’re using `update()` without an `optimisticResponse`, which means it will only be called once, when the server response arrives. We’ll notice a delay between clicking `SUDO DELETE` and the review being removed from the page. If we want it to be removed immediately, we need an `optimisticResponse`, even if we’re not using the optimistic data:

```js
function deleteReview() {
  closeMenu()
  removeReview({
    variables: { id },
    optimisticResponse: {
      removeReview: true,
    },
  })
}
```

![Removing a review](../img/remove-review.gif)
[*gif: Removing a review*](http://res.cloudinary.com/graphql/guide/remove-review.gif)

## Error handling

Background: [GraphQL errors](../understanding-graphql/security-&-error-handling.md)

> If you’re jumping in here, `git checkout 14_0.2.0` (tag [`14_0.2.0`](https://github.com/GraphQLGuide/guide/tree/14_0.2.0)). Tag [`15_0.2.0`](https://github.com/GraphQLGuide/guide/tree/15_0.2.0) contains all the code written in this section.

When we try to delete a review that isn’t ours, nothing happens. In the console, we see:

```
index.ts:49 Uncaught (in promise) Error: unauthorized
    at new ApolloError (index.ts:49)
    at Object.next (QueryManager.ts:223)
    ...
    at createHttpLink.ts:129
```

Let’s break that down:

- `Uncaught (in promise) Error: unauthorized`—There was a Promise that threw an error, and our code didn’t catch it.
- `at new ApolloError (index.ts:49)`—The error is coming from Apollo code.
- `at createHttpLink.ts:129`—The error is coming from our HTTP link, so it’s probably an error from the server. We can confirm this by looking at the network tab, finding the request to `api.graphql.guide` that has `operationName: "RemoveReview"` in the Request Payload, and seeing that the Response tab shows JSON with an `"errors"` attribute.

![Network tab of DevTools with the error response](../img/remove-review-network-error.png)

- `unauthorized`—This is the error message from the GraphQL server.

So the Guide server is saying that we’re not authorized to execute that `removeReview` mutation. This makes sense, because it’s not our review. We should have the app tell the user that, though. The `removeReview()` mutation function we get from `useMutation()` returns a Promise. This Promise will throw GraphQL errors, which we can catch like this:

```js
removeReview({ ... }).catch(e => console.log(e.graphQLErrors))
```

`e.graphQLErrors` is an array of all the errors returned from the server. In this case, we just have one:

```js
[
  {
    message: "unauthorized",
    locations: [{"line":2,"column":3}],
    path: ["removeReview"]
  }
]
```

We can now alert the user of the error, depending on whether we find an "unauthorized" message:

[`src/components/Review.js`](https://github.com/GraphQLGuide/guide/blob/15_0.2.0/src/components/Review.js)

```js
import find from 'lodash/find'

  removeReview({
    variables: { id },
    optimisticResponse: {
      removeReview: true,
    },
  }).catch(e => {
    if (find(e.graphQLErrors, { message: 'unauthorized' })) {
      alert('👮‍♀️✋ You can only delete your own reviews!')
    }
  })
```

But what about other errors? We could get errors about anything bad happening on the server, from dividing by zero to a database query failing. We could add an `else` statement:

```js
} else {
  alert('Unexpected error occurred')
}
```      

But that wouldn’t cover unexpected errors occurring in all of our other queries and mutations. We can avoid peppering these unexpected-error alerts all over our code by checking errors globally as they arrive from the network. Whenever we want to do some logic that all requests or responses go through, we use a link. At the end of the [Logging in](authentication.md#logging-in) section, we used a `setContext` link to set an authentication header on all outgoing HTTP requests. Here we can use an [`apollo-link-error`](https://github.com/apollographql/apollo-link/tree/master/packages/apollo-link-error). In `lib/apollo.js`, we rename our `link` to be `networkLink`, and then:

[`src/lib/apollo.js`](https://github.com/GraphQLGuide/guide/blob/15_0.2.0/src/lib/apollo.js)

```js
import { errorLink } from './lib/errorLink'

...

const networkLink = split( ... )

const link = errorLink.concat(networkLink)

export const apollo = new ApolloClient({ link, cache })
```

In a chain of links from left to right (where `leftLink.concat(rightLink)`), off the left side of the chain are our React components sending the operations, and off the right side is the network. We put `errorLink` to the left of `networkLink` because we need the GraphQL response coming from the network (off right side) to first go through the `networkLink` (the right end), and then to the `errorLink` (left end), before reaching our code (off left side). We create a new file for `errorLink`:

[`src/lib/errorLink.js`](https://github.com/GraphQLGuide/guide/blob/15_0.2.0/src/lib/errorLink.js)

```js
import { onError } from '@apollo/client/link/error'

const KNOWN_ERRORS = ['unauthorized']

export const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (networkError) {
    console.log(`[Network error]: ${networkError}`)
    return
  }

  if (graphQLErrors) {
    const unknownErrors = graphQLErrors.filter(
      (error) => !KNOWN_ERRORS.includes(error.message)
    )

    if (unknownErrors.length) {
      alert('😳 An unexpected error occurred on the server')
      unknownErrors.map(({ message, locations, path }) =>
        console.log(`[GraphQL error]: Message: ${message}, Path: ${path}`)
      )
    }
  }
})
```

If there’s a known error, like `'unauthorized'`, let’s leave it to the originating component to alert the user, since that component knows the context of the error. For example, in `<Review>`, we can be specific, saying “You can only delete your own reviews!” Whereas if we made the alert in `errorLink`, like, “You are not authorized to view this data or perform this action,” it would be less helpful.

By default, when a GraphQL error is returned from the server, Apollo treats it as a fatal error in the query or mutation. In the case of an unauthorized deletion, the error is thrown from the mutation function, and `update()` isn’t called. This is why the review remains on the page. If we were sending a mutation for which we didn’t care about server errors, and we wanted the `update()` function to always run regardless, we could change the mutation’s default [error policy](https://www.apollographql.com/docs/react/features/error-handling.html#policies) like this:

`src/components/Review.js`

```js
const [removeReview] = useMutation(REMOVE_REVIEW_MUTATION, {
  errorPolicy: 'ignore',
  update: (cache) => { 
    ...
```

Then the call to `removeReview()` would resolve without an error being thrown, even if the server response contained an error, and the review would be removed from the cache and page.

Changing the error policy is more often useful when querying. Let’s see how the default error policy works when querying. We can change the `limit` argument on our `reviews` query to a special value of `-1` that will return demo reviews, some of which have a private `text` field.

> We can also see the effect of error policy in the [Apollo Error Handling Visualizer](https://apollo-visualizer.vercel.app/).

[`src/graphql/Review.js`](https://github.com/GraphQLGuide/guide/blob/15_0.2.0/src/graphql/Review.js)

```js
export const REVIEWS_QUERY = gql`
  query ReviewsQuery {
    reviews(limit: -1) {
```

When we do this query in [Playground](https://api.graphql.guide/play):

```js
{
  reviews(limit: -1) {
    stars
    text
  }
}
```

here’s the response we get back:

```
{
  "data": {
    "reviews": [
      {
        "stars": 5,
        "text": null
      },
      {
        "stars": 4,
        "text": "GraphQL is awesome, but React is soooo 2016. Write me a Vue chapter!"
      },
      {
        "stars": 3,
        "text": null
      }
    ]
  },
  "errors": [
    {
      "message": "unauthorized",
      "locations": [
        {
          "line": 4,
          "column": 5
        }
      ],
      "path": [
        "reviews",
        0,
        "text"
      ]
    },
    {
      "message": "unauthorized",
      "locations": [
        {
          "line": 4,
          "column": 5
        }
      ],
      "path": [
        "reviews",
        2,
        "text"
      ]
    }
  ]
}
```

<!-- [Playground: `query { reviews(limit: -1) { stars text } }`](https://graphqlbin.com/r02EC1) -->

The first and third reviews have private `text` fields, so we see `text: null` in `data.reviews` and the `errors` array has entries for each one with `"unauthorized"` messages. The first error `path` is `reviews.0.text`, corresponding to the 0th review in the `data.reviews` array, and the second error is at `review.2.text`. So the errors match up with the reviews that have `text: null`.

> The Review schema says that `text` is nullable. If `text` had been non-nullable (`text: String!`), then an error in the `text` resolver would have made the entire object `null`—`data` would have been `{ "reviews": null }`.

Let’s see how our app is handling this partially-null data response with an `errors` attribute. It looks like we’re getting an error:

```
Uncaught TypeError: Cannot read property 'map' of undefined
    at push../src/components/Reviews.js.__webpack_exports__.default (Reviews.js:35)
    ...
```

Which corresponds to this line:

```js
reviews.map(review => <Review key={review.id} review={review} />)
```

So it looks like `reviews` is undefined. Let’s also look at `data.error`:

[`src/components/Reviews.js`](https://github.com/GraphQLGuide/guide/blob/15_0.2.0/src/components/Review.js)

```js
  const { data: { reviews } = {}, loading, error } = useQuery(REVIEWS_QUERY)
  console.log('error:', error)
```

It has these fields:

```json
error.stack
error.graphQLErrors
error.networkError
error.message
error.extraInfo
```

and `error.graphQLErrors` looks like this:

```js
[
  {
    message: "unauthorized",
    locations: [{ line: 10, column: 3 }],
    path: [ "reviews", 0, "text" ]
  },
  {
    message: "unauthorized",
    locations: [{ line: 10, column: 3 }],
    path: [ "reviews", 2, "text" ]
  }
]
```

If we want `reviews` to be defined, we can set `errorPolicy` to [`'all'`](https://www.apollographql.com/docs/react/features/error-handling.html#policies):

[`src/components/Review.js`](https://github.com/GraphQLGuide/guide/blob/15_0.2.0/src/components/Review.js)

```js
const { data: { reviews } = {}, loading } = useQuery(REVIEWS_QUERY, {
  errorPolicy: 'all',
})
```

We can handle `text` sometimes being `null` in `<Review>`:

[`src/components/Review.js`](https://github.com/GraphQLGuide/guide/blob/15_0.2.0/src/components/Review.js)

```js
<CardContent>
  {text ? (
    <Typography component="p">{text}</Typography>
  ) : (
    <Typography component="i">Text private</Typography>
  )}
</CardContent>
```

If there were other errors that we thought might result in a null `text` field, we could take different actions based on `error` in `<Reviews>`. If we wanted to ignore all errors (reviews would be defined, and `error` would be undefined), we could set `errorPolicy: 'ignore'`.

![Private reviews](../img/private-reviews.png)

Let’s see what happens when we trigger a different error: first let’s sign out, and then let’s interact with a review. We notice that when we favorite, edit, or delete, the "unexpected error" alert appears:

![Unexpected error alert](../img/unexpected-error.png)

To figure out what it is, we could look at the GraphQL response in the Network panel, or we can just look in the console, since the `errorLink` we made logs unknown errors. There, we find that the error message is `must sign in`, for instance:

```
[GraphQL error]: Message: must sign in, Path: favoriteReview
```

Having a user see this alert isn’t good UX. One way to avoid it is by adding `must sign in` to `KNOWN_ERRORS` in `src/lib/errorLink.js`, and then handling the error in `<Review>` with a message like, “Sign in to favorite a review.” Another way to avoid the error is to just remove the UI controls when the user isn’t signed in 😄. Let’s go with the latter solution, but, before we do, note what happens to the review on the page right after we take the action, before we dismiss the alert: when we favorite, the heart stays filled in; when we delete, the review disappears, and when we edit, the review changes. In each case, when we dismiss the alert, the review changes back to its previous state. This is a great demonstration of optimistic updates—Apollo applies the optimistic change, then it receives an error back from the server, which goes through our `errorLink`, which puts up an alert, which halts JS execution until it is dismissed. Once it’s dismissed, Apollo is able to finish handling the response—it realizes that the mutation was unsuccessful, so it rolls back the optimistic update, restoring our cache to its previous state, which triggers new props being provided to our components, which triggers React to re-render them. 

To remove the UI elements, we check if `user` is defined with `user && <Component />`:

[`src/components/Review.js`](https://github.com/GraphQLGuide/guide/blob/15_0.2.0/src/components/Review.js)

```js
import { useUser } from '../lib/useUser'

export default ({ review }) => {
  const { id, text, stars, createdAt, author } = review

  const { user } = useUser()

  ...

  <CardHeader
    action={
      user && (
        <IconButton onClick={this.openMenu}>
          <MoreVert />
        </IconButton>
      )
    }

    ...

    {user && <FavoriteButton {...review} />}
```

![Hidden review icons](../img/hidden-review-icons.png)

## Editing reviews

> If you’re jumping in here, `git checkout 15_0.2.0` (tag [`15_0.2.0`](https://github.com/GraphQLGuide/guide/tree/15_0.2.0)). Tag [`16_0.2.0`](https://github.com/GraphQLGuide/guide/tree/16_0.2.0) contains all the code written in this section.

The last piece of the reviews page we haven’t implemented yet is editing reviews! Let’s see how much of our `<AddReview>` component we can reuse by renaming it to `<ReviewForm>` and deciding which mutation to call (the update or create mutation) based on the props. We’ll need to add a `<Modal>` with the form to `<Review>` and pass in the review object as a prop:

[`src/components/Review.js`](https://github.com/GraphQLGuide/guide/blob/16_0.2.0/src/components/Review.js)

```js
import { Modal } from '@material-ui/core'

import ReviewForm from './ReviewForm'

export default ({ review }) => {
  
  ...
  
  const [editing, setEditing] = useState(false)

  ...

  function editReview() {
    closeMenu()
    setEditing(true)
  }

  ...

      <Modal open={editing} onClose={() => setEditing(false)}>
        <ReviewForm done={() => setEditing(false)} review={review} />
      </Modal>
    </div>
  )
}
```

The mutation takes the review’s `id` and the new `text` and `stars` fields:

```gql
input UpdateReviewInput {
  text: String!
  stars: Int
}

type Mutation {
  updateReview(id: ObjID!, input: UpdateReviewInput!): Review
}
```

We know whether we’re editing based on the presence of the `review` prop, and we also use it to set initial values for the `text` and `stars` inputs:

[`src/components/ReviewForm.js`](https://github.com/GraphQLGuide/guide/blob/16_0.2.0/src/components/ReviewForm.js)

```js
import classNames from 'classnames'

const EDIT_REVIEW_MUTATION = gql`
  mutation EditReview($id: ObjID!, $input: UpdateReviewInput!) {
    updateReview(id: $id, input: $input) {
      id
      text
      stars
    }
  }
`

export default ({ done, review }) => {
  const [text, setText] = useState(review ? review.text : ''),
    [stars, setStars] = useState(review ? review.stars : null),
    [errorText, setErrorText] = useState()

  ...

  const [editReview] = useMutation(EDIT_REVIEW_MUTATION)

  const isEditing = !!review

  function handleSubmit(event) {
    event.preventDefault()

    const errors = validateReview({ text, stars })
    if (errors.text) {
      setErrorText(errors.text)
      return
    }

    if (isEditing) {
      editReview({
        variables: {
          id: review.id,
          input: { text, stars },
        },
        optimisticResponse: {
          updateReview: {
            __typename: 'Review',
            id: review.id,
            text,
            stars,
          },
        },
      })
    } else {
      addReview({ ... })
    }

    done()
  }

  return (
    <form
      className={classNames('ReviewForm', { editing: isEditing })}
      autoComplete="off"
      onSubmit={handleSubmit}
    >
    
      ...

        <Button type="submit" color="primary" className="AddReview-submit">
          {isEditing ? 'Save' : 'Add review'}
        </Button>
      </div>
    </form>
  )
}
```

When editing a single object, we only need to select the `id` and fields that are changing. When the response arrives (and when the `optimisticResponse` is handled), just those fields are updated in the cache (the other fields like `author` and `favorited` will remain). 

![Editing a review*](http://res.cloudinary.com/graphql/guide/edit-review.gif)
[*gif: Editing a review*](http://res.cloudinary.com/graphql/guide/edit-review.gif)

