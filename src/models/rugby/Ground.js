const { mongooseDebug } = require("~/middlewares/mongooseDebug");

const mongoose = require("mongoose");
const { Schema } = mongoose;
const AddressSchema = require("./Address");

const groundSchema = new Schema({
	name: { type: String, required: true },
	address: AddressSchema,
	parking: { type: String, enum: ["stadium", "street", null] },
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

mongooseDebug(groundSchema);

mongoose.model("grounds", groundSchema);
