var compress = require('compression')
var config = require('../config')
var debug = require('debug')('webtorrent:web')
var express = require('express')
var fs = require('fs')
var http = require('http')
var https = require('https')
var jade = require('jade')
var parallel = require('run-parallel')
var path = require('path')
var url = require('url')
var util = require('./util')

var app = express()
var httpServer = http.createServer(app)
var httpsServer = https.createServer({
  key: fs.readFileSync(__dirname + '/../secret/instant.io.key'),
  cert: fs.readFileSync(__dirname + '/../secret/instant.io.chained.crt')
}, app)

util.upgradeLimits()

// Templating
app.set('views', __dirname + '/views')
app.set('view engine', 'jade')
app.engine('jade', jade.renderFile)

app.use(compress())

// Add headers
app.use(function (req, res, next) {
  var extname = path.extname(url.parse(req.url).pathname)

  // Add cross-domain header for fonts, required by spec, Firefox, and IE.
  if (['.eot', '.ttf', '.otf', '.woff'].indexOf(extname) >= 0) {
    res.header('Access-Control-Allow-Origin', '*')
  }

  // Prevents IE and Chrome from MIME-sniffing a response. Reduces exposure to
  // drive-by download attacks on sites serving user uploaded content.
  res.header('X-Content-Type-Options', 'nosniff')

  // Prevent rendering of site within a frame.
  res.header('X-Frame-Options', 'DENY')

  // Enable the XSS filter built into most recent web browsers. It's usually
  // enabled by default anyway, so role of this headers is to re-enable for this
  // particular website if it was disabled by the user.
  res.header('X-XSS-Protection', '1; mode=block')

  // Force IE to use latest rendering engine or Chrome Frame
  res.header('X-UA-Compatible', 'IE=Edge,chrome=1')

  next()
})

app.use(express.static(__dirname + '/../static'))

app.get('/', function (req, res) {
  res.render('index')
})

app.get('*', function (req, res) {
  res.render('error')
})

parallel([
  function (cb) {
    httpServer.listen(config.ports.http, config.host, cb)
  },
  function (cb) {
    httpsServer.listen(config.ports.https, config.host, cb)
  }
], function (err) {
  if (err) throw err
  debug('listening on port %s', JSON.stringify(config.ports))
  util.downgradeUid()
})
