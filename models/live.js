var polling 	= require('./polling');
var User 		= require('./user');
var mongoose 	= require('mongoose')
, Schema 		= mongoose.Schema
, ObjectId 		= Schema.ObjectId;

var live 		= new Schema ({
	status		: String,
	session_key : String,
	poll_id 	: String,
	jml_peserta : Number
});

module.exports = mongoose.model('live', live);