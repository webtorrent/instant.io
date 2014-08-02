var hat = require('hat')
var http = require('http')
var static = require('node-static')
var ws = require('ws')

var PORT = process.argv[2] || 9100

var httpServer = http.createServer()
var staticServer = new static.Server('./public')
var wsServer = new ws.Server({ server: httpServer })

var peers = {}
var waitingId = null
var count = 0

httpServer.on('request', function (req, res) {
  req.addListener('end', function () {
    staticServer.serve(req, res)
  }).resume()
})

// wsServer.on('connection', onconnection)

// function onconnection (peer) {
//   var send = peer.send
//   peer.send = function () {
//     try {
//       send.apply(peer, arguments)
//     } catch (err) {}
//   }

//   peer.id = hat()
//   peers[peer.id] = peer
//   peer.on('close', onclose.bind(peer))
//   peer.on('error', onclose.bind(peer))
//   peer.on('message', onmessage.bind(peer))
//   count += 1
//   broadcast(JSON.stringify({ type: 'count', data: count }))
// }

// function onclose () {
//   peers[this.id] = null
//   if (this.id === waitingId) {
//     waitingId = null
//   }
//   if (this.peerId) {
//     var peer = peers[this.peerId]
//     peer.peerId = null
//     peer.send(JSON.stringify({ type: 'end' }), onsend)
//   }
//   count -= 1
//   broadcast(JSON.stringify({ type: 'count', data: count }))
// }

// function onmessage (data) {
//   console.log('[' + this.id + ' receive] ' + data + '\n')
//   try {
//     var message = JSON.parse(data)
//   } catch (e) {
//     console.error('Discarding non-JSON message')
//     return
//   }

//   if (message.type === 'peer') {
//     if (waitingId && waitingId !== this.id) {
//       var peer = peers[waitingId]

//       this.peerId = peer.id
//       peer.peerId = this.id

//       this.send(JSON.stringify({
//         type: 'peer',
//         data: {
//           initiator: true
//         }
//       }), onsend)

//       peer.send(JSON.stringify({
//         type: 'peer'
//       }), onsend)

//       waitingId = null
//     } else {
//       waitingId = this.id
//     }

//   } else if (message.type === 'signal') {
//     if (!this.peerId) return console.error('unexpected `signal` message')
//     var peer = peers[this.peerId]
//     peer.send(JSON.stringify({ type: 'signal', data: message.data }))

//   } else if (message.type === 'end') {
//     if (!this.peerId) return console.error('unexpected `end` message')
//     var peer = peers[this.peerId]
//     peer.peerId = null
//     this.peerId = null
//     peer.send(JSON.stringify({ type: 'end' }), onsend)

//   } else {
//     console.error('unknown message `type` ' + message.type)
//   }
// }

// function onsend (err) {
//   if (err) console.error(err.stack || err.message || err)
// }

// function broadcast (message) {
//   for (var id in peers) {
//     var peer = peers[id]
//     if (peer) {
//       peer.send(message)
//     }
//   }
// }

httpServer.listen(PORT, function () {
  console.log('Listening on port ' + PORT)
})
