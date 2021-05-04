import React from 'react'
import classnames from 'classnames'
import { Typography, Button } from '@material-ui/core'
import scrollIntoView from 'scroll-into-view-if-needed'

import './AboveFold.css'
import LogoName from './LogoName'
import CurrentUser from '../CurrentUser'
// import ElonLanding from './ElonLanding'
import { useUser } from '../../lib/useUser'

const scrollTo = (selector) => () => {
  scrollIntoView(document.querySelector(selector), {
    behavior: 'smooth',
    block: 'start',
    inline: 'nearest',
  })
}

const AboveFold = () => {
  const { loggedIn } = useUser()

  return (
    <div className={classnames('AboveFold', { withUser: loggedIn })}>
      <div className="AboveFold-container">
        {loggedIn && <CurrentUser />}
        <div className="AboveFold-main-container">
          <LogoName />
          <div className="AboveFold-main">
            {/* <ElonLanding /> */}
            <div className="AboveFold-text">
              <Typography className="AboveFold-title" variant="h4">
                GraphQL is the <span className="-nowrap">new REST</span>
              </Typography>
              <Typography className="AboveFold-subtitle" variant="body1">
                GraphQL is the best way to fetch data for your app, and the
                GraphQL&nbsp;Guide is the best way to learn how.
              </Typography>
            </div>
            <div className="AboveFold-buttons">
              <Button variant="contained" onClick={scrollTo('.BelowFold')}>
                Learn more
              </Button>
              <Button
                color="primary"
                variant="contained"
                onClick={scrollTo('.Pricing')}
              >
                Get the book
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="AboveFold-hero-container">
        <img
          className="AboveFold-hero"
          src="https://res.cloudinary.com/graphql/image/upload/c_scale,f_auto,q_80,w_1000/book"
          alt="Cover of The GraphQL Guide"
        />
      </div>
    </div>
  )
}

export default AboveFold
