import React from 'react'

const scrollDown = () =>
  document.getElementById('pricing-notes').scrollIntoView(false)

export default ({ children }) => (
  <button onClick={scrollDown} className="Sup">
    <sup>{children}</sup>
  </button>
)
