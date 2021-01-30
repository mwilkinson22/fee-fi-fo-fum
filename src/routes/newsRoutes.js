import * as newsPostController from "../controllers/newsPostController";
import requireAdmin from "../middlewares/requireAdmin";

export default app => {
	//Get full posts
	app.get("/api/news/post/id/:_id", newsPostController.getFullPost);
	app.get("/api/news/post/slug/:slug", newsPostController.getFullPostBySlug);

	//Pagination
	app.get("/api/news/posts/page/:category/:page", newsPostController.getPage);
	app.get("/api/news/posts/pagecount", newsPostController.getPageCount);

	//Posts for postList
	app.get("/api/news/posts/all", requireAdmin, newsPostController.getFullPostList);
	app.get("/api/news/posts/firstsix", newsPostController.getFirstSixPosts);
	app.get("/api/news/posts/:ids", newsPostController.getPostList);

	//Create/Update/Delete
	app.put("/api/news/post/:_id", requireAdmin, newsPostController.updatePost);
	app.post("/api/news/post/", requireAdmin, newsPostController.createPost);
	app.delete("/api/news/post/:_id", requireAdmin, newsPostController.deletePost);
};
