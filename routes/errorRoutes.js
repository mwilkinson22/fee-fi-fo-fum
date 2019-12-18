import * as errorController from "../controllers/errorController";
import requireAdmin from "../middlewares/requireAdmin";

export default app => {
	app.get("/api/errors/", requireAdmin, errorController.getErrors);
	app.post("/api/errors/", errorController.postError);
	app.put("/api/errors/unarchive/:_id", errorController.unarchiveError);
	app.put("/api/errors/archive/:_id", errorController.archiveError);
	app.put("/api/errors/archive", errorController.archiveAllErrors);
};
