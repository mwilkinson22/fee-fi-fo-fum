import * as awardController from "../controllers/awardController";
import requireAdmin from "../middlewares/requireAdmin";

export default app => {
	app.get("/api/awards/current", awardController.getCurrent);
	app.get("/api/awards", requireAdmin, awardController.getAwards);

	app.post("/api/awards", requireAdmin, awardController.createAward);

	app.put("/api/awards/:_id", requireAdmin, awardController.updateAward);

	app.delete("/api/awards/:_id", requireAdmin, awardController.deleteAward);
};
