var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
  id: {type: String, required: true, unique: true},
  username: {type: String, required: true, unique: true},
  displayName: {type: String, required: true}
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
      user.update(profile);
    } else {
      user = new User(profile);
      console.log('user', user);
    }
    user.save();
    callback(null, user);
  });
};

// Methods

mongoose.model('User', userSchema);