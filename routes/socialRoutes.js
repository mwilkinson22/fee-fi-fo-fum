import * as SocialController from "../controllers/socialController";
import requireAdmin from "../middlewares/requireAdmin";

export default app => {
	app.post(
		"/api/socialProfiles/validateTwitter",
		requireAdmin,
		SocialController.validateTwitterCredentials
	);
	app.post("/api/socialProfiles", requireAdmin, SocialController.createProfile);
	app.get("/api/socialProfiles", requireAdmin, SocialController.getProfiles);
	app.put("/api/socialProfiles/:_id", requireAdmin, SocialController.updateProfile);
	app.delete("/api/socialProfiles/:_id", requireAdmin, SocialController.deleteProfile);
};
