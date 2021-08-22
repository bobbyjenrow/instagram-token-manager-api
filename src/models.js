const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AccountSchema = new Schema({
	user_id: String,
	created_at: Date,
	expires_in: Number,
	long_term_token: String
},{ collection : 'accounts' });


module.exports = mongoose.model('Account', AccountSchema);