//Temporary table, used to store the old sql IDs alongside the new mongo IDs, in case of broken relationships
const { mongooseDebug } = require("~/middlewares/mongooseDebug");

const mongoose = require("mongoose");
const { Schema } = mongoose;

const idLinkSchema = new Schema({
	collectionName: String,
	sqlId: Number
});

idLinkSchema.statics.convertId = async function(sqlId, collectionName) {
	const idLink = await this.findOne({ sqlId, collectionName });
	return idLink._id;
};

mongooseDebug(idLinkSchema);

mongoose.model("IdLinks", idLinkSchema);
