/* eslint-disable jsx-a11y/control-has-associated-label */

import React from 'react'
import { Query, Mutation } from '@apollo/client/react/components'
import { gql } from '@apollo/client'
import {
  Button,
  Input,
  InputLabel,
  FormControl,
  FormHelperText,
  Select,
} from '@material-ui/core'
import { Formik } from 'formik'

import './TshirtOrderForm.css'
import images from '../../lib/images'
import LinkNewTab from './LinkNewTab'

const ADDRESS_QUERY = gql`
  query AddressQuery {
    currentUser {
      id
      shippingAddress
    }
  }
`

const ORDER_TSHIRT = gql`
  mutation OrderTshirt($product: Shirt!, $size: Size!) {
    orderTshirt(product: $product, size: $size) {
      id
      hasTshirt
    }
  }
`

const TshirtOrderForm = () => (
  <Query query={ADDRESS_QUERY}>
    {({ data }) => (
      <Mutation mutation={ORDER_TSHIRT}>
        {(orderTshirt) => (
          <Formik
            initialValues={{
              product: '',
              size: '',
            }}
            validate={(values) => {
              const errors = {}

              if (!values.product) {
                errors.product = 'Select an t-shirt option'
              }
              if (!values.size) {
                errors.size = 'Select a size'
              }

              return errors
            }}
            onSubmit={(values, { setSubmitting }) => {
              console.log('onSubmit', values)
              console.log('setSubmitting:', setSubmitting, setSubmitting(false))
              orderTshirt({
                variables: values,
                onCompleted: () =>
                  console.log('completed') || setSubmitting(false),
              }).catch((e) => {
                console.log('e:', e)

                const failedError = e.graphQLErrors.find(({ message }) =>
                  message.match('order-failed')
                )
                if (failedError) {
                  alert(
                    `Sorry! There was an error with your order. Please email tshirts@graphql.guide with your tshirt choice and address so we can send it manually 😊\n\n${failedError.message}`
                  )
                }
              })
            }}
          >
            {({
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              handleSubmit,
              isSubmitting,
            }) => {
              const { id, shippingAddress } = (data && data.currentUser) || {}

              const showProductError = !!(touched.product && errors.product),
                showSizeError = !!(touched.size && errors.size),
                mailto = `mailto:tshirts@graphql.guide?subject=New Tshirt Order&body=Option: ${values.product}%0D%0ASize: ${values.size}%0D%0AShipping address:%0D%0A%0D%0A%0D%0A%0D%0AUID: ${id}`

              return (
                <form className="TshirtOrderForm" onSubmit={handleSubmit}>
                  <FormControl error={showProductError}>
                    <InputLabel htmlFor="product">Option</InputLabel>
                    <Select
                      native
                      name="product"
                      value={values.product}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      input={<Input id="product" />}
                    >
                      <option value="" />
                      <option value="GRAY">Gray</option>
                      <option value="NAVY">Navy</option>
                      <option value="CONTOURED">Contoured</option>
                    </Select>
                    {showProductError && (
                      <FormHelperText>{errors.product}</FormHelperText>
                    )}
                  </FormControl>
                  <FormControl error={showSizeError}>
                    <InputLabel htmlFor="size">Size</InputLabel>
                    <Select
                      native
                      name="size"
                      value={values.size}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      input={<Input id="size" />}
                    >
                      <option value="" />
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="XL">XL</option>
                      <option value="XXL">XXL</option>
                    </Select>
                    {showSizeError && (
                      <FormHelperText>{errors.size}</FormHelperText>
                    )}
                  </FormControl>
                  <div>
                    Size guide:
                    <div className="TshirtOrderForm-sizes">
                      <LinkNewTab href={images.url('gray-sizes')}>
                        gray
                      </LinkNewTab>
                      <LinkNewTab href={images.url('navy-sizes')}>
                        navy
                      </LinkNewTab>
                      <LinkNewTab href={images.url('contoured-sizes')}>
                        contoured
                      </LinkNewTab>
                    </div>
                  </div>
                  {shippingAddress && (
                    <div>
                      Shipping to:
                      <div className="TshirtOrderForm-address">
                        {shippingAddress.map((line, i) => (
                          <div key={i}>{line}</div>
                        ))}
                      </div>
                      Wrong address? Order{' '}
                      <LinkNewTab href={mailto}>by email</LinkNewTab> instead.
                    </div>
                  )}
                  {shippingAddress && (
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={isSubmitting}
                    >
                      Order
                    </Button>
                  )}
                  {!shippingAddress && (
                    <div className="TshirtOrderForm-email-order">
                      Select which option and size you'd like, and then{' '}
                      <LinkNewTab href={mailto}>email us</LinkNewTab> with your
                      shipping address
                    </div>
                  )}
                </form>
              )
            }}
          </Formik>
        )}
      </Mutation>
    )}
  </Query>
)

export default TshirtOrderForm
