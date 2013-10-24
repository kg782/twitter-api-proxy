
/**
 * Module dependencies.
 */

var express = require('express');
var twitter = require('./routes/twitter');
var http = require('http');
var path = require('path');
var configs = require('./configs');
var MongoStore = require('connect-mongo')(express);

var app = express();

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
app.use(app.router);
//app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// API
app.all('/twitter/rest/*', twitter.rest);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
