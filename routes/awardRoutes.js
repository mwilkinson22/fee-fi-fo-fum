import * as awardController from "../controllers/awardController";
import requireAdmin from "../middlewares/requireAdmin";

export default app => {
	app.get("/api/awards/current", awardController.getCurrent);
	app.get("/api/awards", requireAdmin, awardController.getAwards);
};
