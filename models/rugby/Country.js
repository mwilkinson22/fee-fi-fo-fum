const mongoose = require("mongoose");
const { Schema } = mongoose;

const countrySchema = new Schema({
	name: { type: String, unique: true, required: true },
	demonym: { type: String, unique: true, required: true },
	slug: { type: String, unique: true, required: true }
});

countrySchema.statics.generateSlug = async function(name) {
	const coreSlugText = name
		.toLowerCase()
		.replace(/(?![a-z-\s])./gi, "")
		.trim()
		.replace(/\s+/gi, "-");

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

mongoose.model("countries", countrySchema);
