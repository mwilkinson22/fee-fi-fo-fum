const _ = require("lodash");
const collectionName = "newsPosts";
const mongoose = require("mongoose");
const NewsPost = mongoose.model(collectionName);
const postsPerPage = 9;
const GenericController = require("./genericController")(collectionName);

module.exports = {
	async getCategoryList(req, res) {
		const categories = require("../constants/newsCategories");
		res.send(categories);
	},
	async getPagination(req, res) {
		const { category } = req.params;
		const query = category === "all" ? {} : { category };
		const total = await NewsPost.find(query).countDocuments();
		res.send({ pages: Math.ceil(total / postsPerPage) });
	},

	async getPostList(req, res) {
		const { category } = req.params;
		const query = category === "all" ? {} : { category };
		const page = Number(req.params.page);
		const skip = (page - 1) * postsPerPage;

		const posts = await NewsPost.find(query)
			.sort({ dateCreated: -1 })
			.skip(skip)
			.limit(postsPerPage)
			.forList();

		res.send({ category, page, posts });
	},
	async getSidebarPosts(req, res) {
		const posts = await NewsPost.find({ isPublished: true })
			.sort({ dateCreated: -1 })
			.limit(8)
			.forList();
		res.send(posts);
	},

	async getPostBySlug(req, res) {
		const postId = await GenericController.getIdFromSlug(req.params.slug, collectionName);
		const newsPost = await NewsPost.findOne(
			{
				_id: postId
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
	}
};
