const { mongooseDebug } = require("~/middlewares/mongooseDebug");

const mongoose = require("mongoose");
const { Schema } = mongoose;

const networkRequestSchema = new Schema({
	page: { type: String, required: true },
	date: { type: Date, default: Date.now },
	data: { type: String, required: true }
});

mongooseDebug(networkRequestSchema);

mongoose.model("networkRequests", networkRequestSchema);
