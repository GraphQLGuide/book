import React from 'react'
import { URL } from 'url'

function getLinkProps({ crossOrigin, pathname }) {
  switch (typeof crossOrigin) {
    case `string`:
      return { crossOrigin }
    case `function`:
      return getLinkProps({ crossOrigin: crossOrigin(pathname), pathname })
    default:
      return { crossOrigin: `anonymous` }
  }
}

export const onRenderBody = (
  { setHeadComponents, pathname = `/` },
  { crossOrigin = `anonymous` } = {}
) => {
  const props = getLinkProps({ crossOrigin, pathname })

  const assets = [
    'https://fonts.gstatic.com/s/sourcecodepro/v11/HI_SiYsKILxRpg3hIP6sJ7fM7PqlPevT.ttf',
    'https://fonts.gstatic.com/s/sourcesanspro/v13/6xK3dSBYKcSV-LCoeQqfX1RYOo3qOK7g.ttf',
    'https://fonts.gstatic.com/s/sourcesanspro/v13/6xKydSBYKcSV-LCoeQqfX1RYOo3i54rwlxdr.ttf',
  ]

  setHeadComponents(
    assets.map((href) => {
      let assetProps

      // External urls should get the props from the plugin configuration.
      // Local urls will be forced with `crossOrigin: "anonymous"`
      try {
        // check if URL is external, if not this constructor throws.
        new URL(href)
        assetProps = props
      } catch (e) {
        assetProps = { crossOrigin: `anonymous` }
      }

      return (
        <link key={href} as="font" href={href} rel="preload" {...assetProps} />
      )
    })
  )
}
