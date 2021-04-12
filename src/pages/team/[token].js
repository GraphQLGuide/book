import React from 'react'
import Team from '../../components/landing/Team'

export default ({ params }) => {
  if (!params.token) {
    return 'Missing token parameter'
  }

  return <Team urlToken={params.token} />
}
