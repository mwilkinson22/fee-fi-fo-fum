//Modules
import passport from "passport";

//Helpers
import * as userController from "../controllers/userController";

//Middleware
import requireAuth from "../middlewares/requireAuth";
import requireAdmin from "../middlewares/requireAdmin";
import requireSiteOwner from "~/middlewares/requireSiteOwner";

export default app => {
	//Create New User
	app.post("/api/users", requireAdmin, userController.createUser);

	//Transfer Site Ownership
	app.put("/api/users/ownership/:id", requireSiteOwner, userController.transferSiteOwner);

	//Update User
	app.put("/api/users/:id", requireAuth, userController.updateUser);

	//Delete User
	app.delete("/api/users/:id", requireAdmin, userController.deleteUser);

	//Get User List
	app.get("/api/users", requireAdmin, userController.getUserList);

	//Get currently logged in user
	app.get("/api/users/current", userController.currentUser);

	//Get existing user
	app.get("/api/users/:id", requireAdmin, userController.getUser);

	//Login
	app.post("/api/login", passport.authenticate("local"), userController.currentUser);

	//Logout
	app.get("/api/logout", userController.logout);
};
