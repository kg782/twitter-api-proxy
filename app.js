
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

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Twitter profile is serialized
//   and deserialized.
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
    callbackURL: configs.SITE_DOMAIN + '/twitter/callback'
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

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Twitter login
app.get('/twitter/login', twitter.login);
app.get('/twitter/callback', twitter.authenticate, twitter.callback);
app.get('/twitter/authenticated', twitter.authenticated);
app.get('/twitter/logout', twitter.logout);
app.get('/twitter/error-auth', twitter.errorAuth);

// Twitter API
app.get('/twitter/rest/*', twitter.ensureAuthenticated, twitter.restGet);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

