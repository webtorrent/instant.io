exports.twilio = {
  accountSid: 'TODO',
  authToken: 'TODO'
}

exports.rollbar = {
  accessToken: 'TODO'
}

exports.iceServers = [
  {
    urls: 'stun:stun.l.google.com:19302'
  },
  {
    urls: 'stun:global.stun.twilio.com:3478?transport=udp'
  },
  {
    urls: 'turn:TODO:3478?transport=udp',
    username: 'TODO',
    credential: 'TODO'
  },
  {
    urls: 'turn:TODO:3478?transport=tcp',
    username: 'TODO',
    credential: 'TODO'
  },
  {
    urls: 'turn:TODO:443?transport=tcp',
    username: 'TODO',
    credential: 'TODO'
  }
]
