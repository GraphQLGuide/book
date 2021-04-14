import { useEffect } from 'react'
import { gql, useQuery, useReactiveVar } from '@apollo/client'
import LogRocket from 'logrocket'
import ReactGA from 'react-ga'

import { loginInProgressVar } from './auth'
import { associateSession } from './payment'
import { inBrowser } from './helpers'

export const USER_QUERY = gql`
  query UserQuery {
    currentUser {
      id
      firstName
      name
      username
      email
      photo
      hasPurchased
      hasTshirt
      ebookUrl
      favoriteReviews {
        id
      }
    }
  }
`

function track(user) {
  const { id, name, email, hasPurchased } = user
  const userData = {
    name,
    email,
    hasPurchased,
  }

  window.heap.identify(id, 'ID')
  window.heap.addUserProperties(userData)
  ReactGA.set({
    id,
    ...userData,
  })
  LogRocket.identify(id, userData)
}

export function useUser() {
  const { data, loading } = useQuery(USER_QUERY)
  const loginInProgress = useReactiveVar(loginInProgressVar)
  const user = data && data.currentUser

  useEffect(() => {
    if (user && inBrowser) {
      associateSession()
      track(user)
    }
  }, [user])

  return {
    user,
    loggedIn: !!user,
    loggingIn: loading || loginInProgress,
  }
}
