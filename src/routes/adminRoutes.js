import * as adminController from "../controllers/adminController";
import requireAdmin from "../middlewares/requireAdmin";

export default app => {
	app.get("/api/admin/dashboard", requireAdmin, adminController.getDashboardData);
};
