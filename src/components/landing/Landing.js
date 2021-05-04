import React, { Component } from 'react'
import { Helmet } from 'react-helmet'

import './Landing.css'
import AboveFold from './AboveFold'
import BelowFold from './BelowFold'

class Landing extends Component {
  render() {
    return (
      <div className="Landing">
        {/* <header className="Landing-header">Sign in</header> */}
        <AboveFold />
        <BelowFold />
        <Helmet>
          <script type="application/ld+json">
            {`
{
  "@context": "https://schema.org/",
  "@type": "Product",
  "name": "The GraphQL Guide",
  "image": [
    "https://res.cloudinary.com/graphql/image/upload/c_scale,f_auto,q_90,w_1000/book"
   ],
  "description": "A comprehensive book from John Resig, the creator of jQuery. The complete guide to GraphQL, from a beginner introduction to advanced client and server topics.",
  "review": {
    "@type": "Review",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": "5",
      "bestRating": "5"
    },
    "author": {
      "@type": "Person",
      "name": "Shawn Wang"
    },
    "reviewBody": "This is the most comprehensive coverage of modern GraphQL, going from the basics of the Query Language to excruciating detail on Validation and Execution internals that you’ll be thankful for when things go wrong, to the latest and greatest in the ecosystem, like Apollo Federation and Hasura. It normally takes a developer months to get up to speed on putting together all these pieces. The GraphQL Guide teaches it in just a few hours!"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "5",
    "reviewCount": "7"
  },
  "offers": {
    "@type": "Offer",
    "url": "https://graphql.guide/#pricing",
    "priceCurrency": "USD",
    "price": "39",
    "availability": "https://schema.org/InStock",
    "name": "The GraphQL Guide (Basic)"
  },
  "offers": {
    "@type": "Offer",
    "url": "https://graphql.guide/#pricing",
    "priceCurrency": "USD",
    "price": "89",
    "availability": "https://schema.org/InStock",
    "name": "The GraphQL Guide (Pro)"
  },
  "offers": {
    "@type": "Offer",
    "url": "https://graphql.guide/#pricing",
    "priceCurrency": "USD",
    "price": "289",
    "availability": "https://schema.org/InStock",
    "name": "The GraphQL Guide (Full)"
  }
}
`}
          </script>
        </Helmet>
      </div>
    )
  }
}

export default Landing
