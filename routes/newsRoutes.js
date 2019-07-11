import * as NewsPostController from "../controllers/newsPostController";
import requireAdmin from "../middlewares/requireAdmin";

module.exports = app => {
	app.get("/api/news/legacyPost/:id", NewsPostController.getLegacyPost);

	app.get("/api/news/post/:id", NewsPostController.getFullPost);

	app.get("/api/news/headerImages", NewsPostController.getHeaderImages);

	app.get("/api/news/posts", NewsPostController.getPostList);

	app.put("/api/news/post/:_id", requireAdmin, NewsPostController.updatePost);

	app.post("/api/news/post/", requireAdmin, NewsPostController.createPost);

	app.delete("/api/news/post/:_id", requireAdmin, NewsPostController.deletePost);
};
