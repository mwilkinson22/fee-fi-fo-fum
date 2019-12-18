const mongoose = require("mongoose");
const { Schema } = mongoose;

const errorSchema = new Schema({
	date: { type: Date, default: Date.now },
	page: { type: String, required: true },
	ip: { type: String, required: true },
	_user: { type: Schema.Types.ObjectId, ref: "users", default: null },
	browser: { type: String, required: true },
	deviceType: { type: String, required: true },
	message: { type: String },
	componentStack: { type: String },
	file: { type: String }
});

mongoose.model("errors", errorSchema);
