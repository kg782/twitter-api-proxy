var configs = require('../configs.js');
var twitter = require('ntwitter');

var twit = new twitter({
  consumer_key: configs.TWITTER_CONSUMER_KEY,
  consumer_secret: configs.TWITTER_CONSUMER_SECRET,
  access_token_key: configs.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: configs.TWITTER_ACCESS_TOKEN_SECRET
});

exports.rest = function(req, res) {
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
