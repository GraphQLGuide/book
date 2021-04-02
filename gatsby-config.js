const themeOptions = require('gatsby-theme-apollo-docs/theme-options')

require('dotenv').config({
  path: `.env.${process.env.NODE_ENV}`,
})

const tableOfContents = {
  null: ['preface', 'README'],
  Background: [
    'background/index',
    'background/javascript',
    'background/json',
    'background/git',
    'background/node-npm-and-nvm',
    'background/http',
    'background/server',
    'background/databases',
    'background/spa',
    'background/ssr',
    'background/react',
    'background/vue',
    'background/mobile-apps',
    'background/latency',
    'background/cdn',
    'background/webhooks',
    'background/testing',
    'background/continuous-integration',
    'background/authentication',
    'background/browser-performance',
  ],
  '1. Understanding GraphQL Through REST': [
    'understanding-graphql/index',
    'understanding-graphql/introduction',
    'understanding-graphql/graphql-as-an-alternative-to-a-rest-api',
    'understanding-graphql/a-simple-rest-api-server',
    'understanding-graphql/a-simple-graphql-server',
    'understanding-graphql/querying-a-set-of-data',
    'understanding-graphql/filtering-the-data',
    'understanding-graphql/async-data-loading',
    'understanding-graphql/multiple-types-of-data',
    'understanding-graphql/security-&-error-handling',
    'understanding-graphql/tying-this-all-together',
  ],
  'Part I · The Spec': [],
  '2. Query Language': [
    'query-language/index',
    'query-language/operations',
    'query-language/document',
    'query-language/selection-sets',
    'query-language/fields',
    'query-language/arguments',
    'query-language/variables',
    'query-language/field-aliases',
    'query-language/fragments',
    'query-language/named-fragments',
    'query-language/type-conditions',
    'query-language/inline-fragments',
    'query-language/directives',
    'query-language/mutations',
    'query-language/subscriptions',
    'query-language/summary',
  ],
  '3. Type System': [
    'type-system/index',
    'type-system/schema',
    'type-system/types',
    'type-system/descriptions',
    'type-system/scalars',
    'type-system/enums',
    'type-system/objects',
    'type-system/interfaces',
    'type-system/unions',
    'type-system/lists',
    'type-system/non-null',
    'type-system/field-arguments',
    'type-system/directives',
    'type-system/extending',
    'type-system/introspection',
    'type-system/summary',
  ],
  '4. Validation & Execution': [
    'validation-and-execution/index',
    'validation-and-execution/validation',
    'validation-and-execution/execution',
  ],
  'Part II · The Client': [],
  '5. Client Dev': [
    'client/index',
    'client/anywhere-http',
    'client/client-libraries',
  ],
  '6. React': [
    'react/index',
    'react/setting-up',
    'react/querying',
    'react/authentication',
    'react/mutating',
    'react/advanced-querying',
    'react/paginating',
    'react/client-side-ordering-&-filtering',
    'react/local-state',
    'react/rest',
    'react/review-subscriptions',
    'react/prefetching',
    'react/batching',
    'react/persisting',
    'react/multiple-endpoints',
    'react/extended-topics',
    'react/linting',
    'react/uploading-files',
    'react/testing',
  ],
  '7: Vue': [
    'vue/index',
    'vue/setting-up-apollo',
    'vue/querying',
    'vue/querying-with-variables',
    'vue/further-topics',
  ],
  '8: React Native': [
    'react-native/index',
    'react-native/app-structure',
    'react-native/adding-apollo',
    'react-native/adding-a-screen',
    'react-native/persisting',
    'react-native/deploying',
  ],
  '9: iOS': ['ios/index'],
  '10: Android': [
    'android/index',
    'android/setting-up-apollo-android',
    'android/first-query',
    'android/querying-with-variables',
    'android/caching',
    'android/viewmodel',
    'android/flow',
  ],
  'Part III · The Server': [],
  '11: Server Dev': [
    'server/index',
    'server/introduction',
    'server/building',
    'server/project-setup',
    'server/types-and-resolvers',
    'server/authentication',
    'server/data-sources',
    'server/custom-scalars',
    'server/creating-users',
    'server/authorization',
    'server/errors',
    'server/subscriptions',
    'server/testing',
    'server/production',
    'server/deployment',
    'server/database-hosting',
    'server/querying-in-production',
    'server/analytics',
    'server/error-reporting',
    'server/more-data-sources',
    'server/sql',
    'server/rest',
    'server/graphql',
    'server/custom-data-source',
    'server/extended-topics',
    'server/mocking',
    'server/pagination',
    'server/file-uploads',
    'server/schema-validation',
    'server/apollo-federation',
    'server/hasura',
    'server/schema-design',
    'server/custom-schema-directives',
    'server/subscriptions-in-depth',
    'server/security',
    'server/performance',
    'server/future',
  ],
  'Part IV · Extras': [],
  'Server-Side Rendering': [
    'ssr/index',
    'ssr/setting-up-the-server',
    'ssr/adding-react',
    'ssr/adding-apollo',
  ],
  'Apollo Federation': [
    'federation/index',
    'federation/federated-service',
    'federation/federated-gateway',
    'federation/extending-entities',
    'federation/managed-federation',
    'federation/deploying-federation',
  ],
  // Linting: [
  //   'linting/index',
  //   'linting/setting-up-linting',
  //   'linting/fixing-linting-errors',
  //   'linting/using-linting',
  // ],
  'Server Analytics': ['server-analytics/index'],
  'Stripe and Service Integrations': [
    'service-integrations/index',
    'service-integrations/making-a-query',
    'service-integrations/writing-server-side-code',
    'service-integrations/creating-persisted-queries',
  ],
  'Preventing DoS Attacks': ['preventing-dos-attacks/index'],
}

const titleFont = encodeURIComponent('Source Sans Pro')
// https://github.com/jlengstorf/get-share-image
const shareImageConfig = {
  titleFont,
  titleFontSize: 80,
  titleExtraConfig: '_bold',
  taglineFont: titleFont,
  textColor: 'FFFFFF',
  textLeftOffset: 50,
  textAreaWidth: 750,
  cloudName: 'graphql',
  imagePublicID: 'social',
}

module.exports = {
  plugins: [
    {
      resolve: 'gatsby-theme-apollo-docs',
      options: {
        ...themeOptions,
        root: __dirname,
        baseDir: '',
        contentDir: 'text',
        siteName: 'The GraphQL Guide',
        pageTitle: 'The GraphQL Guide',
        description: 'The complete reference text for GraphQL and Apollo',
        githubRepo: 'GraphQLGuide/book',
        defaultVersion: '1.0',
        ffWidgetId: '80119a3c-6bb7-469f-9ee9-fa3f719c2805',
        gaTrackingId: ['UA-96115966-1'],
        algoliaApiKey: '15e200d18fe3e48dbec05442a10c4ff1',
        algoliaIndexName: 'guide',
        baseUrl: 'https://graphql.guide',
        twitterHandle: 'graphqlguide',
        spectrumHandle: null,
        youtubeUrl: null,
        logoLink: 'https://graphql.guide/introduction',
        footerNavConfig: {},
        shareImageConfig,
        sidebarCategories: tableOfContents,
      },
    },
    'gatsby-plugin-use-query-params',
    'gatsby-theme-apollo',
    {
      resolve: 'gatsby-plugin-heap',
      options: {
        appId: '3557733793',
        enableOnDevMode: true,
      },
    },
  ],
}
