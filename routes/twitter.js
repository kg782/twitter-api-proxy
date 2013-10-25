var configs = require('../configs.js');
var Twitter = require('ntwitter');
var passport = require('passport');

// Login
exports.login = passport.authenticate('twitter');
exports.authenticate = passport.authenticate('twitter', {failureRedirect: '/'});
exports.callback = function(req, res) {
    res.redirect('/');
};
exports.logout = function(req, res){
  req.logout();
  res.send({
    authenticated: false
  });
};
exports.authenticated = function(req, res) {
  res.send({authenticated:req.isAuthenticated()});
};
// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
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

exports.rest = function(req, res) {

  var twit = new Twitter({
    consumer_key: configs.TWITTER_CONSUMER_KEY,
    consumer_secret: configs.TWITTER_CONSUMER_SECRET,
    access_token_key: req.session.passport.user.token,
    access_token_secret: req.session.passport.user.tokenSecret
  });

  var paths = req.path.split('/');
  if (paths.length >= 4 && twit[paths[3]]) {
    twit[paths[3]](function (err, data) {
      res.send(data);
    });
  } else {
    res.send({
      error: 'Error: mothod not found'
    });
  }
};

