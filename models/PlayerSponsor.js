const mongoose = require("mongoose");
const { Schema } = mongoose;

const sponsorSchema = new Schema({
	name: { type: String, unique: true, required: true },
	twitter: { type: String, default: null },
	image: { type: String, default: null }
});

mongoose.model("playerSponsors", sponsorSchema);
