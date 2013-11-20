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

// Indevisual stream per access, used for user, site and statuses/filter
exports.stream = function(socket) {
  console.log('A socket with sessionID ' + socket.handshake.sessionID + ' connected!');

  var method = socket.namespace.name.replace(configs.API_PATH + '/', '');

  console.log('method', method);
  socket.on('get', function(data) {
    establishStreaming(socket, method, data, socket.handshake.user.token, socket.handshake.user.tokenSecret);
  });

  socket.on('disconnect', function() {
    console.log('A socket with sessionID ' + socket.handshake.sessionID + ' disconnected!');
  });
};

var statusesSampleStream = null;
exports.streamStatusesSample = function(socket) {
  console.log('A socket with socketId ' + socket.id + ' joined to statuses/sample!');

  if (!statusesSampleStream) {
    console.log('Establish status/sample streaming');
    statusesSampleStream = establishStreaming(
      socket.namespace,
      'statuses/sample',
      null,
      configs.TWITTER_ACCESS_TOKEN,
      configs.TWITTER_ACCESS_TOKEN_SECRET);
  }

  socket.on('disconnect', function() {
    console.log('A socket with socketId ' + socket.id + ' left to statuses/sample!');
  });
};

function establishStreaming(socket, method, params, accessTokenKey, accessTokenSecret) {
  var twit = new Twitter({
    consumer_key: configs.TWITTER_CONSUMER_KEY,
    consumer_secret: configs.TWITTER_CONSUMER_SECRET,
    access_token_key: accessTokenKey,
    access_token_secret: accessTokenSecret
  });

  twit.stream(method, params, function(stream) {
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

  return twit;
}
