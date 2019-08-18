import * as SocialController from "../controllers/socialController";
import requireAdmin from "../middlewares/requireAdmin";

module.exports = app => {
	app.post("/api/socialProfiles/twitterTest", requireAdmin, SocialController.twitterTest);
	app.post("/api/socialProfiles", requireAdmin, SocialController.createProfile);
	app.get("/api/socialProfiles", requireAdmin, SocialController.getProfiles);
	app.put("/api/socialProfiles/:_id", requireAdmin, SocialController.updateProfile);
	app.delete("/api/socialProfiles/:_id", requireAdmin, SocialController.deleteProfile);
};
