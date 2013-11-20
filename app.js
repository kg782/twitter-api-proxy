
/**
 * Module dependencies.
 */

var express = require('express');
var twitter = require('./routes/twitter');
var debug = require('./routes/debug');
var http = require('http');
var path = require('path');
var configs = require('./configs');
var MongoStore = require('connect-mongo')(express);
var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;
var mongoose = require('mongoose');
var io = require('socket.io');
var cookie = require('express/node_modules/cookie');
var connect = require('express/node_modules/connect');

var app = express();
var sessionStore = new MongoStore(configs.MONGO_DB);

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
require('./models/session');

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
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser(configs.SESSION_SECRET));
app.use(express.session({
    secret: configs.COOKIE_SECRET,
    store: sessionStore
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// Twitter login
app.get(configs.API_PATH + '/login', twitter.login);
app.get(configs.API_PATH + '/callback', twitter.authenticate, twitter.callback);
app.get(configs.API_PATH + '/authenticated', twitter.authenticated);
app.get(configs.API_PATH + '/logout', twitter.logout);
app.get(configs.API_PATH + '/error-auth', twitter.errorAuth);

// Twitter API
app.get(configs.API_PATH + '/*', twitter.ensureAuthenticated, twitter.restGet);
app.post(configs.API_PATH + '/*', twitter.ensureAuthenticated, twitter.restPost);

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

// Sockets
var sockets = io.listen(server);

// production only
sockets.configure('production', function() {
  sockets.enable('browser client minification');  // send minified client
  sockets.enable('browser client etag');          // apply etag caching logic based on version number
  sockets.enable('browser client gzip');          // gzip the file
  sockets.set('log level', 1);                    // reduce logging

  // enable all transports (optional if you want flashsocket support, please note that some hosting
  // providers do not allow you to create servers that listen on a port different than 80 or their
  // default port)
  sockets.set('transports', [
    'websocket',
    'flashsocket',
    'htmlfile',
    'xhr-polling',
    'jsonp-polling'
  ]);

  // Set origin to protect from third party sites performing authenticated cross-domain requires
  sockets.set('origin', '*:*');
});

sockets.configure('development', function() {
  sockets.set('log level', 2);
});

sockets.configure(function (){
  sockets.of(configs.API_PATH + '/statuses/filter').authorization(checkAuthorization);
  sockets.of(configs.API_PATH + '/user').authorization(checkAuthorization);
  sockets.of(configs.API_PATH + '/site').authorization(checkAuthorization);
});

function checkAuthorization(handshakeData, callback) {
  // check if there's a cookie header
  if (handshakeData.headers.cookie) {
    // if there is, parse the cookie
    var cookies = cookie.parse(decodeURIComponent(handshakeData.headers.cookie));
    handshakeData.cookie = connect.utils.parseSignedCookies(cookies, configs.COOKIE_SECRET);
    
    // note that you will need to use the same key to grad the
    // session id, as you specified in the Express setup.
    handshakeData.sessionID = handshakeData.cookie['connect.sid'];
    sessionStore.get(handshakeData.sessionID, function(err, session) {
      if (err || !session) {
        return callback('No session existed', false);
      } else {
        handshakeData.session = session;

        if (!session.passport || !session.passport.user) {
          return callback('No passport user', false);
        } else {
          var userId = session.passport.user;
          passport.deserializeUser(userId, function(err, user) {
            if (err || !user) {
              return callback('No user stored', false);
            } else {
              handshakeData.user = user;

              // callback the incoming connection
              callback(null, true);
            }
          });
        }
      }
    });
  } else {
    // if there isn't, turn down the connection with a message
    // and leave the function.
    return callback('No cookie transmitted.', false);
  }
}

sockets.of(configs.API_PATH + '/statuses/filter').on('connection', twitter.stream);
sockets.of(configs.API_PATH + '/user').on('connection', twitter.stream);
sockets.of(configs.API_PATH + '/site').on('connection', twitter.stream);
// statuses/sample doesn't require authentication, use developers access token
sockets.of(configs.API_PATH + '/statuses/sample').on('connection', twitter.streamStatusesSample);
