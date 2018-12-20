const mongoose = require("mongoose");
const collectionName = "teams";

//Models
const Team = mongoose.model(collectionName);

//Controllers
const GenericController = require("../../controllers/rugby/generic_controller")(collectionName);

//Middleware
const requireAdmin = require("../../middlewares/requireAdmin");

module.exports = app => {
	app.get("/api/teams/:id", GenericController.getItemById);
};
