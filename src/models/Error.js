const { mongooseDebug } = require("~/middlewares/mongooseDebug");

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
	file: { type: String },
	archived: { type: Boolean, default: false }
});

mongooseDebug(errorSchema);

mongoose.model("errors", errorSchema);
