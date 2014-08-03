var createTorrent = require('create-torrent')
var dragDrop = require('drag-drop')
var parseTorrent = require('parse-torrent')
var Tracker = require('webtorrent-tracker')

dragDrop('body', newTorrent)

function newTorrent (files) {
  window.files = files
  createTorrent(files, function (err, torrent) {
    if (err) alert('error creating torrent: ' + err.message)
    var parsedTorrent = parseTorrent(torrent)
    window.torrent = torrent
    window.parsedTorrent = parsedTorrent

    var url = URL.createObjectURL(new Blob([ torrent ]))
    var a = document.createElement('a')
    a.download = 'file.torrent'
    a.href = url
    a.textContent = 'download .torrent'
    document.body.appendChild(a)

    var peerId = new Buffer('01234567890123456789')
    // new Tracker(peerId, parsedTorrent)
  })
}



// var Peer = require('simple-peer')

// peer = new Peer({
//   initiator: !!data.initiator,
// })

  // peer.on('error', function (err) {
  //   console.error('peer error', err.stack || err.message || err)
  // })

  // peer.on('ready', function () {
  //   clearChat()
  //   addChat('Connected, say hello!', 'status')
  //   enableUI()
  // })

  // peer.on('signal', function (data) {
  //   socket.send({ type: 'signal', data: data })
  // })

  // peer.on('message', function (data) {
  //   addChat(data, 'remote')
  // })

  // // Takes ~3 seconds before this event fires when peerconnection is dead (timeout)
  // peer.on('close', next)

// peer.signal(data)
// peer.send({ type: 'chat', data: text })
