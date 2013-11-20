var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
  session: {},
  expires: {type:Date}
});

// Methods

mongoose.model('Session', userSchema);