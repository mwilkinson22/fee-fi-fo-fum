const mongoose = require("mongoose");
const collectionName = "newsPosts";
const _ = require("lodash");

//Models
const NewsPost = mongoose.model(collectionName);

//Controllers
const GenericController = require("../controllers/genericController")(collectionName);
const NewsPostController = require("../controllers/newsPostController");

//Middleware
const requireAdmin = require("../middlewares/requireAdmin");

module.exports = app => {
	app.get("/api/news/pagination/:category", NewsPostController.getPagination);

	app.get("/api/news/posts/:category/:page", NewsPostController.getPostList);

	app.get("/api/news/categories", NewsPostController.getCategoryList);

	app.get("/api/news/slug/:category/:slug", NewsPostController.getPostBySlug);

	app.get("/api/news/sidebarPosts", NewsPostController.getSidebarPosts);
};
