const { mongooseDebug } = require("~/middlewares/mongooseDebug");

const mongoose = require("mongoose");
const { Schema } = mongoose;

const broadcasterSchema = new Schema({
	name: { type: String, required: true },
	image: { type: String, required: true }
});

mongooseDebug(broadcasterSchema);

mongoose.model("broadcasters", broadcasterSchema);
