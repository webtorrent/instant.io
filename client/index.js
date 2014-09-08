var $ = require('jquery')
var Client = require('bittorrent-client')
var concat = require('concat-stream')
var debug = require('debug')('instant')
var dragDrop = require('drag-drop/buffer')

var client = new Client()

dragDrop('body', newTorrent)

function newTorrent (files) {
  client.seed(files, {
    createdBy: 'instant.io',
    announceList: [[ 'ws://tracker.webtorrent.io:9003' ]]
  }, function (torrent) {
    debug('we are a seeder')
    $('.infoHash').text(torrent.infoHash)
    showFileLink(torrent)
  })
}

$('form').on('submit', function (e) {
  e.preventDefault()
  debug('add %s', $('form input').val())
  client.add({
    infoHash: $('form input').val(),
    announce: [ 'ws://tracker.webtorrent.io:9003' ]
  }, function (torrent) {
    debug('we are a downloader')
    showFileLink(torrent)
  })
})

function addDownloadLink (buf, name) {
  var url = URL.createObjectURL(new Blob([ buf ]))
  var a = document.createElement('a')
  a.download = name
  a.href = url
  a.textContent = 'download ' + name
  document.body.appendChild(a)
}

function showFileLink (torrent) {
  var file = torrent.files[0]
  debug('file name %s', file.name)
  file.createReadStream()
    .pipe(concat(function (buf) {
      addDownloadLink(buf, file.name)
    }))
}
