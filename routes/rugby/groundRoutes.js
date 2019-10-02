import * as groundsController from "../../controllers/rugby/groundsController";

export default app => {
	app.get("/api/grounds", groundsController.getGroundsList);
	app.post("/api/grounds", groundsController.createGround);
	app.put("/api/grounds/:_id", groundsController.updateGround);
	app.delete("/api/grounds/:_id", groundsController.deleteGround);
};
