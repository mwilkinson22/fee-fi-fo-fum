import mongoose from "mongoose";
const collectionName = "people";

//Models
const Person = mongoose.model(collectionName);

//Controllers
import * as peopleController from "../../controllers/rugby/peopleController";

//Middleware & Utils
import requireAdmin from "../../middlewares/requireAdmin";

module.exports = app => {
	//Getters
	app.get("/api/people/searchNames/:names", peopleController.searchNames);
	app.get("/api/people/sponsors", peopleController.getSponsors);
	app.get("/api/people/:id", peopleController.getPerson);
	app.get("/api/people", peopleController.getList);

	app.post("/api/people", requireAdmin, async (req, res) => {
		const { data } = req.body;

		//Remove unneccessary details
		/* Possibly unneccesary. Depends on redux-form behaviour. Will test once we get the front-end up and running
		if (!data.isPlayer) {
			delete data.playerDetails;
			delete data.additionalPlayerStats;
		}
		if (!data.isCoach) {
			delete data.coachDetails;
			delete data.additionalCoachStats;
		}
		if (!data.isReferee) {
			delete data.refereeDetails;
		}
		*/

		const person = await new Person({
			...data,

			//Convert DOB to date format
			dateOfBirth: new Date(data.dateOfBirth)
		});

		await person.save();

		res.send(person);
	});

	//Putters
	app.put("/api/people/setExternalNames", peopleController.setExternalNames);
};
