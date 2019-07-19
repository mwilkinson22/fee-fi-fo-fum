const mongoose = require("mongoose");
const { Schema } = mongoose;

const citySchema = new Schema({
	name: { type: String, required: true },
	_country: { type: Schema.Types.ObjectId, ref: "countries" },
	slug: { type: String, unique: true, required: true }
});

citySchema.statics.generateSlug = async function({ name, _country }) {
	//Get Country
	const Country = mongoose.model("countries");
	const country = await Country.findById(_country, "slug");

	const citySlug = name
		.toLowerCase()
		.replace(/\s+/gi, "-")
		.replace(/(?![a-z-])./gi, "");

	const coreSlugText = `${citySlug}-${country.slug}`;

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

mongoose.model("cities", citySchema);
