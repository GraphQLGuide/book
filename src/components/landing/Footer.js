import React, { Fragment } from 'react'
import { Link, navigate } from 'gatsby'

import './Footer.css'
import LinkNewTab from './LinkNewTab'
import { login } from '../../lib/auth'

const Footer = ({ legal }) => (
  <footer className="Footer">
    {legal || (
      <Fragment>
        <hr />
        <div className="Footer-row">
          <Link to="/reviews">Reviews</Link>
          <LinkNewTab href="https://twitter.com/graphqlguide">
            Twitter
          </LinkNewTab>
          <LinkNewTab href="https://blog.graphql.guide/">Blog</LinkNewTab>
          <LinkNewTab href="mailto:hi@graphql.guide">
            hi@graphql.guide
          </LinkNewTab>
        </div>
        <div className="Footer-divider">···</div>
      </Fragment>
    )}
    <div className="Footer-row">
      <div>The GraphQL Guide © {new Date().getFullYear()}</div>
      <Link to="/terms">Terms</Link>
      <Link to="/privacy">Privacy</Link>
      {legal ? (
        <button onClick={() => login(() => navigate('/introduction'))}>
          Sign in
        </button>
      ) : (
        <div>
          <LinkNewTab href="https://github.com/apollographql/gatsby-theme-apollo/tree/master/packages/gatsby-theme-apollo-docs">
            Gatsby theme
          </LinkNewTab>{' '}
          by Apollo
        </div>
      )}
    </div>
  </footer>
)

export default Footer
