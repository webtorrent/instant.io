var $ = require('jquery')
var concat = require('concat-stream')
var dragDrop = require('drag-drop/buffer')
var WebTorrent = require('bittorrent-client')

var client = new WebTorrent()

dragDrop('body', function (files) {
  client.seed(files, onTorrent)
})

$('form').on('submit', function (e) {
  e.preventDefault()
  client.add({
    infoHash: $('form input').val(),
    announce: [ 'wss://tracker.webtorrent.io' ]
  }, onTorrent)
})

function onTorrent (torrent) {
  var log = document.querySelector('.log')
  log.innerHTML += 'Torrent info hash: ' + torrent.infoHash + '<br>'
  log.innerHTML += 'Downloading from ' + torrent.swarm.wires.length + ' peers<br>'

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
