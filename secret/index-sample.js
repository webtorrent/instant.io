exports.rollbar = {
  accessToken: 'TODO'
}

exports.iceServers = [
  {
    urls: [
      'stun:stun.l.google.com:19302',
      'stun:global.stun.twilio.com:3478'
    ]
  },
  {
    urls: [
      'turn:TODO:443?transport=udp',
      'turn:TODO:443?transport=tcp',
      'turns:TODO:443?transport=tcp'
    ],
    username: 'TODO',
    credential: 'TODO'
  }
]
