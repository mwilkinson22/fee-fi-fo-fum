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
	image: { type: String, default: null },
	slug: { type: String, required: true, unique: true }
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

//Methods
groundSchema.statics.generateSlug = async function({ name }) {
	const coreSlugText = name
		.toLowerCase()
		.replace(/\s/gi, "-")
		.replace(/(?![_\w-])./gi, "");

	let slugExists = await this.findOne({
		slug: coreSlugText
	});

	if (!slugExists) {
		return coreSlugText;
	} else {
		let i = 2;
		let slug;
		while (slugExists) {
			slug = coreSlugText + "-" + i++;
			slugExists = await this.findOne({
				slug
			});
		}

		return slug;
	}
};

mongoose.model("grounds", groundSchema);
