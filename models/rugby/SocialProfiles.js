const mongoose = require("mongoose");
const { Schema } = mongoose;

const socialProfileSchema = new Schema({
	name: { type: String, required: true, unique: true },
	twitter: {
		consumer_key: { type: String, required: true },
		consumer_secret: { type: String, required: true },
		access_token: { type: String, required: true },
		access_token_secret: { type: String, required: true }
	},
	iftttKey: { type: String, required: true }
});

mongoose.model("socialProfiles", socialProfileSchema);
