const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema({
	username: String,
	name: {
		first: String,
		last: String
	},
	password: String,
	email: String
});

mongoose.model("users", userSchema);
