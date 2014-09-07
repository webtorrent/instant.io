var PORT_80 = process.env.NODE_ENV === 'production' ? 80 : 9100
var PORT_443 = process.env.NODE_ENV === 'production' ? 443 : 9101

exports.host = process.env.NODE_ENV === 'production' && '23.239.22.146'

exports.ports = {
  http: PORT_80,
  https: PORT_443
}
