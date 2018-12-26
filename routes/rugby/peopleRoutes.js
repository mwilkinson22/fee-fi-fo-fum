const mongoose = require("mongoose");
const collectionName = "people";

//Models
const Person = mongoose.model(collectionName);

//Controllers
const GenericController = require("../../controllers/rugby/genericController")(collectionName);

//Middleware
const requireAdmin = require("../../middlewares/requireAdmin");

module.exports = app => {
	//Get
	app.get("/api/people/:id", GenericController.getItemById);
	app.get("/api/people/slug/:slug", GenericController.getItemBySlug);

	app.get("/api/people/search/:name", async (req, res) => {
		console.log("sup");
		const results = await Person.searchByName(decodeURI(req.params.name));
		res.send(results);
	});

	app.post("/api/people", requireAdmin, async (req, res) => {
		const { data } = req.body;

		//Remove unneccessary details
		/* Possibly unneccesary. Depends on react-router behaviour. Will test once we get the front-end up and running
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
};
