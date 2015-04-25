var dragDrop = require('drag-drop/buffer')
var magnet = require('magnet-uri')
var parseTorrent = require('parse-torrent')
var path = require('path')
var prettysize = require('prettysize')
var querystring = require('querystring')
var thunky = require('thunky')
var toBuffer = require('typedarray-to-buffer')
var upload = require('upload-element')
var videostream = require('videostream')
var WebTorrent = require('webtorrent')
var xhr = require('xhr')

var TRACKER_URL = 'wss://tracker.webtorrent.io'

var hash = window.location.hash.replace('#', '')

var getClient = thunky(function (cb) {
  xhr('/rtcConfig', function (err, res) {
    if (err) return cb(err)
    var rtcConfig
    try {
      rtcConfig = JSON.parse(res.body)
    } catch (err) {
      return cb(new Error('Expected JSON response from /rtcConfig: ' + res.body))
    }
    var client = new WebTorrent({ rtcConfig: rtcConfig })
    client.on('warning', warning)
    client.on('error', warning)
    cb(null, client)
  })
})

getClient(function (err, client) {
  if (err) return error(err)
  window.client = client
})

upload(document.querySelector('input[name=upload]'), function (err, results) {
  if (err) return error(err)
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

if (/^[a-f0-9]+$/i.test(hash)) {
  downloadInfoHash(hash)
}

function downloadInfoHash (infoHash) {
  getClient(function (err, client) {
    if (err) return error(err)
    var magnetUri = magnet.encode({
      infoHash: infoHash,
      announce: [ TRACKER_URL ]
    })
    logAppend('using magnet uri: ' + magnetUri)
    client.add(magnetUri, onTorrent)
  })
}

function downloadTorrent (file) {
  getClient(function (err, client) {
    if (err) return error(err)
    logAppend('downloading from .torrent file: ' + file.name)
    var parsedTorrent = parseTorrent(file)
    parsedTorrent.announce = [ TRACKER_URL ]
    parsedTorrent.announceList = [ [ TRACKER_URL ] ]
    client.add(parsedTorrent, onTorrent)
  })
}

function seed (files) {
  if (files.length === 0) return

  // Store files for 24 hours (if user requests it)
  files.forEach(function (file) {
    xhr({
      url: '/upload?' + querystring.stringify({ name: file.name }),
      method: 'POST',
      headers: {
        'Content-Type': file.type
      },
      body: file
    }, function (err) {
      if (err) return error(err)
      // TODO: add message that file was stored
    })
  })

  // Seed from WebTorrent
  getClient(function (err, client) {
    if (err) return error(err)
    client.seed(files, { announceList: [ [ TRACKER_URL ] ] }, onTorrent)
  })
}

function onTorrent (torrent) {
  logAppend('Torrent info hash: ' + torrent.infoHash + ' <a href="/#' + torrent.infoHash + '">(link)</a>')
  logAppend('Downloading from ' + torrent.swarm.wires.length + ' peers')
  logAppend('progress: starting...')

  torrent.swarm.on('download', function () {
    var progress = (100 * torrent.downloaded / torrent.parsedTorrent.length).toFixed(1)
    logReplace('progress: ' + progress + '% -- download speed: ' + prettysize(torrent.swarm.downloadSpeed()) + '/s')
  })

  torrent.swarm.on('upload', function () {
    logReplace('upload speed:' + prettysize(torrent.swarm.uploadSpeed()) + '/s')
  })

  torrent.files.forEach(function (file) {
    var extname = path.extname(file.name)
    if ((extname === '.mp4' || extname === '.webm') && window.MediaSource) {
      var video = document.createElement('video')
      video.controls = true
      video.autoplay = true
      logAppend(video)
      if (extname === '.mp4') {
        videostream(file, video)
      } else {
        file.createReadStream().pipe(video)
      }
    } else if (extname === '.mp3' && window.MediaSource) {
      var audio = document.createElement('audio')
      audio.controls = true
      audio.autoplay = true
      logAppend(audio)
      file.createReadStream().pipe(audio)
    }

    file.getBlobURL(function (err, url) {
      if (err) return error(err)

      if (extname === '.jpg' || extname === '.png') {
        var img = document.createElement('img')
        img.src = url
        img.alt = file.name
        logAppend(img)
      }

      var a = document.createElement('a')
      a.download = file.name
      a.href = url
      a.textContent = 'Download ' + file.name
      logAppend(a)
    })
  })
}

var log = document.querySelector('.log')
function logAppend (item) {
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
function logReplace (str) {
  log.lastChild.innerHTML = str
}

function warning (err) {
  console.error(err.stack || err.message || err)
}

function error (err) {
  console.error(err.stack || err.message || err)
  window.alert(err.message || err) //eslint-disable-line
}
