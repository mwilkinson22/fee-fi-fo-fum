//Modules
import _ from "lodash";
import mongoose from "mongoose";
const SlugRedirect = mongoose.model("slugRedirect");

export async function getListsAndSlugs(data, collectionName) {
	const slugRedirects = await SlugRedirect.find({ collectionName });

	const oldSlugs = _.chain(slugRedirects)
		.keyBy("oldSlug")
		.mapValues(slug => slug.itemId)
		.value();

	const activeSlugs = _.chain(data)
		.keyBy("slug")
		.mapValues(item => item._id)
		.value();

	return { list: _.keyBy(data, "_id"), slugMap: { ...oldSlugs, ...activeSlugs } };
}
