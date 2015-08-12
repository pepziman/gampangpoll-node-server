var mongoose = require('mongoose')
, bcrypt   = require('bcrypt-nodejs')
, Schema = mongoose.Schema
, ObjectId = Schema.ObjectId;

var admin = new Schema({
    email: String,
    password: String
});

admin.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
admin.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

module.exports = mongoose.model('Admin', admin);