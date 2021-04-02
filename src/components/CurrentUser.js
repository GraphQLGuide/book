import React from 'react'
import { Link } from 'gatsby'
import classNames from 'classnames'

import './CurrentUser.css'
import { useUser } from '../lib/useUser'
import { login } from '../lib/auth'

export default ({ inline, buttonText }) => {
  const { user, loggingIn } = useUser()

  let content

  if (loggingIn) {
    content = <div className="Spinner" />
  } else if (!user) {
    content = <button onClick={login}>{buttonText || 'Sign in'}</button>
  } else {
    content = (
      <Link to="/me" className="User">
        <img src={user.photo} alt={user.firstName} />
        {user.firstName}
      </Link>
    )
  }

  return <div className={classNames('CurrentUser', { inline })}>{content}</div>
}
