import React, { Component } from 'react'

import './Landing.css'
import AboveFold from './AboveFold'
import BelowFold from './BelowFold'

class Landing extends Component {
  render() {
    return (
      <div className="Landing">
        {/* <header className="Landing-header">Sign in</header> */}
        <AboveFold />
        <BelowFold />
      </div>
    )
  }
}

export default Landing
