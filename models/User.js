const mongoose = require("mongoose");
const { Schema } = mongoose;
const bcrypt = require("bcryptjs");

const userSchema = new Schema(
	{
		username: { type: String, unique: true },
		password: String,
		name: {
			first: String,
			last: String
		},
		frontendName: String,
		twitter: String,
		image: String,
		email: String,
		isAdmin: Boolean
	},
	{
		toJSON: {
			virtuals: true
		},
		toObject: {
			virtuals: true
		}
	}
);

userSchema.virtual("name.full").get(function() {
	return this.name.first + " " + this.name.last;
});

//password hashing
userSchema.methods.generateHash = password => {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

//Check Password
userSchema.methods.validatePassword = function(password) {
	return bcrypt.compareSync(password, this.password);
};

//For List
userSchema.query.forList = function() {
	return this.select("username name frontendName");
};

mongoose.model("users", userSchema);
