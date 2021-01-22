const { mongooseDebug } = require("~/middlewares/mongooseDebug");

const mongoose = require("mongoose");
const { Schema } = mongoose;

const citySchema = new Schema({
	name: { type: String, required: true },
	_country: { type: Schema.Types.ObjectId, ref: "countries" }
});

citySchema.statics.generateSlug = async function({ name, _country }) {
	//Get Country
	const Country = mongoose.model("countries");
	const country = await Country.findById(_country, "slug");

	const citySlug = name
		.toLowerCase()
		.replace(/(?![a-z-\s])./gi, "")
		.trim()
		.replace(/\s+/gi, "-");

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

mongooseDebug(citySchema);

citySchema.query.populated = function() {
	return this.populate({
		path: "_country",
		select: "name"
	});
};

mongoose.model("cities", citySchema);
