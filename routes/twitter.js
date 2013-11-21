var configs = require('../configs.js');
var Twitter = require('ntwitter');
var passport = require('passport');

/*
 * Login
 */
exports.login = passport.authenticate('twitter');
exports.authenticate = passport.authenticate('twitter', {failureRedirect: '/'});
exports.callback = function(req, res) {
    res.redirect('/');
};
exports.logout = function(req, res){
  req.logout();
  res.redirect('/');
};
exports.authenticated = function(req, res) {
  var user = req.user ? req.user._json : null;
  res.send({authenticated:req.isAuthenticated(), user: user});
};
exports.ensureAuthenticated = function (req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/twitter/error-auth');
};
exports.errorAuth = function(req, res) {
  res.send({
    authenticated: false,
    error: "No authenticated"
  });
};

/*
 * REST
 */
exports.restGet = function(req, res) {

  var twit = new Twitter({
    consumer_key: configs.TWITTER_CONSUMER_KEY,
    consumer_secret: configs.TWITTER_CONSUMER_SECRET,
    access_token_key: req.user.token,
    access_token_secret: req.user.tokenSecret
  });

  var url = req.path.replace(configs.API_PATH, '');
  console.log('Get request, url:', url, ', params:', req.query);
  twit.get(url, req.query, function(err, data) {
    if (err) {
      res.status(err.statusCode).send(err);
      return;
    }
    res.send(data || {});
  });
};

exports.restPost = function(req, res) {

  var twit = new Twitter({
    consumer_key: configs.TWITTER_CONSUMER_KEY,
    consumer_secret: configs.TWITTER_CONSUMER_SECRET,
    access_token_key: req.user.token,
    access_token_secret: req.user.tokenSecret
  });

  var url = req.path.replace(configs.API_PATH, '');
  console.log('Post request, url:', url, ', content:', req.body);
  twit.post(url, req.body, null, function(err, data) {
    if (err) {
      res.status(err.statusCode).send(err);
      return;
    }
    res.send(data || {});
  });
};

/*
 * Stream
 */
exports.streamStatusesFilter = function(socket) {
  var stream = null;
  socket.on('query', function(data) {
    if (stream) {
      stream.destroy();
    }
    stream = establishStream(socket, 'statuses/filter', data, socket.handshake.user.token, socket.handshake.user.tokenSecret);
    observeStream(socket, stream);
  });
};

// Share only one sample stream conection among clients.
exports.streamStatusesSample = function(socket) {
  var stream = establishSharedStream(socket, 'statuses/sample', null);
  observeSharedStream(socket, stream);
};

// This API is not tested as it requires special permission to access
// Share only one sample stream conection among clients.
exports.streamStatusesFireHose = function(socket) {
  establishSharedStream(socket, 'statuses/firehose', null);
  observeSharedStream(socket, stream);
};

exports.streamUser = function(socket) {
  var stream = establishStream(socket, 'user', null, socket.handshake.user.token, socket.handshake.user.tokenSecret);
  observeStream(socket, stream);
};

// Not tested as this endpoint requires special permission
exports.streamSite = function(socket) {
  var stream = null;
  socket.on('query', function(data) {
    if (stream) {
      stream.destroy();
    }
    stream = establishSharedStream(socket, 'site', data);
    observeSharedStream(socket, stream);
  });
};

function establishStream(socket, method, params, token, tokenSecret) {
  var twit = new Twitter({
    consumer_key: configs.TWITTER_CONSUMER_KEY,
    consumer_secret: configs.TWITTER_CONSUMER_SECRET,
    access_token_key: token,
    access_token_secret: tokenSecret
  });

  var s = null;

  twit.stream(method, params, function(stream) {
    s = stream;
    stream.on('error', function() {
      console.log('stream error:', arguments);
      socket.emit('error', arguments);
    });
    stream.on('data', function(data) {
      // console.log('stream data', data);
      socket.emit('data', data);
    });
    stream.on('destroy', function(destroy) {
      console.log('stream destroy:', destroy);
      stream.destroyed = true;
      socket.emit('destroy', destroy);
    });
    stream.on('limit', function(limit) {
      console.log('stream limit:', limit);
      socket.emit('limit', limit);
    });
    stream.on('delete', function(d) {
      // console.log('stream delete:', delete);
      socket.emit('delete', d);
    });
    stream.on('scrub_geo', function(scrub_geo) {
      console.log('stream scrub_geo:', scrub_geo);
      socket.emit('scrub_geo', scrub_geo);
    });
    stream.on('end', function(response) {
      // console.log('stream end:', response);
      socket.emit('end', 'end');
    });
  });

  return s;
}

var sharedStreams = {};
function establishSharedStream(socket, method, params) {
  if (!sharedStreams[method] || sharedStreams[method].destroyed) {
    sharedStreams[method] = establishStream(socket.namespace, method, params, configs.TWITTER_ACCESS_TOKEN, configs.TWITTER_ACCESS_TOKEN_SECRET);
  }
  return sharedStreams[method];
}

function observeStream(socket, stream) {
  socket.on('disconnect', function() {
    console.log('destroy a stream as user disconnected.');
    stream.destroy();
  });
}

function observeSharedStream(socket, stream) {
  socket.on('disconnect', function() {
    if (socket.namespace.clients().length <= 1) {
      console.log('destroy a stream as there is no client listening.');
      stream.destroy();
    }
  });
}
