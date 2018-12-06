const mongoose = require("mongoose");
const collectionName = "people";
const Person = mongoose.model(collectionName);

//Middleware
const requireAdmin = require("../../middlewares/requireAdmin");

//Getters
const getItemById = require("../../middlewares/getters/getItemById");
const getItemBySlug = require("../../middlewares/getters/getItemBySlug");

module.exports = app => {
	//Get
	app.get("/api/people/:id", async (req, res) => {
		getItemById(collectionName, req.params.id, req, res);
	});
	app.get("/api/people/slug/:slug", async (req, res) => {
		getItemBySlug(collectionName, req.params.slug, req, res);
	});

	app.get("/api/people/search/:name", async (req, res) => {
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
