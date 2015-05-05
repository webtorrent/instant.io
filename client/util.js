var log = document.querySelector('.log')
var speed = document.querySelector('.speed')
var logHeading = document.querySelector('#logHeading')

exports.logAppend = function logAppend (item) {
  logHeading.style.display = 'block'
  if (typeof item === 'string') {
    var p = document.createElement('p')
    p.innerHTML = item
    log.appendChild(p)
  } else {
    log.appendChild(item)
    log.appendChild(document.createElement('br'))
  }
}

// replace the last P in the log
exports.updateSpeed = function updateSpeed (str) {
  speed.innerHTML = str
}

exports.warning = function warning (err) {
  console.error(err.stack || err.message || err)
  exports.logAppend(err.message || err)
}

exports.error = function error (err) {
  console.error(err.stack || err.message || err)
  exports.logAppend(err.message || err)
  window.alert(err.message || err)
}
