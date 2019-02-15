const _ = require("lodash");
const collectionName = "newsPosts";
const mongoose = require("mongoose");
const NewsPost = mongoose.model(collectionName);
const SlugRedirect = mongoose.model("slugRedirect");
const postsPerPage = 9;
const GenericController = require("./genericController")(collectionName);

async function getRecentPosts(count, mustBePublished) {
	const query = mustBePublished ? { isPublished: true } : {};
	const posts = await NewsPost.find(query)
		.sort({ dateCreated: -1 })
		.limit(count)
		.forList();
	return posts;
}

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
		const posts = await getRecentPosts(8, true);
		res.send(posts);
	},
	async getFrontpagePosts(req, res) {
		const posts = await getRecentPosts(3, true);
		res.send(posts);
	},

	async getLegacyPost(req, res) {
		const { id } = req.params;
		const redir = await SlugRedirect.findOne({ collectionName, oldSlug: id });
		if (redir) {
			const post = await NewsPost.findById(redir.itemId, "slug");
			res.send(post);
		} else {
			res.status(404).send({});
		}
	},

	async getPostBySlug(req, res) {
		const { slug } = req.params;
		let newsPost = await NewsPost.findOne(
			{
				slug
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
			select: "name frontendName twitter image"
		});

		if (newsPost && (newsPost.isPublished || (req.user && req.user.isAdmin))) {
			res.send(newsPost);
		} else {
			const slugRedirect = await SlugRedirect.findOne({ collectionName, oldSlug: slug });
			if (slugRedirect) {
				newsPost = await NewsPost.findById(slugRedirect.itemId, { slug: 1 });
				res.status(308).send(newsPost);
			}
			res.status(404).send("Post not found");
		}
	}
};
