# Instant.io [![travis][travis-image]][travis-url]

[travis-image]: https://img.shields.io/travis/feross/instant.io.svg
[travis-url]: https://travis-ci.org/feross/instant.io

### Streaming file transfer over WebTorrent

Download/upload files using the [WebTorrent](http://webtorrent.io) protocol (BitTorrent
over WebRTC). This is a beta.

Powered by [WebTorrent](http://webtorrent.io), the first torrent client that works in the
browser without plugins. WebTorrent is powered by JavaScript and WebRTC. Supports Chrome,
Firefox, Opera (desktop and Android). Run <code>localStorage.debug = '*'</code> in the
console and refresh to get detailed log output.

## Install

If you just want to do file transfer on your site, or fetch/seed files over WebTorrent, then there's no need to run a copy of instant.io on your own server. Just use the WebTorrent script directly. You can learn more at https://webtorrent.io.

The client-side code that instant.io uses is [here](https://github.com/feross/instant.io/blob/master/client/index.js).

### Run a copy of this site on your own server

To get a clone of https://instant.io running on your own server, follow these instructions.

Get the code:

```
git clone https://github.com/feross/instant.io
cd instant.io
npm install
```

Modify the configuration options in [`config.js`](https://github.com/feross/instant.io/blob/master/config.js) to set the IP/port you want the server to listen on.

Copy [`secret/index-sample.js`](https://github.com/feross/instant.io/blob/master/secret/index-sample.js) to `secret/index.js` and set the Twilio API key if you want a [NAT traversal service](https://www.twilio.com/stun-turn) (to help peers connect when behind a firewall).

That should be it!

### Mirrors

- http://instant.rom1504.fr/
- https://instant-io.herokuapp.com/

## License

MIT. Copyright (c) [Feross Aboukhadijeh](http://feross.org).

