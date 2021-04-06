import find from 'lodash/find'

export const BASE_LICENSES = 5

class Package {
  constructor(fields) {
    Object.assign(this, fields)
  }

  fullName(licenses) {
    if (licenses) {
      return `${this.name}—${licenses} seats`
    } else {
      return this.name
    }
  }

  fullPrice(licenses) {
    if (licenses) {
      return this.price * (licenses / BASE_LICENSES)
    } else {
      return this.price
    }
  }

  individualPackage() {
    if (this.basic) {
      return 'basic'
    } else if (this.pro || this.team) {
      return 'pro'
    } else {
      return 'full'
    }
  }
}

const packages = [
  {
    basic: true,
    key: 'basic',
    name: 'Basic',
    price: 39,
  },
  {
    pro: true,
    key: 'pro',
    name: 'Pro',
    price: 89,
  },
  {
    full: true,
    key: 'full',
    name: 'Full edition',
    price: 289,
    includesTshirt: true,
    includesSlackAccess: true,
  },
  {
    training: true,
    key: 'training',
    name: 'Training',
    price: 749,
    includesTshirt: true,
    includesSlackAccess: true,
  },
  {
    team: true,
    key: 'team',
    name: 'Team license',
    isGroup: true,
    price: 349,
    includesTshirt: false,
    includesSlackAccess: false,
  },
  {
    fullteam: true,
    key: 'fullteam',
    name: 'Full team license',
    isGroup: true,
    price: 1000,
    includesTshirt: true,
    includesSlackAccess: true,
  },
].map((pkg) => new Package(pkg))

// `which` is either:
//   'team'
//   { team: true, full: false}
export const getPackage = (which) => {
  if (typeof which === 'object') {
    for (const prop in which) {
      if (which[prop]) {
        return find(packages, [prop, true]) || {}
      }
    }
    return {}
  } else {
    const name = which.toLowerCase()
    return find(packages, [name, true]) || {}
  }
}

export default packages
