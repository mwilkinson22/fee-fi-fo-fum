import * as broadcasterController from "../controllers/broadcasterController";
import requireAdmin from "../middlewares/requireAdmin";

export default app => {
	app.get("/api/broadcasters/", broadcasterController.getBroadcasters);
	app.put("/api/broadcasters/:_id", requireAdmin, broadcasterController.updateBroadcaster);
	app.post("/api/broadcasters/", requireAdmin, broadcasterController.createBroadcaster);
	app.delete("/api/broadcasters/:_id", requireAdmin, broadcasterController.deleteBroadcaster);
};
