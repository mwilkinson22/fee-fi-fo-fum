import * as settingsController from "../controllers/settingsController";
import requireAdmin from "../middlewares/requireAdmin";

export default app => {
	app.get("/api/settings/:names", settingsController.getSettings);
	app.post("/api/settings", requireAdmin, settingsController.setSettings);
};
