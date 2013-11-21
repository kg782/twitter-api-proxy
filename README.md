# Twitter API Proxy

`Twitter REST API v1.1` requires OAuth for every endpoints so you no longer be able to call it from front-end directly. Additionaly, `Twitter Streaming API` needs to be converted in browser compatible protocol such as `WebSocket` to get data in real-time. This proxy server solves those problems.

`Twitter API Proxy` is designed for pure front-end framework such as `Angular.js`. The concept is to separate front-end client completely from back-end. It supports Twitter `REST API` and `Streaming API`. Streaming data is streamed via `WebSocket` on `Socket.IO` in real time.

## Requirements

* [Node.js](http://nodejs.org/)
* [MongoDB](http://www.mongodb.org/)

## Install

1. Install `npm` dependencies in project directory.

  ```
  npm install
  ```

2. Rename configs.js.sample to configs.js and update for your environment.

## Twitter authentication

For secure reason, this proxy hides `consumer key` and `access token` from front-end clients. Those keys won't be exposed.

Clients `access token`s are kept in persistent storage (`MongoDB`) then retrieved by session without authorizing each time.

As `stutases/sample` has same results for every clients, the proxy establishes only one shared streaming connection to Twitter with developers `access token`, then it broadcasts to every front-end clients without authentication. So it requires developers `access token` to establish shared streaming connection.

## How to authenticate

Access `/twitter/login`, it redirects twitter Auth page. `/twitter/logout` is to log out. To check authentication status, access `/twitter/authenticated`

## REST API

All endpoints of Twitter REST API v1.1 require authentication. Before access those API, clients need to authenticate.

URL: /twitter/ + `twitter resource` (eg. `/twitter/account/verify_credentials.json` to `account/verify_credentials.json`)
HTTP Method: HTTP Method to the proxy is used to access twitter API. If you access with GET method, twitter GET method is called.
Parameters: Parameters are passed to call twitter API

## Streaming API

`Twitter Streaming API` allows only one connection from server to Twitter at a time. So the proxy shares the connection and broadcasts to every stream connections of namespace `/twitter`.

  To connect and listen the events,

  ```
  var socket = io.connect('/twitter');
  socket
    .on('error', function(reason) {
      console.error('unable to connet to the namespace');
    })
    .on('connect', function() {
      console.log('successfully established a connection to the namespace');
    })
    .on('disconnect', function() {
      console.log('Socket was disconnected');
    })
    .on('data', function(data) {
      console.log('data', data);
    });
  ```

  To query the streaming API,

  ```
  socket.emit('get', {
    method: 'statuses/filter',
    params: {
      track: 'Sydney'
    }
  });
  ```

## License

MIT
