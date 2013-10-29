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
  res.send({
    authenticated: false
  });
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

  var url = req.path.replace(configs.API_PATH + '/rest', '');
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

  var url = req.path.replace(configs.API_PATH + '/rest', '');
  console.log('Post request, url:', url, ', content:', req.body);
  twit.post(url, req.body, null, function(err, data) {
    if (err) {
      res.status(err.statusCode).send(err);
      return;
    }
    res.send(data || {});
  });
};


