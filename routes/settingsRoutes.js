import * as settingsController from "../controllers/settingsController";

export default app => {
	app.get("/api/settings/:names", settingsController.getSettings);
	app.post("/api/settings", settingsController.setSettings);
};
