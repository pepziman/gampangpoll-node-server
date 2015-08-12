var mongoose = require('mongoose')
, Schema = mongoose.Schema
, user = require('./user')
, ObjectId = Schema.ObjectId;

var answer = new Schema({
    title   : String,
    votes   : {
        type: Number,
         default : 0
    }
});

var question = new Schema({
    nomer    : Number,
    title    : String,
    jawaban  : [answer]
});

var polling = new Schema({
    id_poll       : String,
    title         : String,
    soal          : [question],
    creator       : String,
    timer         : Number,
    sifat         : Number,
    allowMultiple : Number,
    //start_time    : Date,
    //end_time      : Date,
    status        : Boolean,
    result        : Number, //menentukan jenis chart: bar, column, atau pie
    acara         : String 
});

/*var Room = new Schema({ //untuk fitur invite
  room_id : Number,
  poll_id : [polling._id],
  email : [user.email]
});

var checking = new Schema({
    p_id        : String,
    id_user     : String
});*/

module.exports = mongoose.model('polling', polling);

