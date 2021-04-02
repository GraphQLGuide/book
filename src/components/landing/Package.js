import React from 'react'
import classNames from 'classnames'
import { Typography, Paper } from '@material-ui/core'
import { Link } from 'gatsby'
import { Image } from 'cloudinary-react'

import './Package.css'
import { getPackage } from '../../lib/packages'
import Emoji from './Emoji'
import Payment from './Payment'

const Package = ({
  color,
  basic,
  pro,
  full,
  training,
  team,
  fullteam,
  recommended,
  updatePeriod,
  extraChapters,
  videos,
  children,
}) => {
  const packageInfo = getPackage({ basic, pro, full, training, team, fullteam })
  const { price, key, name } = packageInfo

  let digits = ''
  if (price < 100) {
    digits = 'two-digits'
  } else if (price >= 1000) {
    digits = 'four-digits'
  }

  const features =
    training || team || fullteam ? (
      <ul className="Package-features">{children}</ul>
    ) : (
      <ul className="Package-features">
        <li>The book in HTML, PDF, ePub, and Kindle formats</li>
        <hr />
        <li>The book’s Git repositories, with branches for each section</li>
        {updatePeriod && (
          <div>
            <hr />
            <li>{updatePeriod}</li>
          </div>
        )}
        {extraChapters && (
          <div>
            <hr />
            <li>
              <div className={classNames('Package-feature-list', { full })}>
                {pro ? 'Extra chapters:' : 'More extra chapters:'}
              </div>
              {extraChapters.map((chapter) => (
                <div className="Package-extra-item" key={chapter}>
                  {chapter}
                </div>
              ))}
            </li>
          </div>
        )}
        {videos && (
          <div>
            <hr />
            <li>
              <div className={classNames('Package-feature-list', { full })}>
                {pro ? 'Videos:' : 'More videos:'}
              </div>
              {videos.map((video, i) => (
                <div className="Package-extra-item" key={i}>
                  {video}
                </div>
              ))}
            </li>
          </div>
        )}
        {full && (
          <div>
            <hr />
            <li>
              <b>Technical support</b> if you run into problems following along
              with the coding chapters
            </li>
          </div>
        )}
        {full && (
          <div>
            <hr />
            <li>
              Access to the private <b>Guide Slack</b> workspace
            </li>
          </div>
        )}
        {full && (
          <div>
            <hr />
            <li>
              The Guide T-shirt!
              <Link to="/tshirt">
                <Image
                  className="Package-tshirt"
                  publicId="guide-tshirt"
                  fetchFormat="auto"
                  quality="auto"
                />
                T-shirt options
              </Link>
              <br />
              <br />
              Exclusively for Full edition readers.
              <br />
              Free worldwide shipping.
            </li>
          </div>
        )}
      </ul>
    )

  return (
    <Paper
      className={classNames('Package', color, key, {
        recommended,
      })}
      elevation={10}
    >
      <div className="Package-header">
        {recommended && (
          <div className="Package-recommendation">
            <Emoji name="ok_hand" />
            <Emoji name="point_down" />
            <Emoji name="ok_hand" />
          </div>
        )}
        <div className="Package-header-bg" />
        <Typography className="Package-name" variant="h4">
          {name}
        </Typography>
        <Typography className={`Package-price ${digits}`} variant="h5">
          {price}
        </Typography>
      </div>
      {features}
      <Payment packageInfo={packageInfo} />
    </Paper>
  )
}

export default Package
