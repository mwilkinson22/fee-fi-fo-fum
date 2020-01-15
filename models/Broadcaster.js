const mongoose = require("mongoose");
const { Schema } = mongoose;

const broadcasterSchema = new Schema({
	name: { type: String, required: true },
	image: { type: String, required: true }
});

mongoose.model("broadcasters", broadcasterSchema);
