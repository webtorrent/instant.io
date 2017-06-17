var compress = require('compression')
var cors = require('cors')
var downgrade = require('downgrade')
var express = require('express')
var http = require('http')
var pug = require('pug')
var path = require('path')
var twilio = require('twilio')
var unlimited = require('unlimited')
var url = require('url')

var config = require('../config')

var CORS_WHITELIST = [
  // Official WebTorrent site
  'http://webtorrent.io',
  'https://webtorrent.io',

  // Favor to friends :)
  'http://rollcall.audio',
  'https://rollcall.audio'
]

var secret
try {
  secret = require('../secret')
} catch (err) {}

var app = express()
var server = http.createServer(app)

unlimited()

// Trust "X-Forwarded-For" and "X-Forwarded-Proto" nginx headers
app.enable('trust proxy')

// Disable "powered by express" header
app.set('x-powered-by', false)

// Use pug for templates
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')
app.engine('pug', pug.renderFile)

// Pretty print JSON
app.set('json spaces', 2)

// Use GZIP
app.use(compress())

app.use(function (req, res, next) {
  // Force SSL
  if (config.isProd && req.protocol !== 'https') {
    return res.redirect('https://' + (req.hostname || 'instant.io') + req.url)
  }

  // Redirect www to non-www
  if (config.isProd && req.hostname === 'www.instant.io') {
    return res.redirect('https://instant.io' + req.url)
  }

  // Use HTTP Strict Transport Security
  // Lasts 1 year, incl. subdomains, allow browser preload list
  if (config.isProd) {
    res.header(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

  // Add cross-domain header for fonts, required by spec, Firefox, and IE.
  var extname = path.extname(url.parse(req.url).pathname)
  if (['.eot', '.ttf', '.otf', '.woff', '.woff2'].indexOf(extname) >= 0) {
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

app.use(express.static(path.join(__dirname, '../static')))

app.get('/', function (req, res) {
  res.render('index', {
    title: 'Instant.io - Streaming file transfer over WebTorrent'
  })
})

// Fetch new ice_servers from twilio token regularly
var iceServers
var twilioClient
try {
  twilioClient = twilio(secret.twilio.accountSid, secret.twilio.authToken)
} catch (err) {}

function updateIceServers () {
  twilioClient.tokens.create({}, function (err, token) {
    if (err) return console.error(err.message || err)
    if (!token.ice_servers) {
      return console.error('twilio response ' + token + ' missing ice_servers')
    }

    // Support new spec (`RTCIceServer.url` was renamed to `RTCIceServer.urls`)
    iceServers = token.ice_servers.map(function (server) {
      if (server.url != null) {
        server.urls = server.url
        delete server.url
      }
      return server
    })
  })
}

if (twilioClient) {
  setInterval(updateIceServers, 60 * 60 * 4 * 1000).unref()
  updateIceServers()
}

// WARNING: This is *NOT* a public endpoint. Do not depend on it in your app.
app.get('/_rtcConfig', cors({
  origin: function (origin, cb) {
    var allowed = CORS_WHITELIST.indexOf(origin) >= 0 ||
      /https?:\/\/localhost(:|$)/.test(origin) ||
      /https?:\/\/[^./]+\.localtunnel\.me$/.test(origin)
    cb(null, allowed)
  }
}), function (req, res) {
  if (!iceServers) res.status(404).send({ iceServers: [] })
  else res.send({ iceServers: iceServers })
})

app.get('/500', (req, res, next) => {
  next(new Error('Manually visited /500'))
})

app.get('*', function (req, res) {
  res.status(404).render('error', {
    title: '404 Page Not Found - Instant.io',
    message: '404 Not Found'
  })
})

// error handling middleware
app.use(function (err, req, res, next) {
  console.error(err.stack)
  const code = typeof err.code === 'number' ? err.code : 500
  res.status(code).render('error', {
    title: '500 Internal Server Error - Instant.io',
    message: err.message || err
  })
})

server.listen(config.port, function () {
  console.log('listening on port %s', config.port)
  downgrade()
})
