import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'gatsby'
import {
  Button,
  InputLabel,
  FormControl,
  Select,
  Typography,
} from '@material-ui/core'

import './Payment.css'
import LoadStripe, { stripeCheckout } from '../../lib/payment'
import { BASE_LICENSES } from '../../lib/packages'
import { ReactComponent as StripeClimateIcon } from '../../assets/stripe-climate.svg'
import LinkNewTab from './LinkNewTab'
import { IconGithub } from '@apollo/space-kit/icons/IconGithub'

class Payment extends Component {
  state = {
    licenses: BASE_LICENSES,
  }

  setLicenses = (event) => {
    this.setState({ licenses: event.target.value })
  }

  checkoutClicked = () => {
    const { packageInfo } = this.props
    let checkoutInfo = packageInfo

    if (packageInfo.isGroup) {
      const { licenses } = this.state
      checkoutInfo = {
        ...packageInfo,
        price: packageInfo.fullPrice(licenses),
        name: packageInfo.fullName(licenses),
        licenses,
      }
    }

    stripeCheckout(checkoutInfo, this.props.history)
  }

  render() {
    const {
      packageInfo: { key, full, team, training, fullteam, isGroup },
    } = this.props

    return (
      <div className={`Payment ${key}`}>
        {isGroup && (
          <FormControl className="Payment-licenses">
            <InputLabel htmlFor="select-licenses">License size</InputLabel>
            <Select
              native
              value={this.state.licenses}
              onChange={this.setLicenses}
              inputProps={{
                id: 'select-licenses',
              }}
            >
              {[5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map((n) => (
                <option value={n} key={n}>
                  {n} seats – $
                  {team ? this.props.packageInfo.fullPrice(n) : n / 5}
                  {fullteam && 'k'}
                </option>
              ))}
            </Select>
          </FormControl>
        )}
        <LoadStripe>
          <Button
            variant="contained"
            className="Payment-stripe"
            color={full && 'primary'}
            onClick={this.checkoutClicked}
          >
            STRIPE CHECKOUT
          </Button>
        </LoadStripe>
        <div className="Payment-caption">
          <StripeClimateIcon />
          <Typography variant="caption">
            5% of your purchase goes toward{' '}
            <LinkNewTab href="https://stripe.com/climate">
              removing CO₂ from the atmosphere
            </LinkNewTab>
            .
          </Typography>
        </div>
        {(full || training || fullteam) && (
          <div className="Payment-caption github">
            <IconGithub />
            <Typography variant="caption">
              Another 5% goes toward{' '}
              <LinkNewTab href="https://github.com/orgs/GraphQLGuide/sponsoring">
                sponsoring open source software
              </LinkNewTab>
              !
            </Typography>
          </div>
        )}

        {/* <p>TODO or payment request api</p> */}
        {isGroup ? (
          <div className="Payment-team">
            <p>
              Or pay{' '}
              <Link to={`/paypal/${key}?licenses=${this.state.licenses}`}>
                by PayPal
              </Link>
              <br />
              or by check to:
            </p>
            <p>
              The GraphQL Guide
              <br />
              2443 Fillmore St #380-2914
              <br />
              San Francisco, CA 94115
            </p>
          </div>
        ) : (
          <p>
            Or pay <Link to={`/paypal/${key}`}>via PayPal</Link>
          </p>
        )}
      </div>
    )
  }
}

Payment.propTypes = {
  packageInfo: PropTypes.shape({
    key: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
  }).isRequired,
}

export default Payment
