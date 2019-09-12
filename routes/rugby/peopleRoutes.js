//Controllers
import * as peopleController from "../../controllers/rugby/peopleController";

//Middleware
import requireAdmin from "../../middlewares/requireAdmin";

module.exports = app => {
	//Getters
	app.get("/api/people/:id", peopleController.getPerson);
	app.get("/api/people", peopleController.getList);

	//Putters
	app.put("/api/people/setExternalNames", requireAdmin, peopleController.setExternalNames);
	app.put("/api/people/:id", requireAdmin, peopleController.updatePerson);

	//Post
	app.post("/api/people", requireAdmin, peopleController.createPerson);
	app.post("/api/people/parsePlayerList", requireAdmin, peopleController.parsePlayerList);

	//Delete
	app.delete("/api/people/:_id", requireAdmin, peopleController.deletePerson);
};
