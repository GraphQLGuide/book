import React from 'react'
import { useQuery, useApolloClient, gql } from '@apollo/client'
import { Button } from '@material-ui/core'
import { navigate } from 'gatsby'

import { useUser } from '../../lib/useUser'
import { login } from '../../lib/auth'
import { getPackage } from '../../lib/packages'
import LinkNewTab from './LinkNewTab'

const TEAM_QUERY = gql`
  query TeamQuery($urlToken: String!) {
    team(urlToken: $urlToken) {
      id
      members {
        id
        name
        username
      }
      name
      totalSeats
      packageType
    }
  }
`

const JOIN_TEAM = gql`
  mutation JoinTeamMutation($urlToken: String!) {
    joinTeam(urlToken: $urlToken) {
      id
      members {
        id
        name
        hasPurchased
      }
    }
  }
`

let attemptingToClaim = false

const Team = ({ urlToken }) => {
  const { user } = useUser()

  const client = useApolloClient()

  const { loading, data } = useQuery(TEAM_QUERY, {
    variables: { urlToken },
  })

  const claimSeat = async () => {
    if (!user) {
      attemptingToClaim = true
      login()
      return
    }

    if (user.hasPurchased && !attemptingToClaim) {
      alert(
        'You already have access to the Guide. Contact us with questions: team@graphql.guide'
      )
    } else {
      // todo spinner
      await client
        .mutate({ mutation: JOIN_TEAM, variables: { urlToken } })
        .catch()
      navigate('/welcome')
    }
    attemptingToClaim = false
  }

  const claimerJustLoggedIn = attemptingToClaim && user
  if (claimerJustLoggedIn) {
    claimSeat()
  }

  if (loading) {
    return (
      <main className="Team">
        <div className="Spinner" />
      </main>
    )
  }

  if (!(data && data.team)) {
    return <main className="Team">No such team</main>
  }

  const {
    team: { name, totalSeats, members, packageType },
  } = data

  const seatsLeft = totalSeats - members.length
  const packageDisplayName =
    packageType === 'FULLTEAM' ? 'Full package' : 'Pro package'
  const stripeLink =
    packageType === 'FULLTEAM'
      ? '//buy.stripe.com/8wM0290DO4l7enCdQQ'
      : '//buy.stripe.com/fZebKR72c4l73IY8wx'

  return (
    <main className="Team">
      <div className="Team-header-wrapper">
        <header className="Team-header">
          <h1>Team {name}</h1>
        </header>
      </div>
      <div className="Team-content">
        <p>
          {seatsLeft} seat{seatsLeft !== 1 && 's'} left
          {seatsLeft ? (
            <Button
              color="primary"
              variant="contained"
              className="Team-claim-seat"
              onClick={claimSeat}
            >
              Claim seat
            </Button>
          ) : null}
        </p>
        <div className="Team-member-list">
          <p>Team members:</p>
          <ul>
            {members.map(({ name, username, id }) => (
              <li key={id}>
                <LinkNewTab href={`https://github.com/${username}`}>
                  {name}
                </LinkNewTab>
              </li>
            ))}
          </ul>
        </div>
        <p className="Team-summary">
          {`${totalSeats}-seat license: ${packageDisplayName}. Seats are non-transferable. Add 
          more seats `}
          <a href={stripeLink}>via Stripe</a>
          {' or '}
          <a
            href={`//paypal.me/graphqlguide/${
              getPackage(packageType).seatPrice
            }`}
          >
            PayPal
          </a>
          {`, and we’ll process it shortly. Or send a purchase order to `}
          <a href="mailto:sales@graphql.guide">sales@graphql.guide</a>
          {`, and we’ll send you an invoice.`}
        </p>
      </div>
    </main>
  )
}

export default Team
