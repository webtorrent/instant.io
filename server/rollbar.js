const Rollbar = require('rollbar')
const { isProd } = require('../config')
const { rollbar: rollbarSecret } = require('../secret')

if (isProd) {
  global.rollbar = new Rollbar({
    accessToken: rollbarSecret.accessToken,
    captureUncaught: true,
    captureUnhandledRejections: true,
    checkIgnore: (isUncaught, args) => {
      const err = args[0]

      // Never ignore uncaught errors
      if (isUncaught) return false

      // Ignore 'Bad Request' errors
      if (err.status === 400) return true

      // Ignore 'Forbidden' errors
      if (err.status === 403) return true

      // Ignore 'Not Found' errors
      if (err.status === 404) return true

      // Ignore 'Precondition Failed' errors
      if (err.status === 412) return true

      // Ignore 'Range Not Satisfiable' errors
      if (err.status === 416) return true

      return false
    }
  })
}
