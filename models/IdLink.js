//Temporary table, used to store the old sql IDs alongside the new mongo IDs, in case of broken relationships
const mongoose = require("mongoose");
const { Schema } = mongoose;

const idLinkSchema = new Schema({
	collection: String,
	sqlId: Number,
	mongoId: Schema.Types.ObjectId
});

mongoose.model("IdLinks", idLinkSchema);
