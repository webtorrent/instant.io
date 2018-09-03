const Rollbar = require('rollbar')
const { isProd } = require('../config')
const { rollbar: rollbarSecret } = require('../secret')

if (isProd) {
  global.rollbar = new Rollbar({
    accessToken: rollbarSecret.accessToken,
    captureUncaught: true,
    captureUnhandledRejections: true,
    checkIgnore: (isUncaught, args) => {
      // Ignore 404 errors
      const err = args[0]
      return !isUncaught && err && err.status === 404
    }
  })
}
