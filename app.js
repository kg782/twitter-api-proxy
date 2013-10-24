
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

var app = express();

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Twitter profile is serialized
//   and deserialized.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// Passport settings
passport.use(new TwitterStrategy({
    consumerKey: configs.TWITTER_CONSUMER_KEY,
    consumerSecret: configs.TWITTER_CONSUMER_SECRET,
    callbackURL: "http://127.0.0.1:9000/twitter/callback"
  },
  function(token, tokenSecret, profile, done) {
    profile.token = token;
    profile.tokenSecret = tokenSecret;
    process.nextTick(function () {
      return done(null, profile);
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
//app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Twitter login
app.get('/twitter/login', passport.authenticate('twitter'));
app.get('/twitter/callback',
  passport.authenticate('twitter', {failureRedirect: '/'}),
  function(req, res) {
    res.redirect('/');
  }
);
app.get('/twitter/logout', function(req, res){
  req.logout();
  res.redirect('/');
});
app.get('/twitter/error-auth', twitter.errorAuth);

// Twitter API
app.all('/twitter/rest/*', ensureAuthenticated, twitter.rest);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/twitter/error-auth');
}