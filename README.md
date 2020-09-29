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

If you just want to do file transfer on your site, or fetch/seed files over WebTorrent, then there's no need to run a copy of instant.io on your own server. Just use the WebTorrent script directly. You can learn more at https://webtorrent.io.

The client-side code that instant.io uses is [here](https://github.com/webtorrent/instant.io/blob/master/client/index.js).

### Run a copy of this site on your own server

To get a clone of https://instant.io running on your own server, follow these instructions.

Get the code:

```
git clone https://github.com/webtorrent/instant.io
cd instant.io
npm install
```

Modify the configuration options in [`config.js`](https://github.com/webtorrent/instant.io/blob/master/config.js) to set the IP/port you want the server to listen on.

Copy [`secret/index-sample.js`](https://github.com/webtorrent/instant.io/blob/master/secret/index-sample.js) to `secret/index.js` and update the options in there to a valid TURN server if you want a NAT traversal service (to help peers connect when behind a firewall).

To start the server, run `npm start`. That should be it!

## Tips

1. Create a shareable link by adding a torrent infohash or magnet link to the end
of the URL. For example: `https://instant.io#INFO_HASH` or `https://instant.io/#MAGNET_LINK`.

2. You can add multiple torrents in the same browser window.

## License

MIT. Copyright (c) [WebTorrent, LLC](https://webtorrent.io).

