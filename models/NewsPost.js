const mongoose = require("mongoose");
const { Schema } = mongoose;
const _ = require("lodash");
const newsCategories = _.map(require("../constants/newsCategories"), category => {
	return category.slug;
});

const newsPostSchema = new Schema({
	title: String,
	_author: { type: Schema.Types.ObjectId, ref: "users" },
	subtitle: String,
	content: String,
	contentHistory: [
		{
			version: Number,
			content: String
		}
	],
	image: String,
	version: Number,
	dateCreated: Date,
	dateModified: Date,
	isPublished: { type: Boolean, default: false },
	category: { type: String, enum: newsCategories },
	_people: [{ type: Schema.Types.ObjectId, ref: "people" }],
	_game: { type: Schema.Types.ObjectId, ref: "games", default: null },
	_teams: [{ type: Schema.Types.ObjectId, ref: "teams" }],
	tags: [String],
	slug: { type: String, unique: true }
});
mongoose.model("newsPosts", newsPostSchema);
