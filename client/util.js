var logElem = exports.logElem = document.querySelector('.log')
var speed = document.querySelector('.speed')
var logHeading = document.querySelector('#logHeading')

exports.log = function log (item) {
  logHeading.style.display = 'block'
  if (typeof item === 'string') {
    var p = document.createElement('p')
    p.innerHTML = item
    logElem.appendChild(p)
    return p
  } else {
    logElem.appendChild(item)
    exports.lineBreak()
    return item
  }
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
  exports.log(err.message || err)
}

exports.error = function error (err) {
  console.error(err.stack || err.message || err)
  var p = exports.log(err.message || err)
  p.style.color = 'red'
  p.style.fontWeight = 'bold'
}

// https://gist.github.com/chrisbuttery/cf34533cbb30c95ff155
exports.fadeOut = function fadeOut (el) {
  el.style.opacity = 1

  fade()
  function fade () {
    if ((el.style.opacity -= 0.1) < 0) {
      el.style.display = 'none'
      el.classList.add('u-display--none')
    } else {
      window.requestAnimationFrame(fade)
    }
  }
}

exports.fadeIn = function fadeIn (el, display) {
  el.style.opacity = 0
  el.style.display = display || 'block'

  if (el.classList.contains('u-display--none')) {
    el.classList.remove('u-display--none')
  }

  fade()
  function fade () {
    var val = parseFloat(el.style.opacity)
    if (!((val += 0.1) > 1)) {
      el.style.opacity = val
      window.requestAnimationFrame(fade)
    }
  }
}
