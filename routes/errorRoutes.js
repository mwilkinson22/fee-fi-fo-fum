import * as errorController from "../controllers/errorController";
import requireAdmin from "../middlewares/requireAdmin";

export default app => {
	app.get("/api/errors/", requireAdmin, errorController.getErrors);
	app.post("/api/errors/", errorController.postError);
};
