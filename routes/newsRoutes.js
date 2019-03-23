import * as NewsPostController from "../controllers/newsPostController";

module.exports = app => {
	app.get("/api/news/legacyPost/:id", NewsPostController.getLegacyPost);

	app.get("/api/news/post/:id", NewsPostController.getFullPost);

	app.get("/api/news/posts", NewsPostController.getPostList);
};
