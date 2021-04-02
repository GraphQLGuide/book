import { gql } from '@apollo/client'
import { loadStripe } from '@stripe/stripe-js'
import { get } from 'lodash'

import { apollo } from './apollo'
import track from './track'

const stripePromise = loadStripe(process.env.GATSBY_STRIPE_PUBLIC_KEY)

const CREATE_CHECKOUT_SESSION = gql`
  mutation CreateCheckoutSession($input: SessionInput!) {
    createCheckoutSession(input: $input)
  }
`

const ASSOCIATE_SESSION_MUTATION = gql`
  mutation AssociateSession($sessionId: ID!) {
    associateCheckoutSession(sessionId: $sessionId) {
      id
      hasPurchased
    }
  }
`

// https://stripe.com/docs/payments/accept-a-payment?integration=checkout
export const stripeCheckout = async (packageInfo) => {
  const { key, licenses } = packageInfo

  const { data, error } = await apollo.mutate({
    mutation: CREATE_CHECKOUT_SESSION,
    variables: {
      input: {
        packageKey: key.toUpperCase(),
        licenses,
      },
    },
  })

  if (error) {
    alert('Error: ' + error.message)
    return
  }

  const sessionId = data.createCheckoutSession

  localStorage.setItem('stripe.sessionId', sessionId)
  localStorage.setItem('package', key)
  localStorage.removeItem('stripe.associatedSessionWithUser')

  track('checkout', {
    key,
    licenses,
  })

  const stripe = await stripePromise

  const result = await stripe.redirectToCheckout({
    sessionId,
  })

  if (result.error) {
    alert(
      `Error redirecting to checkout page. Please try again. Error message: ${result.error.message}`
    )
  }
}

let associatingInProgress = false

const done = () =>
  localStorage.getItem('stripe.associatedSessionWithUser') === 'true'

export const pollAssociateSession = () => {
  const sessionId = localStorage.getItem('stripe.sessionId')
  if (!sessionId) {
    return
  }

  const interval = setInterval(() => {
    if (associatingInProgress) {
      return
    }

    if (done()) {
      clearInterval(interval)
      return
    }

    associateSession()
  }, 1000)
}

export const associateSession = async () => {
  if (associatingInProgress) {
    return
  }

  const sessionId = localStorage.getItem('stripe.sessionId')
  if (!sessionId) {
    return
  }

  if (done()) {
    return
  }

  associatingInProgress = true
  const response = await apollo
    .mutate({
      mutation: ASSOCIATE_SESSION_MUTATION,
      variables: { sessionId },
    })
    .catch((e) => {
      if (e.message === 'checkout-session-not-completed') {
        // user either left checkout without completing it,
        // or the server hasn't yet received the webhook
        return
      }

      throw e
    })
  associatingInProgress = false

  const user = get(response, 'data.associateCheckoutSession')
  if (user) {
    localStorage.setItem('stripe.associatedSessionWithUser', 'true')
    track('purchase', {
      key: user.hasPurchased,
    })
  }
}

export default ({ children }) => children
