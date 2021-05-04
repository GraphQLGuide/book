import React from 'react'
import { Avatar, Paper, Typography } from '@material-ui/core'

import TwitterLogo from './TwitterLogo'
import LinkNewTab from './LinkNewTab'

const Author = ({ name, twitter, avatar, children }) => (
  <Paper className="Author" elevation={24}>
    <LinkNewTab
      className="Author-twitter"
      href={`https://twitter.com/${twitter}`}
    >
      <TwitterLogo />
      {twitter}
    </LinkNewTab>
    <Avatar className="Author-avatar" src={avatar} alt={name} />
    <Typography className="Author-name" variant="h5">
      {name}
    </Typography>
    <div className="Author-description">{children}</div>
  </Paper>
)

export default Author
