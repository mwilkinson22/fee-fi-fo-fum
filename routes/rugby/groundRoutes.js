import * as groundsController from "../../controllers/rugby/groundsController";

module.exports = app => {
	app.get("/api/grounds", groundsController.getGroundsList);
};
