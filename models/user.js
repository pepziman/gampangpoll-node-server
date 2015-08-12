// app/models/user.js
// load the things we need
var mongoose = require('mongoose')
, bcrypt   = require('bcrypt-nodejs')
, Schema = mongoose.Schema
, ObjectId = Schema.ObjectId;

// define the schema for our user model
var user = new Schema({
    id_user          : String,
    name             : String,
    local            : {
        name         : String,
        email        : String,
        password     : String,
    },
    facebook         : {
        id           : Number,
        token        : String,
        email        : String,
        name         : String
    },
    twitter          : {
        id           : Number,
        token        : String,
        displayName  : String,
        username     : String
    },
    google           : {
        id           : Number,
        token        : String,
        email        : String,
        name         : String
    }
});


//schema itu object. contoh objek orang
//model itu = constructornya schema

// methods ======================
// generating a hash
user.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
user.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', user);
