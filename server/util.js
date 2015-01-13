var debug = require('debug')('instant:util')
var posix = require('posix')

var MAX_SOCKETS = 10000

exports.downgradeUid = function () {
  if (process.platform === 'linux' && process.env.NODE_ENV === 'production') {
    process.setgid('www-data')
    process.setuid('www-data')
    debug('downgraded gid (' + process.getgid() + ') uid (' + process.getuid() + ')')
  }
}

exports.upgradeLimits = function () {
  posix.setrlimit('nofile', { soft: MAX_SOCKETS, hard: MAX_SOCKETS })
  var limits = posix.getrlimit('nofile')
  debug('upgraded resource limits to ' + limits.soft)
}
