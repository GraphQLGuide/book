import React, { useEffect, Fragment, useState } from 'react'
import ScrollToTopOnMount from './ScrollToTopOnMount'
import { Typography } from '@material-ui/core'
import { Link } from 'gatsby'

import './Welcome.css'
import { getPackage } from '../../lib/packages'
import Emoji from './Emoji'
import CurrentUser from '../CurrentUser'
import { useUser } from '../../lib/useUser'
import { fireworks } from '../../lib/confetti'
import { pollAssociateSession } from '../../lib/payment'
import { inBrowser } from '../../lib/helpers'

function getItem(key) {
  if (inBrowser) {
    return JSON.parse(window.localStorage.getItem(key))
  } else {
    return false
  }
}

function setItem(key, value) {
  if (inBrowser) {
    window.localStorage.setItem(key, JSON.stringify(value))
  }
}

export default function Welcome() {
  const { user, loggedIn } = useUser()

  const [declinedTshirt, setDeclinedTshirt] = useState(
    getItem('declinedTshirt')
  )

  useEffect(fireworks, [])
  useEffect(() => {
    if (user && !user.hasPurchased) {
      pollAssociateSession()
    }
  }, [user])

  let packageInfo
  let offerTshirt = false

  if (user) {
    packageInfo = getPackage(user.hasPurchased)
    const hasTshirtPackage = packageInfo.includesTshirt
    offerTshirt = hasTshirtPackage && !declinedTshirt
  }

  let unpurchasedContent =
    inBrowser && localStorage.getItem('stripe.sessionId') ? (
      <Fragment>
        <p>
          Waiting to receive <code>checkout.session.completed</code> webhook
          from Stripe.
        </p>
        <div className="Spinner" />
        <p>
          If this takes more than a minute, please reply to the receipt email
          with your GitHub username so that we can manually associate your
          payment. Sorry for the trouble!
        </p>
      </Fragment>
    ) : (
      <p>
        Sorry, we’re unable to associate your user account with your Stripe
        checkout session. Please either open this page in the browser you
        checked out in or reply to the receipt email with your GitHub username.
      </p>
    )

  return (
    <section className="Welcome">
      <ScrollToTopOnMount />
      <Typography variant="h2">Welcome!</Typography>
      <p>
        Thank you for supporting the Guide <Emoji name="smiley" />
      </p>
      {loggedIn || (
        <p>
          To receive the book, please connect your GitHub account and return to
          this page:
        </p>
      )}
      <CurrentUser buttonText="Connect account" inline />
      {loggedIn && (
        <div className="Welcome-user">
          <p>
            <Emoji name="white_check_mark" /> Account created.
          </p>
          {user.hasPurchased ? (
            <Fragment>
              <p>
                We're emailing you at <code>{user.email}</code> with the latest
                version of the ebook. <br />
                To start reading the web version,{' '}
                <Link to="/preface">visit the Preface</Link>.
              </p>
              {packageInfo.isGroup && (
                <p>
                  We're also sending an email explaining how to use your team
                  license.
                </p>
              )}
              {offerTshirt && (
                <div className="Welcome-tshirt">
                  Would you like a tshirt?
                  <Link to="/tshirt">Yes</Link>
                  <button
                    onClick={() => {
                      setItem('declinedTshirt', true)
                      setDeclinedTshirt(true)
                    }}
                  >
                    No thanks
                  </button>
                </div>
              )}
            </Fragment>
          ) : (
            unpurchasedContent
          )}
        </div>
      )}
    </section>
  )
}
