Twitter API proxy for pure front-end framework such as `Angular.js`. The concept is to separate front-end client completely from back-end API. It supports Twitter `REST API` and `Streaming API`. Streaming data is streamed via `WebSocket` on `Socket.IO` in real time.

# Twitter API Proxy

## Requirements

* Node.js
* MongoDB

## Install

1. Install `npm` dependencies.

  ```
  npm install
  ```

2. Rename configs.js.sample to configs.js and update for your environment.

## Twitter authentication

For secure reason, this proxy hides `consumer key` and `access token` from front-end clients. Those keys won't be exposed.

Clients `access token`s are kept in persistent storage (`MongoDB`) and retrieved by session without authorizing each time. Clients are able to access API with their `access token` after shutting down browsers.

It requires developers `access token` to establish shared streaming connection. As `stutases/sample` has same results for every clients, the proxy establish one shared streaming connection to Twitter with developers `access token`, then it broadcasts to every front-end clients without authentication.

## How to authenticate

Access `/twitter/login`, it redirects twitter Auth screen. `/twitter/logout` is to log out. To check authentication status, access `/twitter/authenticated`

## REST API

All endpoints of Twitter REST API v1.1 require authentication. Before access those API, clients need to authenticate.

URL: /twitter/ + `twitter resource` (eg. `/twitter/account/verify_credentials.json` to `account/verify_credentials.json`)
HTTP Method: HTTP Method to the proxy is used to access twitter API. If you access with GET method, twitter GET method is called.
Parameters: Parameters are passed to call twitter API

## Streaming API

`statuses/filter`, `user` and `site` endpoints requires authentication before access. `statuses/sample` doesn't require authentication and only one streaming connection from the proxy to the twitter Streaming API is shared among clients.

`namespace` of `Socket.IO` is used to determine endpoints. Then `emit('get', params)` to start receiving streaming data.

  ```html
  <script src="scripts/socket.io.min.js" type="text/javascript" charset="utf-8"></script>
  <script>
    var sio = io.connect();
    connect(sio, '/twitter/statuses/filter', {track:'Sydney'});

    function connect(sio, namespace, params) {
      var socket = sio.socket.of(namespace);
      socket
        .on('error', function(reason) {
          console.error('unable to connet to', namespace);
        })
        .on('connect', function() {
          console.log('successfully established a connection to', namespace);
          socket.emit('get', params);
          socket.on('data', function(data) {
            console.log('data', data);
          })
          socket.on('disconnect', function() {
            console.log('Socket was disconnected');
          })
        });
    }
  </script>

  ```

## License

MIT