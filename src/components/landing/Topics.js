import React, { Fragment } from 'react'
import { Typography } from '@material-ui/core'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import faChalkboardTeacher from '@fortawesome/fontawesome-free-solid/faChalkboardTeacher'
import faGraduationCap from '@fortawesome/fontawesome-free-solid/faGraduationCap'
import faDesktop from '@fortawesome/fontawesome-free-solid/faDesktop'
import faServer from '@fortawesome/fontawesome-free-solid/faServer'
import faReact from '@fortawesome/fontawesome-free-brands/faReact'
import faVuejs from '@fortawesome/fontawesome-free-brands/faVuejs'
import faAppStoreIos from '@fortawesome/fontawesome-free-brands/faAppStoreIos'
import faAndroid from '@fortawesome/fontawesome-free-brands/faAndroid'
import { Link } from 'gatsby'

import './Topics.css'

const topics = [
  {
    icon: faChalkboardTeacher,
    title: 'Beginner introduction',
    text:
      'We start out in Chapter 1 by introducing the basics of GraphQL in contrast to REST. Then in Chapters 2–4, we go through the whole GraphQL specification from its basic building blocks. We also have an extensive Background chapter that covers everything from HTTP to databases to server-side rendering.',
  },
  {
    icon: faGraduationCap,
    title: 'Advanced topics',
    text:
      'In the client chapters, we cover advanced topics like infinite scrolling, local state, prefetching, and persisting. In our server chapter, we cover schema design, four different data sources (as well as how to create your own), security, performance, and more.',
  },
  {
    icon: faDesktop,
    title: 'Frontend',
    text: `Chapters 5–10 are all about the client. You can make an HTTP request to a GraphQL API from anywhere, or you can use an advanced client library with automatic caching and view layer integration. We have chapters on React, Vue, React Native, iOS, and Android.`,
  },
  {
    icon: faServer,
    title: 'Backend',
    text: `If you’re a backend dev, we’ve got you covered. Chapter 11 is our longest chapter, and it goes through all the server topics you could want: server structure, connecting to databases and APIs, subscriptions, custom scalars, authentication, authorization, caching, testing, and more.`,
  },
  {
    icon: faReact,
    title: 'React',
    text:
      'React is becoming the lingua franca of modern web dev, so this is our longest client chapter. We go through everything in the Apollo Client library, including hooks, managing local state, subscriptions, optimistic updates, error handling, pagination, batching, linting, testing, and more.',
  },
  {
    icon: faVuejs,
    title: 'Vue',
    text:
      'Our Vue chapter teaches Apollo Vue’s composition API. Provide an ApolloClient instance and query inside a component’s setup function to get refs with the data, loading status, and error status. Query with variables and options, send mutations, and watch subscription results.',
  },
  {
    icon: faAndroid,
    title: 'Android',
    text:
      'In addition to our React Native chapter, we also have a native Android chapter based on the Apollo Android library. Get typed Kotlin models generated from your queries and mutations, configure caching, and use coroutines, ViewModel, and Flow.',
  },
  {
    icon: faAppStoreIos,
    title: 'iOS',
    text: `We’re working on a native iOS chapter that uses the Apollo iOS Swift client. Get your query and mutation results in query-specific Swift types, and have the data cached.`,
  },
]

const Topic = ({ icon, title, text }) => (
  <div className="Topic">
    <FontAwesomeIcon icon={icon} />
    <Typography className="Topic-title" variant="h5">
      {title}
      {title === 'iOS' ? '*' : null}
    </Typography>
    <hr />
    <div className="Topic-caption">
      {text}
      {title === 'iOS' ? (
        <Fragment>
          <br />
          <i>
            * This chapter is forthcoming (pending the v1 release of the Apollo
            iOS library).
          </i>
        </Fragment>
      ) : null}
    </div>
  </div>
)

const Topics = () => (
  <section className="Topics" id="topics">
    <Typography className="Topics-header" variant="h3" component="h1">
      Topics We Cover
    </Typography>

    <Link to="/contents" className="Topics-toc">
      View table of contents
    </Link>

    <div className="Topics-list">
      {topics.map((topic, i) => (
        <Topic {...topic} key={i} />
      ))}
    </div>
  </section>
)

export default Topics
