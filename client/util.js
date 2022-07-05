const logElem = exports.logElem = document.querySelector('.log')
const logHeading = document.querySelector('#logHeading')
const speed = document.querySelector('.speed')

exports.log = function log (item, unsafe) {
  logHeading.style.display = 'block'

  const p = document.createElement('p')
  if (unsafe) p.innerHTML = item
  else p.textContent = item
  logElem.appendChild(p)
  return p
}

exports.unsafeLog = function unsafeLog (item) {
  return exports.log(item, true)
}

exports.appendElemToLog = function append (item) {
  logHeading.style.display = 'block'

  logElem.appendChild(item)
  exports.lineBreak()
  return item
}

exports.lineBreak = function lineBreak () {
  logElem.appendChild(document.createElement('br'))
}

// replace the last P in the log
exports.updateSpeed = function updateSpeed (str) {
  speed.innerHTML = str
}

exports.warning = function warning (err) {
  console.error(err.stack || err.message || err)
  return exports.log(err.message || err)
}

exports.error = function error (err) {
  console.error(err.stack || err.message || err)
  const p = exports.log(err.message || err)
  p.style.color = 'red'
  p.style.fontWeight = 'bold'
  return p
}
