import React, { Fragment } from 'react'
import styled from '@emotion/styled'

import { useUser } from '../../lib/useUser'

const FREE_PATHS = [
  '/preface',
  '/introduction',
  '/background',
  '/background/',
  // '/background/javascript/',
]

const Hide = styled.div`
  height: ${(props) => (props.hide ? '1px' : 'auto')};
  overflow-y: hidden;
`

const Overlay = styled.div`
  height: 35vh;
`

export const Paywall = ({ pathname, children, header }) => {
  const user = useUser()
  console.log('pathname:', pathname, user)
  return children

  let message = null
  let hide = true

  if (FREE_PATHS.includes(pathname)) {
    hide = false
  } else {
    if (user) {
      if (user.hasPurchased) {
        hide = false
      } else {
        message = 'purchase'
      }
    } else {
      message = 'login'
    }
  }

  // display the header when hiding the page
  if (hide && header) {
    return children
  }

  return (
    <Fragment>
      {message && <Overlay>{message}</Overlay>}
      <Hide hide={hide} className="paid-content">
        {children}
      </Hide>
    </Fragment>
  )
}
