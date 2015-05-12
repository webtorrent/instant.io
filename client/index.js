var debug = require('debug')('instant.io')
var dragDrop = require('drag-drop/buffer')
var listify = require('listify')
var magnet = require('magnet-uri')
var parseTorrent = require('parse-torrent')
var path = require('path')
var Peer = require('simple-peer')
var prettysize = require('prettysize')
var thunky = require('thunky')
var toBuffer = require('typedarray-to-buffer')
var upload = require('upload-element')
var videostream = require('videostream')
var WebTorrent = require('webtorrent')
var xhr = require('xhr')

var util = require('./util')

var TRACKER_URL = 'wss://tracker.webtorrent.io'

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

upload(document.querySelector('input[name=upload]'), function (err, results) {
  if (err) return util.error(err)
  var files = results.map(function (r) {
    var buf = toBuffer(r.target.result)
    buf.name = r.file.name
    buf.size = r.file.size
    buf.lastModifiedDate = r.file.lastModifiedDate
    buf.type = r.file.type
    return buf
  })
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
  util.logAppend('Downloading torrent from <strong>infohash</strong> ' + infoHash)
  getClient(function (err, client) {
    if (err) return util.error(err)
    var magnetUri = magnet.encode({
      infoHash: infoHash,
      announce: [ TRACKER_URL ]
    })
    client.add(magnetUri, onTorrent)
  })
}

function downloadTorrent (file) {
  debug('downloadTorrent %s', file.name || file)
  getClient(function (err, client) {
    if (err) return util.error(err)
    util.logAppend('Downloading torrent from <strong>file</strong>' + file.name)
    var parsedTorrent = parseTorrent(file)
    parsedTorrent.announce = [ TRACKER_URL ]
    parsedTorrent.announceList = [ [ TRACKER_URL ] ]
    client.add(parsedTorrent, onTorrent)
  })
}

function seed (files) {
  if (files.length === 0) return

  // Seed from WebTorrent
  getClient(function (err, client) {
    if (err) return util.error(err)
    client.seed(files, { announceList: [ [ TRACKER_URL ] ] }, onTorrent)
  })
}

function onTorrent (torrent) {
  util.logAppend('Torrent info hash: ' + torrent.infoHash + ' <a href="/#' + torrent.infoHash + '">(link)</a>')
  util.logAppend('Downloading from ' + torrent.swarm.wires.length + ' peers')
  util.logAppend('Progress: starting...')

  torrent.swarm.on('download', function () {
    var progress = (100 * torrent.downloaded / torrent.parsedTorrent.length).toFixed(1)
    util.updateSpeed('Progress: ' + progress + '% -- Download speed: ' + prettysize(torrent.swarm.downloadSpeed()) + '/s')
  })

  torrent.swarm.on('upload', function () {
    util.updateSpeed('Upload speed: ' + prettysize(window.client.uploadSpeed()) + '/s')
  })

  torrent.files.forEach(function (file) {
    var extname = path.extname(file.name)
    if ((extname === '.mp4' || extname === '.webm') && window.MediaSource) {
      var video = document.createElement('video')
      video.controls = true
      video.autoplay = true
      util.logAppend(video)
      if (extname === '.mp4') {
        videostream(file, video)
      } else {
        file.createReadStream().pipe(video)
      }
    } else if (extname === '.mp3' && window.MediaSource) {
      var audio = document.createElement('audio')
      audio.controls = true
      audio.autoplay = true
      util.logAppend(audio)
      file.createReadStream().pipe(audio)
    }

    file.getBlobURL(function (err, url) {
      if (err) return util.error(err)

      if (extname === '.jpg' || extname === '.png') {
        var img = document.createElement('img')
        img.src = url
        img.alt = file.name
        util.logAppend(img)
      }

      var a = document.createElement('a')
      a.download = file.name
      a.href = url
      a.textContent = 'Download ' + file.name
      util.logAppend(a)
    })
  })
}

window.onbeforeunload = function (e) {
  e = e || window.event
  if (!window.client || window.client.torrents.length === 0) return

  var names = listify(window.client.torrents.map(function (torrent) {
    return '"' + torrent.name + '"'
  }))

  var theseTorrents = window.client.torrents.length >= 2
    ? 'these torrents'
    : 'this torrent'
  var message = 'If you close this page, you will stop sharing ' + names + '. ' +
    'Consider leaving this page open to seed ' + theseTorrents + '.'

  if (e) e.returnValue = message // IE, Firefox
  return message // Safari, Chrome
}
