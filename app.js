
/**
 * Module dependencies.
 */

var express = require('express');
var twitter = require('./routes/twitter');
var http = require('http');
var path = require('path');
var configs = require('./configs');
var MongoStore = require('connect-mongo')(express);
var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;
var mongoose = require('mongoose');

var app = express();

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  if (id) {
    var User = mongoose.model('User');
    User.findById(id, function(err, user) {
      done(err, user);
    });
  }
});

// mongoose setup
mongoose.connect(configs.MONGO_DB_URL);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {console.log('mongoose connected');});
require('./models/user');

// Passport settings
passport.use(new TwitterStrategy({
    consumerKey: configs.TWITTER_CONSUMER_KEY,
    consumerSecret: configs.TWITTER_CONSUMER_SECRET,
    callbackURL: configs.SITE_URL + '/twitter/callback'
  },
  function(token, tokenSecret, profile, done) {
    profile.token = token;
    profile.tokenSecret = tokenSecret;
    var User = mongoose.model('User');
    User.findOrCreate(profile, function(err, user) {
      return done(null, user);
    });
  }
));

// all environments
app.set('port', process.env.PORT || 3000);
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser(configs.SESSION_SECRET));
app.use(express.session({
    secret: configs.COOKIE_SECRET,
    store: new MongoStore(configs.MONGO_DB)
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Twitter login
app.get(configs.API_PATH + '/login', twitter.login);
app.get(configs.API_PATH + '/callback', twitter.authenticate, twitter.callback);
app.get(configs.API_PATH + '/authenticated', twitter.authenticated);
app.get(configs.API_PATH + '/logout', twitter.logout);
app.get(configs.API_PATH + '/error-auth', twitter.errorAuth);

// Twitter API
app.get(configs.API_PATH + '/rest/*', twitter.ensureAuthenticated, twitter.restGet);
app.post(configs.API_PATH + '/rest/*', twitter.ensureAuthenticated, twitter.restPost);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

