var createTorrent = require('create-torrent')
var debug = require('debug')('instant.io')
var dragDrop = require('drag-drop')
var hat = require('hat')
var parseTorrent = require('parse-torrent')
var Swarm = require('webtorrent-swarm')

// Force-add webtorrent tracker
createTorrent.announceList.push(['ws://tracker.webtorrent.io:9002'])

dragDrop('body', newTorrent)

function newTorrent (files) {
  window.files = files
  createTorrent(files, {
    createdBy: 'instant.io'
  }, function (err, torrent) {
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

    var peerId = window.peerId = new Buffer(hat(160), 'hex')
    debug('peer id %s', peerId.toString('hex'))

    var swarm = new Swarm(parsedTorrent, peerId)
    swarm.on('wire', function (wire) {
      debug('got wire')
      window.wire = wire
    })
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
