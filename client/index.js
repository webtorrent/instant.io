const createTorrent = require('create-torrent')
const debug = require('debug')('instant.io')
const dragDrop = require('drag-drop')
const escapeHtml = require('escape-html')
const get = require('simple-get')
const formatDistance = require('date-fns/formatDistance')
const path = require('path')
const prettierBytes = require('prettier-bytes')
const throttle = require('throttleit')
const thunky = require('thunky')
const uploadElement = require('upload-element')
const WebTorrent = require('webtorrent')
const JSZip = require('jszip')
const SimplePeer = require('simple-peer')

const util = require('./util')

global.WEBTORRENT_ANNOUNCE = createTorrent.announceList
  .map(function (arr) {
    return arr[0]
  })
  .filter(function (url) {
    return url.indexOf('wss://') === 0 || url.indexOf('ws://') === 0
  })

const DISALLOWED = [
  '6feb54706f41f459f819c0ae5b560a21ebfead8f'
]

const getClient = thunky(function (cb) {
  getRtcConfig(function (err, rtcConfig) {
    if (err) util.error(err)
    const client = new WebTorrent({
      tracker: {
        rtcConfig: {
          ...SimplePeer.config,
          ...rtcConfig
        }
      }
    })
    window.client = client // for easier debugging
    client.on('warning', util.warning)
    client.on('error', util.error)
    cb(null, client)
  })
})

init()

function init () {
  if (!WebTorrent.WEBRTC_SUPPORT) {
    util.error('This browser is unsupported. Please use a browser with WebRTC support.')
  }

  // For performance, create the client immediately
  getClient(function () {})

  // Seed via upload input element
  const upload = document.querySelector('input[name=upload]')
  if (upload) {
    uploadElement(upload, function (err, files) {
      if (err) return util.error(err)
      files = files.map(function (file) { return file.file })
      onFiles(files)
    })
  }

  // Seed via drag-and-drop
  dragDrop('body', onFiles)

  // Download via input element
  const form = document.querySelector('form')
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault()
      downloadTorrent(document.querySelector('form input[name=torrentId]').value.trim())
    })
  }

  // Download by URL hash
  onHashChange()
  window.addEventListener('hashchange', onHashChange)
  function onHashChange () {
    const hash = decodeURIComponent(window.location.hash.substring(1)).trim()
    if (hash !== '') downloadTorrent(hash)
  }

  // Register a protocol handler for "magnet:" (will prompt the user)
  if ('registerProtocolHandler' in navigator) {
    navigator.registerProtocolHandler('magnet', window.location.origin + '#%s', 'Instant.io')
  }
}

function getRtcConfig (cb) {
  // WARNING: This is *NOT* a public endpoint. Do not depend on it in your app.
  get.concat({
    url: '/__rtcConfig__',
    timeout: 5000
  }, function (err, res, data) {
    if (err || res.statusCode !== 200) {
      cb(new Error('Could not get WebRTC config from server. Using default (without TURN).'))
    } else {
      try {
        data = JSON.parse(data)
      } catch (err) {
        return cb(new Error('Got invalid WebRTC config from server: ' + data))
      }
      debug('got rtc config: %o', data.rtcConfig)
      cb(null, data.rtcConfig)
    }
  })
}

function onFiles (files) {
  debug('got files:')
  files.forEach(function (file) {
    debug(' - %s (%s bytes)', file.name, file.size)
  })

  // .torrent file = start downloading the torrent
  files.filter(isTorrentFile).forEach(downloadTorrentFile)

  // everything else = seed these files
  seed(files.filter(isNotTorrentFile))
}

function isTorrentFile (file) {
  const extname = path.extname(file.name).toLowerCase()
  return extname === '.torrent'
}

function isNotTorrentFile (file) {
  return !isTorrentFile(file)
}

function downloadTorrent (torrentId) {
  const disallowed = DISALLOWED.some(function (infoHash) {
    return torrentId.indexOf(infoHash) >= 0
  })

  if (disallowed) {
    util.log('File not found ' + torrentId)
  } else {
    util.log('Downloading torrent from ' + torrentId)
    getClient(function (err, client) {
      if (err) return util.error(err)
      client.add(torrentId, onTorrent)
    })
  }
}

function downloadTorrentFile (file) {
  util.unsafeLog('Downloading torrent from <strong>' + escapeHtml(file.name) + '</strong>')
  getClient(function (err, client) {
    if (err) return util.error(err)
    client.add(file, onTorrent)
  })
}

