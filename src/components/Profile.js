import React, { useState } from 'react'
import { gql as spaceql, useQuery } from '@apollo/client'
import { Link } from 'gatsby'

import './Profile.css'
import { useUser } from '../lib/useUser'
import { login, logout } from '../lib/auth'
import { apolloSpace } from '../lib/apollo'

const LAUNCH_QUERY = spaceql`
  query LaunchQuery {
    launchNext {
      details
      launch_date_utc
      launch_site {
        site_name
      }
      mission_name
      rocket {
        rocket_name
      }
    }
  }
`

function Launch() {
  const { data } = useQuery(LAUNCH_QUERY, {
    fetchPolicy: 'cache-and-network',
    client: apolloSpace,
    onCompleted: () =>
      window.scrollTo({ top: 1000, left: 0, behavior: 'smooth' }),
  })

  const {
    launchNext: {
      details,
      launch_date_utc,
      launch_site,
      mission_name,
      rocket,
    } = {},
  } = data || {}

  if (!details) {
    return <div className="Spinner" />
  }

  return (
    <div>
      The next SpaceX launch will be:
      <dl>
        <dt>Date</dt>
        <dd>
          <code>{new Date(launch_date_utc).toString()}</code>
        </dd>

        <dt>Mission</dt>
        <dd>
          <code>{mission_name}</code>
        </dd>

        <dt>Rocket</dt>
        <dd>
          <code>{rocket.rocket_name}</code>
        </dd>

        <dt>Launch site</dt>
        <dd>
          <code>{launch_site.site_name}</code>
        </dd>

        <dt>Details</dt>
        <dd className="-non-code">{details}</dd>
      </dl>
    </div>
  )
}

export default () => {
  const { user, loggingIn } = useUser()
  const [showLaunch, setShowLaunch] = useState(false)

  if (loggingIn) {
    return (
      <div className="Profile">
        <div className="Spinner" />
      </div>
    )
  } else if (!user) {
    return (
      <div className="Profile">
        <button onClick={login} className="Profile-login">
          Sign in
        </button>
      </div>
    )
  } else {
    return (
      <div className="Profile">
        <h1 className="Profile-header">{user.name}</h1>
        <div className="Profile-content">
          <dl>
            <dt>Email</dt>
            <dd>
              <code>{user.email}</code>
            </dd>

            <dt>Membership level</dt>
            <dd>
              <code>{user.hasPurchased || 'GUEST'}</code>
              {!user.hasPurchased ? (
                <Link to="/#pricing" className="Profile-purchase">
                  purchase
                </Link>
              ) : null}
            </dd>

            <dt>OAuth Github account</dt>
            <dd>
              <a
                href="https://github.com/settings/applications"
                target="_blank"
                rel="noopener noreferrer"
              >
                <code>{user.username}</code>
              </a>
            </dd>
          </dl>

          <button className="Profile-logout" onClick={logout}>
            Sign out
          </button>
        </div>
        <div className="Profile-footer">
          <button
            className="Profile-toggle-launch"
            onClick={() => setShowLaunch(!showLaunch)}
          >
            <span role="img" aria-label="rocket">
              🚀
            </span>
          </button>

          {showLaunch && <Launch />}
        </div>
      </div>
    )
  }
}
