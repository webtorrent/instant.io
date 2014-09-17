localStorage.debug = '*'

var concat = require('concat-stream')
var dragDrop = require('drag-drop/buffer')
var WebTorrent = require('webtorrent')

var client = new WebTorrent()
var hash = window.location.hash.replace('#', '')

dragDrop('body', function (files) {
  client.seed(files, onTorrent)
})

document.querySelector('form').addEventListener('submit', function (e) {
  e.preventDefault()
  download(document.querySelector('form input').value)
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
  var log = document.querySelector('.log')
  log.innerHTML += 'Torrent info hash: ' + torrent.infoHash + ' <a href="/#'+torrent.infoHash+'">(link)</a><br>'
  log.innerHTML += 'Downloading from ' + torrent.swarm.wires.length + ' peers<br>'

  torrent.swarm.on('download', function () {
    var progress = (100 * torrent.downloaded / torrent.parsedTorrent.length).toFixed(1)
    log.innerHTML += 'progress: ' + progress + '%' + '<br>'
  })

  torrent.files.forEach(function (file) {
    file.createReadStream().pipe(concat(function (buf) {
      var a = document.createElement('a')
      a.download = file.name
      a.href = URL.createObjectURL(new Blob([ buf ]))
      a.textContent = 'download ' + file.name
      log.innerHTML += a.outerHTML + '<br>'
    }))
  })
}
