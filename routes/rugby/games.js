const mongoose = require("mongoose");
const collectionName = "games";
const Person = mongoose.model(collectionName);

//Middleware
const requireAdmin = require("../../middlewares/requireAdmin");

//Getters
const getItemById = require("../../middlewares/getters/getItemById");
const getItemBySlug = require("../../middlewares/getters/getItemBySlug");

module.exports = app => {
	//Get
	app.get("/api/games/:id", async (req, res) => {
		getItemById(collectionName, req.params.id, req, res);
	});
	app.get("/api/games/slug/:slug", async (req, res) => {
		getItemBySlug(collectionName, req.params.slug, req, res);
	});
};
