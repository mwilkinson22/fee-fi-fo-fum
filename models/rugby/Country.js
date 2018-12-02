const mongoose = require("mongoose");
const { Schema } = mongoose;

const countrySchema = new Schema({
	name: String,
	demonym: String
});

mongoose.model("countries", countrySchema);
