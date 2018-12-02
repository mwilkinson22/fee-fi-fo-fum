const mongoose = require("mongoose");
const { Schema } = mongoose;

const positionSchema = new Schema({
	initials: String,
	name: String,
	type: String,
	numbers: [Number]
});

mongoose.model("positions", positionSchema);
