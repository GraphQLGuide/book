import { ApolloClient, InMemoryCache, gql } from '@apollo/client'
import find from 'lodash/find'

import link, { spaceXLink } from './link'

export const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        reviews: {
          merge(existing = [], incoming, { readField }) {
            const notAlreadyInCache = (review) =>
              !find(
                existing,
                (existingReview) =>
                  readField('id', existingReview) === readField('id', review)
              )

            const newReviews = incoming.filter(notAlreadyInCache)

            return [...existing, ...newReviews]
          },
          keyArgs: ['orderBy'],
        },
        section: (_, { args: { id }, toReference }) =>
          toReference({
            __typename: 'Section',
            id,
          }),
      },
    },
    Section: {
      fields: {
        scrollY: (scrollY) => scrollY || 0,
      },
    },
  },
})

/* eslint-disable graphql/template-strings */
const typeDefs = gql`
  extend type Section {
    scrollY: Int
  }
`
/* eslint-enable graphql/template-strings */

export const apollo = new ApolloClient({ link, cache, typeDefs })

export const apolloSpace = new ApolloClient({
  link: spaceXLink,
  cache: new InMemoryCache(),
})
