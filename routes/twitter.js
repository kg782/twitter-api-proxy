var configs = require('../configs.js');
var Twitter = require('ntwitter');

exports.rest = function(req, res) {

  console.log(req.session);

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

exports.errorAuth = function(req, res) {
  res.send({
    error: "No authenticated"
  });
};