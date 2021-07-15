import React, { useEffect, Fragment, useState } from 'react'
import ScrollToTopOnMount from './ScrollToTopOnMount'
import { Typography } from '@material-ui/core'
import { Link } from 'gatsby'
import queryString from 'query-string'
import { gql, useMutation } from '@apollo/client'

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

const ASSOCIATE_SIGNUP_TOKEN = gql`
  mutation AssociateSignupToken($token: String!) {
    associateSignupToken(token: $token) {
      id
      hasPurchased
      ebookUrl
    }
  }
`

export default function Welcome({ location }) {
  const { user, loggedIn } = useUser()

  const [declinedTshirt, setDeclinedTshirt] = useState(
    getItem('declinedTshirt')
  )

  let packageInfo
  let offerTshirt = false

  const [associateSignupToken, { error }] = useMutation(ASSOCIATE_SIGNUP_TOKEN)

  const query = queryString.parse(location.search)
  const inviteCode = query['invite-code']
  useEffect(() => {
    if (user && !user.hasPurchased && inviteCode) {
      associateSignupToken({ variables: { token: inviteCode } })
    }
  }, [user?.id, inviteCode, associateSignupToken])

  useEffect(() => {
    if (user && !user.hasPurchased && !inviteCode) {
      pollAssociateSession()
    }
  }, [user?.id, inviteCode])

  useEffect(() => {
    if (!inviteCode) {
      fireworks()
    }
  }, [inviteCode])

  if (user) {
    packageInfo = getPackage(user.hasPurchased)
    const hasTshirtPackage = packageInfo.includesTshirt
    offerTshirt = hasTshirtPackage && !declinedTshirt
  }

  let unpurchasedContent = (
    <p>
      Sorry, we’re unable to associate your user account with your Stripe
      checkout session. To receive the book, please either open this page in the
      browser you checked out in or reply to the receipt email with your GitHub
      username.
    </p>
  )

  if (inviteCode) {
    unpurchasedContent = error ? (
      <p>Error: {error.message}</p>
    ) : (
      <>
        <p>Verifying invite code</p>
        <div className="Spinner" />
      </>
    )
  } else if (inBrowser && localStorage.getItem('stripe.sessionId')) {
    unpurchasedContent = (
      <>
        <p>
          Waiting to receive <code>checkout.session.completed</code> webhook
          from Stripe.
        </p>
        <div className="Spinner" />
        <p>
          If this takes more than a minute, please reply to the receipt email
          with your GitHub username so that we can manually associate your
          payment and send you the ebook. Sorry for the trouble!
        </p>
      </>
    )
  }

  return (
    <div className="Welcome-wrapper">
      <section className="Welcome">
        <ScrollToTopOnMount />
        <Typography variant="h2">Welcome!</Typography>
        {inviteCode ? null : (
          <p>
            Thank you for supporting the Guide <Emoji name="smiley" />
          </p>
        )}
        {loggedIn ||
          (inviteCode ? (
            <p>
              To get your copy of <Link to="/">The GraphQL Guide</Link>, please
              create an account and return to this page:
            </p>
          ) : (
            <p>
              To access the book, please create an account and return to this
              page:
            </p>
          ))}
        <CurrentUser buttonText="Create account (via GitHub OAuth)" inline />
        {loggedIn && (
          <div className="Welcome-user">
            <p>
              <Emoji name="white_check_mark" /> Account created.
            </p>
            {user.hasPurchased ? (
              <Fragment>
                <p>
                  We're emailing you at <code>{user.email}</code> with the
                  latest version of the ebook.
                </p>
                <p>
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
    </div>
  )
}
