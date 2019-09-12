//Modules
import _ from "lodash";
import mongoose from "mongoose";
const SlugRedirect = mongoose.model("slugRedirect");

export async function getListsAndSlugs(data, collectionName) {
	if (collectionName == "games" || collectionName == "people" || collectionName == "newsPosts") {
		const slugRedirects = await SlugRedirect.find({ collectionName });

		const redirects = _.chain(slugRedirects)
			.keyBy("oldSlug")
			.mapValues("itemId")
			.value();

		return redirects;
	} else {
		const slugRedirects = await SlugRedirect.find({ collectionName });

		const oldSlugs = _.chain(slugRedirects)
			.keyBy("oldSlug")
			.mapValues(slug => ({ redirect: true, slug: slug.itemId }))
			.value();

		const activeSlugs = _.chain(data)
			.keyBy("slug")
			.mapValues(item => ({ redirect: false, id: item._id }))
			.value();

		return { list: _.keyBy(data, "_id"), slugMap: { ...oldSlugs, ...activeSlugs } };
	}
}
