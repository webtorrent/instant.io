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

if (!Peer.WEBRTC_SUPPORT) {
  util.error('This browser is unsupported. Please use a browser with WebRTC support.')
}

var getClient = thunky(function (cb) {
  xhr('/rtcConfig', function (err, res) {
    if (err) return cb(err)
    var rtcConfig
    try {
      rtcConfig = JSON.parse(res.body)
    } catch (err) {
      return cb(new Error('Expected JSON response from /rtcConfig: ' + res.body))
    }
    debug('got rtc config: %o', rtcConfig)
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

function onFiles (files) {
  // .torrent file = start downloading the torrent
  files.filter(isTorrent).forEach(downloadTorrent)

  // everything else = seed these files
  seed(files.filter(isNotTorrent))
}

function isTorrent (file) {
  var extname = path.extname(file.name)
  return extname === '.torrent'
}

function isNotTorrent (file) {
  return !isTorrent(file)
}

document.querySelector('form').addEventListener('submit', function (e) {
  e.preventDefault()
  downloadInfoHash(document.querySelector('form input[name=infoHash]').value)
})

var hash = window.location.hash.replace('#', '')
if (/^[a-f0-9]+$/i.test(hash)) {
  downloadInfoHash(hash)
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
    util.log('Downloading torrent from <strong>file</strong>' + file.name)
    var parsedTorrent = parseTorrent(file)
    client.add(parsedTorrent, onTorrent)
  })
}

function seed (files) {
  if (files.length === 0) return
  util.log('Seeding ' + files.length + ' files')

  // Seed from WebTorrent
  getClient(function (err, client) {
    if (err) return util.error(err)
    client.seed(files, { announceList: [[ 'wss://tracker.webtorrent.io' ]] }, onTorrent)
  })
}

function onTorrent (torrent) {
  upload.value = upload.defaultValue // reset upload element

  util.log('Torrent info hash: ' + torrent.infoHash + ' <a href="/#' + torrent.infoHash + '">(Share link)</a>')

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
    var extname = path.extname(file.name).toLowerCase()
    if (window.MediaSource) {
      if (extname === '.mp4' || extname === '.m4v' || extname === '.webm') {
        var video = document.createElement('video')
        video.controls = true
        video.autoplay = true
        util.log(video)
        if (extname === '.mp4' || extname === '.m4v') {
          videostream(file, video)
        } else {
          file.createReadStream().pipe(video)
        }
      } else if (extname === '.mp3') {
        var audio = document.createElement('audio')
        audio.controls = true
        audio.autoplay = true
        util.log(audio)
        file.createReadStream().pipe(audio)
      }
    } else {
      util.error('Streaming is not supported in this browser. Try a browser that ' +
        'supports MediaSource, like Chrome. You can still save the file once it\'s ' +
        'fully downloaded, if you want.')
    }

    file.getBlobURL(function (err, url) {
      if (err) return util.error(err)

      if (extname === '.jpg' || extname === '.png') {
        var img = document.createElement('img')
        img.src = url
        img.alt = file.name
        util.log(img)
      }

      var a = document.createElement('a')
      a.download = file.name
      a.href = url
      a.textContent = 'Download ' + file.name
      util.log(a)
    })
  })
}

window.onbeforeunload = function (e) {
  e = e || window.event
  if (!window.client || window.client.torrents.length === 0) return

  var names = listify(window.client.torrents.map(function (torrent) {
    return '"' + (torrent.name || torrent.infoHash) + '"'
  }))

  var theseTorrents = window.client.torrents.length >= 2
    ? 'these torrents'
    : 'this torrent'
  var message = 'If you close this page, you will stop sharing ' + names + '. ' +
    'Consider leaving this page open to seed ' + theseTorrents + '.'

  if (e) e.returnValue = message // IE, Firefox
  return message // Safari, Chrome
}
