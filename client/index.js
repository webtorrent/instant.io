var concat = require('concat-stream')
var dragDrop = require('drag-drop/buffer')
var upload = require('upload-element')
var path = require('path')
var prettysize = require('prettysize')
var WebTorrent = require('webtorrent')

var client = new WebTorrent()
var hash = window.location.hash.replace('#', '')

upload(document.querySelector('input[name=upload'), { type: 'array' }, onfile);

function onfile (err, results) {
  var files = results.map(function (r) {
    r.file.buffer = new Buffer(new Uint8Array(r.target.result))
    return r.file
  })
  logAppend('Creating .torrent file...<br>')
  client.seed(files, onTorrent)
}

dragDrop('body', function (files) {
  logAppend('Creating .torrent file...<br>')
  client.seed(files, onTorrent)
})

document.querySelector('form').addEventListener('submit', function (e) {
  e.preventDefault()
  download(document.querySelector('form input[name=infoHash]').value)
})

if (/^[a-f0-9]+$/i.test(hash)) {
  download(hash)
}

function download(infoHash) {
  client.add({
    infoHash: infoHash,
    announce: [ 'wss://tracker.webtorrent.io' ]
  }, onTorrent)
}

function onTorrent (torrent) {
  logAppend('Torrent info hash: ' + torrent.infoHash + ' <a href="/#'+torrent.infoHash+'">(link)</a><br>')
  logAppend('Downloading from ' + torrent.swarm.wires.length + ' peers<br>')
  logAppend('progress: starting...')

  torrent.swarm.on('download', function () {
    var progress = (100 * torrent.downloaded / torrent.parsedTorrent.length).toFixed(1)
    logReplace('progress: ' + progress + '% -- download speed: ' + prettysize(torrent.swarm.downloadSpeed()) + '/s<br>')
  })

  torrent.swarm.on('upload', function () {
    logReplace('upload speed:' + prettysize(client.uploadSpeed()) + '/s<br>')
  })

  torrent.files.forEach(function (file) {
    var extname = path.extname(file.name)
    if (extname === '.mp4' || extname === '.webm') {
      var video = document.createElement('video')
      video.controls = true
      videos.appendChild(video)
      file.createReadStream().pipe(video)
    } else {
      file.createReadStream().pipe(concat(function (buf) {
        var a = document.createElement('a')
        a.download = file.name
        a.href = URL.createObjectURL(new Blob([ buf ]))
        a.textContent = 'download ' + file.name
        log.innerHTML += a.outerHTML + '<br>'
      }))
    }
  })
}

var log = document.querySelector('.log')
var videos = document.querySelector('.videos')

// append a P to the log
function logAppend(str){
  var p = document.createElement('p')
  p.innerHTML = str
  log.appendChild(p)
}

// replace the last P in the log
function logReplace(str){
  log.lastChild.innerHTML = str
}
