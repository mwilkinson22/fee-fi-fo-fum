const mongoose = require("mongoose");
const collectionName = "people";

//Models
const Person = mongoose.model(collectionName);
const SlugRedirect = mongoose.model("slugRedirect");

//Controllers
const GenericController = require("../../controllers/genericController")(collectionName);
const PeopleController = require("../../controllers/rugby/peopleController");

//Middleware & Utils
const requireAdmin = require("../../middlewares/requireAdmin");
const getPositions = require("../../utils/getPositions");

module.exports = app => {
	//Get
	app.get("/api/people/:id", GenericController.getItemById);
	app.get("/api/people/slug/:slug", async (req, res) => {
		const { slug } = req.params;
		let person = await Person.findOne({ slug })
			.populate("_represents")
			.populate({ path: "_hometown", populate: { path: "_country" } });
		if (person) {
			if (person.isPlayer) {
				person.playerDetails = getPositions(person.playerDetails);
			}
			res.send(person);
		} else {
			//Check for a redirect
			const slugRedirect = await SlugRedirect.findOne({ collectionName, oldSlug: slug });
			if (slugRedirect) {
				person = await Person.findById(slugRedirect.itemId, { slug: 1 });
				res.status(308).send(person);
			} else {
				res.status(404).send({});
			}
		}
	});

	app.get("/api/people/playerStatsYears/:id/", PeopleController.getPlayerStatsYears);
	app.get("/api/people/playerStats/:id/:year", PeopleController.getPlayerStatsByYear);

	app.get("/api/people/search/:name", async (req, res) => {
		const { name } = req.params;
		const results = await Person.searchByName(decodeURI(name));
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
