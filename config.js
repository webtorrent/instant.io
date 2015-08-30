exports.isProd = process.env.NODE_ENV === 'production'
exports.isHeroku = process.env.DYNO && process.env.PORT
exports.host = exports.isProd && '23.239.22.146'
exports.ports = {
  http: exports.isProd ? process.env.PORT || 80 : 9100,
  https: exports.isProd ? process.env.PORT || 443 : 9101
}
