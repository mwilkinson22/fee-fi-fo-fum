const _ = require("lodash");
const mongoose = require("mongoose");
const collectionName = "grounds";

//Models
const Grounds = mongoose.model(collectionName);
const SlugRedirect = mongoose.model("slugRedirect");

module.exports = app => {
	app.get("/api/grounds", async (req, res) => {
		const grounds = await Grounds.find({}).populate({
			path: "address._city",
			populate: {
				path: "_country"
			}
		});

		const slugRedirects = await SlugRedirect.find({ collectionName });
		const oldSlugs = _.chain(slugRedirects)
			.keyBy("oldSlug")
			.mapValues(slug => slug.itemId)
			.value();
		const activeSlugs = _.chain(grounds)
			.keyBy("slug")
			.mapValues(ground => ground._id)
			.value();

		res.send({ groundList: _.keyBy(grounds, "_id"), slugMap: { ...oldSlugs, ...activeSlugs } });
	});
};
