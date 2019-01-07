const mongoose = require("mongoose");
const collectionName = "people";

//Models
const Person = mongoose.model(collectionName);

//Controllers
const GenericController = require("../../controllers/genericController")(collectionName);

//Middleware & Utils
const requireAdmin = require("../../middlewares/requireAdmin");
const getPositions = require("../../utils/getPositions");

module.exports = app => {
	//Get
	app.get("/api/people/:id", GenericController.getItemById);
	app.get("/api/people/slug/:slug", async (req, res) => {
		const { slug } = req.params;
		const id = await GenericController.getIdFromSlug(slug, collectionName);

		//Return value
		if (id) {
			const person = await Person.findById(id)
				.populate("_represents")
				.populate({ path: "_hometown", populate: { path: "_country" } });

			if (person.isPlayer) {
				person.playerDetails = getPositions(person.playerDetails);
			}

			res.status(200).send(person);
		} else {
			res.status(404).send({
				Response: "Person not found",
				parameters: req.params
			});
		}
	});

	app.get("/api/people/search/:name", async (req, res) => {
		const results = await Person.searchByName(decodeURI(req.params.name));
		res.send(results);
	});

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
};
