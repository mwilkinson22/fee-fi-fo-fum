const mongoose = require("mongoose");
const { Schema } = mongoose;

const socialProfileSchema = new Schema({
	name: { type: String, required: true, unique: true },
	twitter: {
		access_token: { type: String, required: true },
		access_token_secret: { type: String, required: true }
	},
	iftttKey: { type: String, required: true },
	archived: { type: Boolean, default: false }
});

mongoose.model("socialProfiles", socialProfileSchema);
