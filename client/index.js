var blobToBuffer = require('blob-to-buffer')
var debug = require('debug')('instant.io')
var dragDrop = require('drag-drop')
var listify = require('listify')
var parseTorrent = require('parse-torrent')
var path = require('path')
var Peer = require('simple-peer')
var prettyBytes = require('pretty-bytes')
var thunky = require('thunky')
var uploadElement = require('upload-element')
var videostream = require('videostream')
var WebTorrent = require('webtorrent')
var xhr = require('xhr')

var util = require('./util')

global.WEBTORRENT_ANNOUNCE = [ 'wss://tracker.webtorrent.io' ]

var VIDEOSTREAM_EXTS = [ '.mp4', '.m4v', '.m4a' ]

var MEDIASOURCE_VIDEO_EXTS = [ '.mp4', '.m4v', '.webm' ]
var MEDIASOURCE_AUDIO_EXTS = [ '.m4a', '.mp3' ]
var MEDIASOURCE_EXTS = MEDIASOURCE_VIDEO_EXTS.concat(MEDIASOURCE_AUDIO_EXTS)

var AUDIO_EXTS = [ '.wav', '.aac', '.ogg', '.oga' ]
var IMAGE_EXTS = [ '.jpg', '.png', '.gif', '.bmp' ]
var TEXT_EXTS = [ '.css', '.html', '.js', '.md', '.pdf', '.txt' ]

if (!Peer.WEBRTC_SUPPORT) {
  util.error('This browser is unsupported. Please use a browser with WebRTC support.')
}

var getClient = thunky(function (cb) {
  xhr('/rtcConfig', function (err, res) {
    var rtcConfig
    if (err || res.statusCode !== 200) {
      util.error('Could not get WebRTC config from server. Using default (without TURN).')
    } else {
      try {
        rtcConfig = JSON.parse(res.body)
      } catch (err) {
        util.error('Got invalid WebRTC config from server: ' + res.body)
      }
      if (rtcConfig) debug('got rtc config: %o', rtcConfig)
    }
    var client = new WebTorrent({ rtcConfig: rtcConfig })
    client.on('warning', util.warning)
    client.on('error', util.error)
    cb(null, client)
  })
})

getClient(function (err, client) {
  if (err) return util.error(err)
  window.client = client
})

var upload = document.querySelector('input[name=upload]')
uploadElement(upload, function (err, files) {
  if (err) return util.error(err)
  files = files.map(function (file) { return file.file })
  onFiles(files)
})

dragDrop('body', onFiles)

document.querySelector('form').addEventListener('submit', function (e) {
  e.preventDefault()
  downloadInfoHash(document.querySelector('form input[name=infoHash]').value)
})

var hash = window.location.hash.replace('#', '')
if (/^[a-f0-9]+$/i.test(hash)) {
  downloadInfoHash(hash)
}

window.addEventListener('beforeunload', onBeforeUnload)

function onFiles (files) {
  debug('got files:')
  files.forEach(function (file) {
    debug(' - %s (%s bytes)', file.name, file.size)
  })

  // .torrent file = start downloading the torrent
  files.filter(isTorrent).forEach(downloadTorrent)

  // everything else = seed these files
  seed(files.filter(isNotTorrent))
}

function isTorrent (file) {
  var extname = path.extname(file.name).toLowerCase()
  return extname === '.torrent'
}

function isNotTorrent (file) {
  return !isTorrent(file)
}

function downloadInfoHash (infoHash) {
  util.log('Downloading torrent from <strong>infohash</strong> ' + infoHash)
  getClient(function (err, client) {
    if (err) return util.error(err)
    client.add(infoHash, onTorrent)
  })
}

