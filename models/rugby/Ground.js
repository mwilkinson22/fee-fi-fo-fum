const mongoose = require("mongoose");
const { Schema } = mongoose;
const AddressSchema = require("./Address");

const groundSchema = new Schema({
	name: { type: String, required: true },
	address: AddressSchema,
	parking: {
		stadium: { type: Boolean, default: false },
		roadside: { type: Boolean, default: false },
		nearby: {
			address: AddressSchema,
			estimatedCost: Number
		}
	},
	directions: [
		{
			method: { type: String, enum: ["train", "bus", "walk"] },
			destination: String,
			duration: Number
		}
	],
	addThe: { type: Boolean, default: false },
	image: { type: String, default: null }
});

groundSchema.query.forList = function() {
	return this.populate({
		path: "address._city",
		populate: {
			path: "_country",
			select: "name"
		}
	});
};

mongoose.model("grounds", groundSchema);
