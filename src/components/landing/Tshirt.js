import React from 'react'
import { Image } from 'cloudinary-react'
import { Typography, Paper, Button } from '@material-ui/core'
import { navigate } from 'gatsby'

import './Tshirt.css'
import LoadStripe, { stripeCheckout } from '../../lib/payment'
import { getPackage } from '../../lib/packages'
import images from '../../lib/images'
import LinkNewTab from './LinkNewTab'
import ScrollToTopOnMount from './ScrollToTopOnMount'
import TshirtOrderForm from './TshirtOrderForm'
import { useUser } from '../../lib/useUser'
import { login } from '../../lib/auth'

const LinkedShirt = ({ filename }) => {
  const imageUrl = images.url(filename)

  return (
    <LinkNewTab href={imageUrl}>
      <Image
        className="Tshirt-image"
        publicId={filename}
        fetchFormat="auto"
        quality="auto"
        secure="true"
        alt="T-shirt"
      />
    </LinkNewTab>
  )
}

const Tshirt = () => {
  const { user } = useUser()

  const hasTshirtPackage = user && getPackage(user.hasPurchased).includesTshirt

  let action = (
    <Paper className="Tshirt-action" elevation={24}>
      <Typography variant="h5">Included with the Full edition</Typography>
      <LoadStripe>
        <Button
          className="Tshirt-buy"
          variant="contained"
          color="primary"
          onClick={() => stripeCheckout(getPackage('full'), navigate)}
        >
          Get it
        </Button>
      </LoadStripe>

      {user && !hasTshirtPackage ? (
        user.hasPurchased && (
          <div className="Tshirt-login">
            You currently have the {user.hasPurchased} package
          </div>
        )
      ) : (
        <div className="Tshirt-login">
          <div>Already got it?</div>
          <button onClick={login}>Sign in</button>
        </div>
      )}
    </Paper>
  )

  if (user) {
    if (hasTshirtPackage) {
      if (user.hasTshirt) {
        action = (
          <Paper className="Tshirt-action" elevation={24}>
            <Typography variant="h5">T-shirt ordered</Typography>
            <br />
            {user.hasTshirt}
          </Paper>
        )
      } else {
        action = (
          <Paper className="Tshirt-action" elevation={24}>
            <Typography variant="h5">Order T-shirt</Typography>
            <TshirtOrderForm />
          </Paper>
        )
      }
    }
  }

  return (
    <section className="Tshirt">
      <ScrollToTopOnMount />
      <Typography className="Tshirt-title" variant="h2">
        The Guide <span className="-nowrap">T-Shirt</span>
      </Typography>
      <div className="Tshirt-modeling">
        <LinkedShirt filename="tshirt-angled" />
        <LinkedShirt filename="guide-tshirt" />
        <LinkedShirt filename="tshirt-back" />
      </div>
      <Typography className="Tshirt-title" variant="h3">
        Your Options
      </Typography>
      <div className="Tshirt-options">
        <div className="Tshirt-option">
          <LinkedShirt filename="gray" />
          <Typography className="Tshirt-option-title" variant="h4">
            Gray
          </Typography>
          <ul className="Tshirt-features">
            <li>Dark gray heather</li>
            <li>52% combed/ring-spun cotton, 48% polyester</li>
            <li>Fabric weight: 4.2 oz</li>
            <li>Yarn diameter: 30 singles</li>
          </ul>
        </div>

        <div className="Tshirt-option">
          <LinkedShirt filename="navy" />
          <Typography className="Tshirt-option-title" variant="h4">
            Navy
          </Typography>
          <ul className="Tshirt-features">
            <li>Dark blue</li>
            <li>100% ring-spun cotton</li>
            <li>Fabric weight: 4.5 oz</li>
            <li>Yarn diameter: 30 singles</li>
          </ul>
        </div>

        <div className="Tshirt-option">
          <LinkedShirt filename="contoured" />
          <Typography className="Tshirt-option-title" variant="h4">
            Contoured
          </Typography>
          <ul>
            <li>Charcoal black</li>
            <li>50/25/25 polyester/cotton/rayon</li>
            <li>Fabric weight: 3.4 oz</li>
            <li>Yarn diameter: 40 singles</li>
          </ul>
        </div>
      </div>

      <div className="Tshirt-details">
        <div className="Tshirt-common-features">
          <Typography className="Tshirt-option-title" variant="h4">
            All Options Include
          </Typography>
          <ul>
            <li>Free worldwide shipping</li>
            <li>Tear-away labels</li>
            <li>Pre-shrunk</li>
          </ul>
        </div>

        {action}
      </div>
    </section>
  )
}

export default Tshirt