function downloadTorrent (file) {
  debug('downloadTorrent %s', file.name || file)
  getClient(function (err, client) {
    if (err) return util.error(err)
    util.log('Downloading torrent from <strong>file</strong> ' + file.name)
    blobToBuffer(file, function (err, buf) {
      if (err) return util.error(err)
      var parsedTorrent = parseTorrent(buf)
      client.add(parsedTorrent, onTorrent)
    })
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
  upload.value = upload.defaultValue // reset upload element

  var torrentFileName = path.basename(torrent.name, path.extname(torrent.name)) + '.torrent'

  util.log(
    'Torrent info hash: ' + torrent.infoHash + ' ' +
    '<a href="/#' + torrent.infoHash + '" target="_blank">[Share link]</a> ' +
    '<a href="' + torrent.magnetURI + '" target="_blank">[Magnet URI]</a> ' +
    '<a href="' + torrent.torrentFileURL + '" target="_blank" download="' + torrentFileName + '">[Download .torrent]</a>'
  )

  function updateSpeed () {
    var progress = (100 * torrent.downloaded / torrent.parsedTorrent.length).toFixed(1)
    util.updateSpeed(
      '<b>Peers:</b> ' + torrent.swarm.wires.length + ' ' +
      '<b>Progress:</b> ' + progress + '% ' +
      '<b>Download speed:</b> ' + prettyBytes(window.client.downloadSpeed()) + '/s ' +
      '<b>Upload speed:</b> ' + prettyBytes(window.client.uploadSpeed()) + '/s'
    )
  }

  torrent.swarm.on('download', updateSpeed)
  torrent.swarm.on('upload', updateSpeed)
  setInterval(updateSpeed, 5000)
  updateSpeed()

  torrent.files.forEach(function (file) {
    var audio
    var extname = path.extname(file.name).toLowerCase()

    if (MEDIASOURCE_EXTS.indexOf(extname) >= 0) {
      if (window.MediaSource) {
        mediaSourceStream(file)
      } else {
        util.error(
          'Video/audio streaming is not supported in your browser. You can still share ' +
          'or download ' + file.name + ' (once it\'s fully downloaded). Use Chrome for ' +
          'MediaSource support.'
        )
      }
    }

    file.getBlobURL(function (err, url) {
      if (err) return util.error(err)

      if (AUDIO_EXTS.indexOf(extname) >= 0) {
        audio = document.createElement('audio')
        audio.src = url
        audio.controls = true
        audio.autoplay = true
        util.log(audio)
        audio.play()
      }

      if (IMAGE_EXTS.indexOf(extname) >= 0) {
        var img = document.createElement('img')
        img.src = url
        img.alt = file.name
        util.log(img)
      }

      if (TEXT_EXTS.indexOf(extname) >= 0) {
        var iframe = document.createElement('iframe')
        iframe.src = url
        if (extname !== '.pdf') iframe.sandbox = 'allow-forms allow-scripts'
        util.log(iframe)
      }

      var a = document.createElement('a')
      a.target = '_blank'
      a.download = file.name
      a.href = url
      a.textContent = 'Download ' + file.name
      util.log(a)
    })
  })
}

function onBeforeUnload (e) {
  if (!e) e = window.event

  if (!window.client || window.client.torrents.length === 0) return

  var isLoneSeeder = window.client.torrents.some(function (torrent) {
    return torrent.swarm && torrent.swarm.numPeers === 0 && torrent.progress === 1
  })
  if (!isLoneSeeder) return

  var names = listify(window.client.torrents.map(function (torrent) {
    return '"' + (torrent.name || torrent.infoHash) + '"'
  }))

  var theseTorrents = window.client.torrents.length >= 2
    ? 'these torrents'
    : 'this torrent'
  var message = 'You are the only person sharing ' + names + '. ' +
    'Consider leaving this page open to continue sharing ' + theseTorrents + '.'

  if (e) e.returnValue = message // IE, Firefox
  return message // Safari, Chrome
}

function mediaSourceStream (file, useVideoStream) {
  var elem
  var extname = path.extname(file.name).toLowerCase()
  var tagName = MEDIASOURCE_VIDEO_EXTS.indexOf(extname) >= 0 ? 'video' : 'audio'

  if (VIDEOSTREAM_EXTS.indexOf(extname) >= 0) {
    useVideostream()
  } else {
    useMediaSource()
  }

  function useVideostream () {
    debug('Use `videostream` package for ' + file.name)
    createElem()
    elem.addEventListener('error', fallbackToMediaSource)
    videostream(file, elem)
    appendElem()
  }

  function useMediaSource () {
    debug('Use MediaSource API for ' + file.name)
    createElem()
    elem.addEventListener('error', fallbackToBlobURL)
    file.createReadStream().pipe(elem)
    appendElem()
  }

  function useBlobURL () {
    debug('Use Blob URL for ' + file.name)
    createElem()
    elem.addEventListener('error', fatalError)
    appendElem()
    file.getBlobURL(function (err, url) {
      if (err) return fatalError(err)
      elem.src = url
      // elem.play()
    })
  }

  function fallbackToMediaSource (err) {
    debug('videostream error: fallback to MediaSource API: ' + err.message)
    elem.removeEventListener('error', fallbackToMediaSource)

    useMediaSource()
  }

  function fallbackToBlobURL (err) {
    debug('MediaSource API error: fallback to Blob URL: ' + err.message)
    elem.removeEventListener('error', fallbackToBlobURL)

    useBlobURL()
  }

  function fatalError (err) {
    debug('videostream error: fallback to blob URL: ' + err.message)
    if (elem) elem.remove()
    util.error('Unable to stream ' + file.name)
  }

  function createElem () {
    if (elem) elem.remove()
    elem = document.createElement(tagName)
    elem.controls = true
    elem.autoplay = true
    return elem
  }

  function appendElem () {
    util.log(elem)
    elem.play()
  }
}
