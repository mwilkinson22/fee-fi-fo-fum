//This helper will eventually be put back into the routeHelper.js once we remove
//all client references to it

//Modules
import mongoose from "mongoose";

export async function getIdFromSlug(collectionName, slug) {
	const Collection = mongoose.model(collectionName);
	const SlugRedirect = mongoose.model("slugRedirect");

	let result;
	//First, do a simple lookup
	const directLookup = await Collection.findOne({ slug }, "_id").lean();
	if (directLookup) {
		return directLookup._id.toString();
	}

	//Otherwise, we check for redirects
	if (!result) {
		const redirect = await SlugRedirect.findOne({ collectionName, oldSlug: slug }, "itemId").lean();
		if (redirect) {
			const id = redirect.itemId.toString();

			//We need to check the main collection to ensure the redirected item hasn't been deleted.
			const redirectedItem = await Collection.findById(id, "_id").lean();
			if (redirectedItem) {
				return id;
			}
		}
	}
}
