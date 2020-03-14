<h1 align="center">

  <a href="https://webtorrent.io"><img src="https://instant.io/logo.svg" alt="Instant.io" width="400"></a>
  <br>
</h1>

<h4 align="center">Streaming file transfer over WebTorrent (torrents on the web)</h4>

<p align="center">
  <a href="https://travis-ci.org/webtorrent/instant.io"><img src="https://img.shields.io/travis/webtorrent/instant.io/master.svg" alt="travis"></a>
  <a href="https://standardjs.com"><img src="https://img.shields.io/badge/code_style-standard-brightgreen.svg" alt="javascript style guide"></a>
</p>

Download/upload files using the [WebTorrent](http://webtorrent.io) protocol (BitTorrent
over WebRTC). This is a beta.

Powered by [WebTorrent](http://webtorrent.io), the first torrent client that works in the
browser without plugins. WebTorrent is powered by JavaScript and WebRTC. Supports Chrome,
Firefox, Opera (desktop and Android). Run <code>localStorage.debug = '*'</code> in the
console and refresh to get detailed log output.

## Install

instant.io is a completely static site, and is a demonstration of how little code is required to use WebTorrent.

Almost all the client-side code that instant.io uses is [here](./client/index.js).

### Build

To build a copy of the https://instant.io front-end, follow these instructions.

```
git clone https://github.com/webtorrent/instant.io
cd instant.io
npm install
```

### Serve

All instant.io requires to run is a static file server, and some [NAT Traversal](https://www.html5rocks.com/en/tutorials/webrtc/infrastructure/#after-signaling-using-ice-to-cope-with-nats-and-firewalls) services.

There are example nginx and Caddy configs in this repo, but any static file server can be used to serve instant.io

1. Build the client (as explained above)
2. Serve the `static` directory using a static file server
3. Redirect `/__rtConfig__` to a JSON file with a single `iceServers` key conforming to the [WebRTC Spec](https://w3c.github.io/webrtc-pc/#dom-rtcconfiguration)

That's it!

## Mirrors

- https://torrent.partidopirata.org/
- https://instant-io.glitch.me/

## Tips

1. Create a shareable link by adding a torrent infohash or magnet link to the end
of the URL. For example: `https://instant.io/#INFO_HASH` or `https://instant.io/#MAGNET_LINK`.

2. You can add multiple torrents in the same browser window.

## License

MIT. Copyright (c) [WebTorrent, LLC](https://webtorrent.io).

