import React, { useEffect } from 'react'
import { gql, useMutation } from '@apollo/client'

import './Unsubscribe.css'

const UNSUBSCRIBE = gql`
  mutation Unsubscribe($token: String!) {
    unsubscribe(token: $token)
  }
`

const Unsubscribe = ({ token }) => {
  const [unsubscribe, { data }] = useMutation(UNSUBSCRIBE)
  useEffect(() => {
    unsubscribe({ variables: { token } })
  }, [unsubscribe, token])

  let message = 'Unsubscribing...'
  if (data) {
    if (data.unsubscribe) {
      message = 'Unsubscribed ✅'
    } else {
      message =
        "Sorry, unsubscribe token not recognized. Please reply to your email with 'unsubscribe' in the body, and we'll process it manually."
    }
  }

  return <main className="Unsubscribe">{message}</main>
}

export default Unsubscribe
