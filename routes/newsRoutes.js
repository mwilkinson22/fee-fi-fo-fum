const NewsPostController = require("../controllers/newsPostController");

module.exports = app => {
	app.get(
		"/api/news/legacyPost/:id",
		(req, res, done) => {
			console.log("HI");
			done();
		},
		NewsPostController.getLegacyPost
	);

	app.get("/api/news/post/:id", NewsPostController.getFullPost);

	app.get("/api/news/posts", NewsPostController.getPostList);
};
