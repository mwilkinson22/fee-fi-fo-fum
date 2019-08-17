import * as SocialController from "../controllers/socialController";
import requireAdmin from "../middlewares/requireAdmin";

module.exports = app => {
	app.get("/api/twitter/auth", SocialController.twitterAuth);
	app.get("/api/twitter/callback", SocialController.twitterCallback);

	app.post("/api/socialProfiles/twitterTest", requireAdmin, SocialController.twitterTest);
	app.post("/api/socialProfiles", requireAdmin, SocialController.createProfile);
	app.get("/api/socialProfiles", requireAdmin, SocialController.getProfiles);
	app.put("/api/socialProfiles/:_id", requireAdmin, SocialController.updateProfile);
	app.delete("/api/socialProfiles/:_id", requireAdmin, SocialController.deleteProfile);
};
