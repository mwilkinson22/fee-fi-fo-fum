//Controllers
import * as peopleController from "~/controllers/rugby/peopleController";

//Middleware
import requireAdmin from "~/middlewares/requireAdmin";

export default app => {
	//Getters
	app.get("/api/people/multi/:ids", peopleController.getPeople);
	app.get("/api/people/slug/:slug", peopleController.getPersonFromSlug);
	app.get("/api/people/:id", peopleController.getPerson);
	app.get("/api/people", peopleController.getList);

	//Putters
	app.put("/api/people/setExternalNames", requireAdmin, peopleController.setExternalNames);
	app.put("/api/people/:id", requireAdmin, peopleController.updatePerson);
	app.put("/api/people/", requireAdmin, peopleController.updatePeople);

	//Post
	app.post("/api/people/:_id/postImageCard", requireAdmin, peopleController.postImageCard);
	app.post("/api/people/:_id/getImageCard", requireAdmin, peopleController.getImageCard);
	app.post("/api/people", requireAdmin, peopleController.createPerson);
	app.post("/api/people/parsePlayerList", requireAdmin, peopleController.parsePlayerList);

	//Delete
	app.delete("/api/people/:_id", requireAdmin, peopleController.deletePerson);
};
