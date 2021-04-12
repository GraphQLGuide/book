import React from 'react'
import YouTube from 'react-youtube'
import { Link } from 'gatsby'

import { useUser } from '../lib/useUser'
import { login } from '../lib/auth'
import { getPackage } from '../lib/packages'

export default () => {
  const { user, loggingIn } = useUser()
  const pkg = getPackage(user?.hasPurchased)

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
  } else if (pkg?.individualPackage() === 'full') {
    return (
      <div className="Profile">
        <YouTube videoId="K4jzDASCPFM" />
        <YouTube videoId="KApLzEKEV7A" />
      </div>
    )
  } else if (pkg?.individualPackage() === 'pro') {
    return <div className="Profile">Videos coming soon</div>
  } else {
    return (
      <div className="Profile">
        <Link to="/#pricing" className="Profile-membership-link">
          Purchase the Pro or Full package
        </Link>
      </div>
    )
  }
}
