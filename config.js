exports.isProd = process.env.NODE_ENV === 'production'
exports.port = exports.isProd ? 80 : 9100
