const mongoose = require("mongoose");
const { Schema } = mongoose;

const addressSchema = new Schema({
	street: String,
	street2: { type: String, default: null },
	_city: { type: Schema.Types.ObjectId, ref: "cities" },
	postcode: String,
	googlePlaceId: String
});

module.exports = addressSchema;
