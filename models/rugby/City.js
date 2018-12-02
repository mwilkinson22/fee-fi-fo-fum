const mongoose = require("mongoose");
const { Schema } = mongoose;

const citySchema = new Schema({
	name: String,
	_country: { type: Schema.Types.ObjectId, ref: "countries" }
});

mongoose.model("cities", citySchema);
