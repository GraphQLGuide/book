import React from 'react'
import { useQueryParam, NumberParam } from 'use-query-params'

import './Paypal.css'
import { getPackage } from '../../lib/packages'
import CurrentUser from '../CurrentUser'
import Emoji from './Emoji'
import LinkNewTab from './LinkNewTab'
import { useUser } from '../../lib/useUser'

const Paypal = ({ pkg }) => {
  const { loggedIn } = useUser()
  const packageInfo = getPackage(pkg || 'full')
  let { name } = packageInfo

  const [licenses] = useQueryParam('licenses', NumberParam)
  const price = packageInfo.fullPrice(licenses)

  return (
    <main className="Paypal">
      <div className="Paypal-content">
        <p>
          <i>Package: {name}</i>
        </p>
        <p>
          <b>Step 1: </b>
          Send ${price} via PayPal, with your Github username in the payment
          note.
        </p>
        <p style={{ textAlign: 'center' }}>
          <LinkNewTab href={`https://www.paypal.me/graphqlguide/${price}`}>
            paypal.me/graphqlguide/
            {price}
          </LinkNewTab>
        </p>
        <div className="Paypal-step2">
          <p>
            <b>Step 2: </b>
            Create an account:
          </p>
          {loggedIn && <Emoji name="white_check_mark" />}
          <div className="Paypal-login">
            <CurrentUser buttonText="Sign up" inline />
          </div>
        </div>
        <p>
          <b>Step 3: </b>
          We’ll manually add the package you bought to your user record in the
          database and email you the ebook 😄
        </p>
      </div>
    </main>
  )
}

export default Paypal
