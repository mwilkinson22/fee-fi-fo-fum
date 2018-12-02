const mongoose = require("mongoose");
const { Schema } = mongoose;

const slugRedirectSchema = new Schema({
	oldSlug: String,
	document: String,
	itemId: Schema.Types.ObjectId
});

mongoose.model("slugRedirect", slugRedirectSchema);
