const Opbeat = require('opbeat')

const config = require('../config')
const secret = require('../secret')

if (config.isProd) {
  global.opbeat = Opbeat.start(secret.opbeat)
}
