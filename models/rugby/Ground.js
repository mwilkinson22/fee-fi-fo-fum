const mongoose = require("mongoose");
const { Schema } = mongoose;
const AddressSchema = require("./Address");

const groundSchema = new Schema({
	name: String,
	address: AddressSchema,
	parking: {
		stadium: Boolean,
		roadside: Boolean,
		nearby: {
			address: AddressSchema,
			estimatedCost: Number
		}
	},
	directions: [
		{
			method: { type: String, enum: ["train", "bus", "walk"] },
			duration: Number
		}
	],
	addThe: Boolean
});

mongoose.model("grounds", groundSchema);
