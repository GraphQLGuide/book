import React from 'react'
import { Image } from 'cloudinary-react'
import { Typography } from '@material-ui/core'

import './ElonLanding.css'

const ElonLanding = () => (
  <div className="ElonLanding">
    {/* <Typography className="ElonLanding-title" variant="h4">
      As recommended by Elon Musk!
    </Typography> */}

    <a
      href="https://twitter.com/BoredElonMusk/status/1366887300844584961"
      target="_blank"
      rel="noopener noreferrer"
    >
      <Typography className="ElonLanding-quote" variant="h4">
        “The future is all robo-colonoscopies and GraphQL.”
      </Typography>

      <Image
        className="ElonLanding-avatar"
        publicId="bored-elon-musk"
        fetchFormat="auto"
        quality="auto"
      />
    </a>
  </div>
)
export default ElonLanding
