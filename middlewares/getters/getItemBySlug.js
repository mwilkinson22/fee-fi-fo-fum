const mongoose = require("mongoose");
const SlugRedirect = mongoose.model("slugRedirect");

module.exports = async (collectionName, slug, req, res) => {
	const Collection = mongoose.model(collectionName);
	let item = await Collection.findOne({ slug });

	//If the slug doesn't match, check slugRedirect, to avoid broken links
	if (!item) {
		const slugRedirect = await SlugRedirect.findOne({
			oldSlug: slug,
			collectionName
		});

		if (slugRedirect) {
			item = await Collection.findOne({
				_id: slugRedirect.itemId
			});
		}
	}

	//Return value
	if (item) {
		res.status(200).send(item);
	} else {
		res.status(400).send({
			Response: "Item not found",
			parameters: req.params
		});
	}
};
