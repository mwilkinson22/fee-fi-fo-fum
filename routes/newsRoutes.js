const mongoose = require("mongoose");

//Controllers
const NewsPostController = require("../controllers/newsPostController");

module.exports = app => {
	app.get("/api/news/fixPreview", async (req, res) => {
		const NewsPost = mongoose.model("newsPosts");
		const posts = await NewsPost.find({});
		for (const post of posts) {
			post.content = post.content.replace(
				"<p><previewEnd /></p>",
				"<!-- Preview Ends Here -->"
			);
			post.content = post.content.replace("<previewEnd />", "<!-- Preview Ends Here -->");
			await post.save();
		}
		const newPosts = await NewsPost.find({}, "content").limit(5);
		res.send(newPosts);
	});

	app.get("/api/news/pagination/:category", NewsPostController.getPagination);

	app.get("/api/news/posts/:category/:page", NewsPostController.getPostList);

	app.get("/api/news/categories", NewsPostController.getCategoryList);

	app.get("/api/news/slug/:slug", NewsPostController.getPostBySlug);

	app.get("/api/news/frontpagePosts", NewsPostController.getFrontpagePosts);

	app.get("/api/news/sidebarPosts", NewsPostController.getSidebarPosts);
};
