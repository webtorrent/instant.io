var BlockStream = require('block-stream')
var Client = require('bittorrent-client')
var createTorrent = require('create-torrent')
var concat = require('concat-stream')
var debug = require('debug')('instant')
var dragDrop = require('drag-drop/buffer')
var stream = require('stream')
var parseTorrent = require('parse-torrent')

// Add webtorrent tracker to all created torrents
createTorrent.announceList.push([ 'ws://tracker.webtorrent.io:9002' ])

dragDrop('body', newTorrent)

function newTorrent (files) {
  window.files = files
  createTorrent(files, {
    createdBy: 'instant.io'
  }, function (err, torrentBuf) {
    if (err) alert('error creating torrent: ' + err.message)
    var parsedTorrent = parseTorrent(torrentBuf)
    window.torrentBuf = torrentBuf
    window.parsedTorrent = parsedTorrent

    addDownloadLink(torrentBuf, 'file.torrent')

    var client = new Client()
    client.add(torrentBuf, function (torrent) {

      var downloader = window.location.search.match(/download/)
      debug('we are a %s', downloader ? 'downloader' : 'seeder')
      if (!downloader) {
        debug('write to storage')
        writeToStorage(torrent.storage, files[0].buffer, parsedTorrent.pieceLength, function (err) {
          debug('wrote to storage')
        })
      }

      var file = torrent.files[0]
      debug('file name %s', file.name)
      file.createReadStream()
        .pipe(concat(function (buf) {
          addDownloadLink(buf, file.name)
        }))
    })

  })
}

function addDownloadLink (buf, name) {
  var url = URL.createObjectURL(new Blob([ buf ]))
  var a = document.createElement('a')
  a.download = name
  a.href = url
  a.textContent = 'download ' + name
  document.body.appendChild(a)
}

var BLOCK_LENGTH = 16 * 1024
function writeToStorage (storage, buf, pieceLength, cb) {
  var pieceIndex = 0
  var bufStream = new stream.Readable()
  bufStream._read = function () {}
  bufStream
    .pipe(new BlockStream(pieceLength, { nopad: true }))
    .on('data', function (piece) {
      var index = pieceIndex
      pieceIndex += 1

      var blockIndex = 0
      var s = new BlockStream(BLOCK_LENGTH, { nopad: true })
      s.on('data', function (block) {
        var offset = blockIndex * BLOCK_LENGTH
        blockIndex += 1

        storage.writeBlock(index, offset, block)
      })
      s.write(piece)
      s.end()
    })
    .on('end', function () {
      cb(null)
    })
    .on('error', function (err) {
      cb(err)
    })

  bufStream.push(buf)
  bufStream.push(null)
}