function seed (files) {
  if (files.length === 0) return
  util.log('Seeding ' + files.length + ' files')

  // Seed from WebTorrent
  getClient(function (err, client) {
    if (err) return util.error(err)
    client.seed(files, onTorrent)
  })
}

function onTorrent (torrent) {
  torrent.on('warning', util.warning)
  torrent.on('error', util.error)

  const upload = document.querySelector('input[name=upload]')
  upload.value = upload.defaultValue // reset upload element

  const torrentFileName = path.basename(torrent.name, path.extname(torrent.name)) + '.torrent'

  util.log('"' + torrentFileName + '" contains ' + torrent.files.length + ' files:')

  torrent.files.forEach(function (file) {
    util.unsafeLog('&nbsp;&nbsp;- ' + escapeHtml(file.name) + ' (' + escapeHtml(prettierBytes(file.length)) + ')')
  })

  util.log('Torrent info hash: ' + torrent.infoHash)
  util.unsafeLog(
    '<a href="/#' + escapeHtml(torrent.infoHash) + '" onclick="prompt(\'Share this link with anyone you want to download this torrent:\', this.href);return false;">[Share link]</a> ' +
    '<a href="' + escapeHtml(torrent.magnetURI) + '" target="_blank">[Magnet URI]</a> ' +
    '<a href="' + escapeHtml(torrent.torrentFileBlobURL) + '" target="_blank" download="' + escapeHtml(torrentFileName) + '">[Download .torrent]</a>'
  )

  function updateSpeed () {
    const progress = (100 * torrent.progress).toFixed(1)

    let remaining
    if (torrent.done) {
      remaining = 'Done.'
    } else {
      remaining = torrent.timeRemaining !== Infinity
        ? formatDistance(torrent.timeRemaining, 0, { includeSeconds: true })
        : 'Infinity years'
      remaining = remaining[0].toUpperCase() + remaining.substring(1) + ' remaining.'
    }

    util.updateSpeed(
      '<b>Peers:</b> ' + torrent.numPeers + ' ' +
      '<b>Progress:</b> ' + progress + '% ' +
      '<b>Download speed:</b> ' + prettierBytes(window.client.downloadSpeed) + '/s ' +
      '<b>Upload speed:</b> ' + prettierBytes(window.client.uploadSpeed) + '/s ' +
      '<b>ETA:</b> ' + remaining
    )
  }

  torrent.on('download', throttle(updateSpeed, 250))
  torrent.on('upload', throttle(updateSpeed, 250))
  setInterval(updateSpeed, 5000)
  updateSpeed()

  torrent.files.forEach(function (file) {
    // append file
    file.appendTo(util.logElem, {
      maxBlobLength: 2 * 1000 * 1000 * 1000 // 2 GB
    }, function (err, elem) {
      if (err) return util.error(err)
    })

    // append download link
    file.getBlobURL(function (err, url) {
      if (err) return util.error(err)

      const a = document.createElement('a')
      a.target = '_blank'
      a.download = file.name
      a.href = url
      a.textContent = 'Download ' + file.name
      util.appendElemToLog(a)
    })
  })

  const downloadZip = document.createElement('a')
  downloadZip.href = '#'
  downloadZip.target = '_blank'
  downloadZip.textContent = 'Download all files as zip'
  downloadZip.addEventListener('click', function (event) {
    let addedFiles = 0
    const zipFilename = path.basename(torrent.name, path.extname(torrent.name)) + '.zip'
    let zip = new JSZip()
    event.preventDefault()

    torrent.files.forEach(function (file) {
      file.getBlob(function (err, blob) {
        addedFiles += 1
        if (err) return util.error(err)

        // add file to zip
        zip.file(file.path, blob)

        // start the download when all files have been added
        if (addedFiles === torrent.files.length) {
          if (torrent.files.length > 1) {
            // generate the zip relative to the torrent folder
            zip = zip.folder(torrent.name)
          }
          zip.generateAsync({ type: 'blob' })
            .then(function (blob) {
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.download = zipFilename
              a.href = url
              a.click()
              setTimeout(function () {
                URL.revokeObjectURL(url)
              }, 30 * 1000)
            }, util.error)
        }
      })
    })
  })
  util.appendElemToLog(downloadZip)
}
