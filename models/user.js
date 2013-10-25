var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
  id: {type: String, required: true, unique: true},
  username: {type: String, required: true, unique: true},
  displayName: {type: String, required: true},
  photos: [],
  provider: String,
  token: String,
  tokenSecret: String
});

// Static methods
userSchema.statics.findById = function(id, callback) {
  var User = mongoose.model('User');
  User.findOne({id:id}, function(err, user) {
    if (err) callback(err);
    callback(null, user);
  });
};
userSchema.statics.findOrCreate = function(profile, callback) {
  var User = mongoose.model('User');
  User.findById(profile.id, function(err, user) {
    if (err) callback(err);
    if (user) {
      user.update(profile, function(err, numberAffected, rawResponse) {
        if (err) callback(err);
        user.save();
        callback(null, user);
      });
    } else {
      user = new User(profile);
      user.save();
      callback(null, user);
    }
  });
};

// Methods

mongoose.model('User', userSchema);