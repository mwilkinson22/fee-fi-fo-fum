const mongoose = require("mongoose");
const collectionName = "newsPosts";
const _ = require("lodash");

//Models
const NewsPost = mongoose.model(collectionName);

//Controllers
const GenericController = require("../controllers/rugby/genericController")(collectionName);

//Middleware
const requireAdmin = require("../middlewares/requireAdmin");

module.exports = app => {
	app.get("/api/news/categories", (req, res) => {
		const categories = require("../constants/newsCategories");
		res.send(categories);
	});

	app.get("/api/news/slug/:category/:slug", async (req, res) => {
		const postId = await GenericController.getIdFromSlug(req.params.slug, collectionName);
		const newsPost = await NewsPost.findOne(
			{
				_id: postId,
				category: req.params.category
			},
			{
				_people: 1,
				_game: 1,
				_teams: 1,
				_author: 1,
				tags: 1,
				title: 1,
				content: 1,
				dateCreated: 1,
				isPublished: 1,
				slug: 1,
				category: 1,
				image: 1
			}
		).populate({
			path: "_author",
			select: "name"
		});
		if (newsPost && (newsPost.isPublished || (req.user && req.user.isAdmin))) {
			res.send(newsPost);
		} else {
			res.status(404).send("Post not found");
		}
	});

	app.get("/api/news/recentPosts", async (req, res) => {
		const posts = await NewsPost.find(
			{ isPublished: true },
			"slug title image dateCreated category"
		)
			.sort({ dateCreated: -1 })
			.limit(5);
		res.send(posts);
	});
};
