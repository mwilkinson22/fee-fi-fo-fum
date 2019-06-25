//Modules
import passport from "passport";

//Helpers
import * as userController from "../controllers/userController";

//Middleware
import requireAdmin from "../middlewares/requireAdmin";
import requireAuth from "../middlewares/requireAuth";

module.exports = app => {
	//Create New User
	app.post("/api/users", requireAdmin, userController.createNewUser);

	//Get User List
	app.get("/api/users", requireAdmin, userController.getUserList);

	//Get existing user
	app.get("/api/user/:id", requireAuth, userController.getUser);

	//Login
	app.post("/api/login", passport.authenticate("local"), userController.currentUser);

	//Logout
	app.get("/api/logout", userController.logout);

	//Get currently logged in user
	app.get("/api/current_user", userController.currentUser);
};
