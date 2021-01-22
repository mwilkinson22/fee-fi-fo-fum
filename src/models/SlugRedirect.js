import _ from "lodash";
import mongoose from "mongoose";
const { mongooseDebug } = require("~/middlewares/mongooseDebug");
const { Schema } = mongoose;

const slugRedirectSchema = new Schema({
	oldSlug: String,
	collectionName: String,
	itemId: Schema.Types.ObjectId
});

mongooseDebug(slugRedirectSchema);

slugRedirectSchema.statics.getSlugMap = async function(collectionName) {
	const result = await this.find({ collectionName });
	return _.chain(result)
		.keyBy("oldSlug")
		.mapValues(slug => slug.itemId)
		.value();
};

mongoose.model("slugRedirect", slugRedirectSchema);
