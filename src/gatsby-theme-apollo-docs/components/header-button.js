import React from 'react'
import styled from '@emotion/styled'
import { breakpoints } from 'gatsby-theme-apollo-core'

import CurrentUser from '../../components/CurrentUser'
import CurrentTemperature from '../../components/CurrentTemperature'

const Container = styled.div({
  display: 'flex',
  flexShrink: 0,
  width: 240,
  [breakpoints.lg]: {
    width: 'auto',
    marginRight: 0
  },
  [breakpoints.md]: {
    marginLeft: 40
  },
  [breakpoints.sm]: {
    display: 'none'
  }
})

export default function HeaderButton() {
  return (
    <Container>
      <CurrentTemperature />
      <CurrentUser inline />
    </Container>
  )
}
