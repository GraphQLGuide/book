import React from 'react'
import styled from '@emotion/styled'
import { breakpoints } from 'gatsby-theme-apollo-core'

import CurrentUser from '../../components/CurrentUser'

const Container = styled.div({
  display: 'none',
  [breakpoints.sm]: {
    display: 'flex',
    justifyContent: 'center'
  }
})

export const AboveNav = () => (
  <Container>
    <CurrentUser inline />
  </Container>
)
