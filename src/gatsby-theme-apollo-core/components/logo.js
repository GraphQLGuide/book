import React from 'react'
import styled from '@emotion/styled'
import { ReactComponent as Icon } from '../../assets/logo.svg'
import { ReactComponent as Text } from '../../assets/logo-text.svg'
import { colors } from '../utils/colors'

const Wrapper = styled.div({
  display: 'flex',
  fontSize: 24,
})

const StyledIcon = styled(Icon)({
  height: '1.5em',
  marginRight: '0.5em',
})

const StyledText = styled(Text)({
  height: '1em',
  marginTop: '0.33em',
  fill: colors.text1,
})

export default function Logo() {
  return (
    <Wrapper>
      <StyledIcon />
      <StyledText />
    </Wrapper>
  )
}
