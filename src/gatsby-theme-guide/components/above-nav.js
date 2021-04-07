import React from 'react'
import styled from '@emotion/styled'
import { breakpoints } from 'gatsby-theme-guide-core'

import CurrentUser from '../../components/CurrentUser'

const Container = styled.div({
  display: 'none',
  [breakpoints.sm]: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 24,
  },
})

export const AboveNav = ({ onClick }) => (
  <Container>
    <CurrentUser inline onClick={onClick} />
  </Container>
)
