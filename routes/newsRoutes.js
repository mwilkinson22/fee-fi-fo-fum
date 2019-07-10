import * as NewsPostController from "../controllers/newsPostController";
import requireAdmin from "../middlewares/requireAdmin";
import upload from "../middlewares/upload";

module.exports = app => {
	app.get("/api/news/legacyPost/:id", NewsPostController.getLegacyPost);

	app.get("/api/news/post/:id", NewsPostController.getFullPost);

	app.get("/api/news/posts", NewsPostController.getPostList);

	app.put("/api/news/post/:_id", requireAdmin, NewsPostController.updatePost);

	app.post("/api/news/post/", requireAdmin, NewsPostController.createPost);

	app.delete("/api/news/post/:_id", requireAdmin, NewsPostController.deletePost);

	app.post(
		"/api/news/post/:_id/headerImage",
		requireAdmin,
		upload.single("image"),
		NewsPostController.uploadHeaderImage
	);

	app.delete(
		"/api/news/post/:_id/headerImage",
		requireAdmin,
		NewsPostController.deleteHeaderImage
	);

	app.post(
		"/api/news/image/inline",
		requireAdmin,
		upload.single("image"),
		NewsPostController.uploadInlineImage
	);
};
