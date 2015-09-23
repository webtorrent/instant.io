exports.isProd = process.env.NODE_ENV === 'production'
exports.isHeroku = process.env.DYNO && process.env.PORT
exports.host = exports.isProd && '23.239.22.146'
exports.ports = {
  http: process.env.PORT || (exports.isProd ? 80 : 9100),
  https: process.env.PORT || (exports.isProd ? 443 : 9101)
}
