const mongoose = require("mongoose");
const { Schema } = mongoose;
const _ = require("lodash");
const newsCategories = _.map(require("../constants/newsCategories"), category => {
	return category.slug;
});

const newsPostSchema = new Schema({
	title: { type: String, required: true },
	_author: { type: Schema.Types.ObjectId, ref: "users", required: true },
	subtitle: { type: String, default: null },
	content: { type: String, required: true },
	contentHistory: {
		type: [
			{
				version: Number,
				content: String
			}
		],
		default: []
	},
	image: { type: String, default: null },
	version: { type: Number, default: 0 },
	dateCreated: { type: String, required: true, default: Date.now },
	dateModified: { type: String, required: true, default: Date.now },
	isPublished: { type: Boolean, default: false, required: true },
	category: { type: String, enum: newsCategories, required: true },
	_people: [{ type: Schema.Types.ObjectId, ref: "people" }],
	_game: { type: Schema.Types.ObjectId, ref: "games", default: null },
	_teams: [{ type: Schema.Types.ObjectId, ref: "teams" }],
	tags: { type: [String], default: [] },
	slug: { type: String, unique: true, required: true }
});

newsPostSchema.query.forList = function() {
	return this.select({
		slug: 1,
		title: 1,
		image: 1,
		dateCreated: 1,
		category: 1,
		_game: 1,
		_people: 1,
		_teams: 1,
		tags: 1
	}).lean();
};

mongoose.model("newsPosts", newsPostSchema);
