const _ = require("lodash");
const mongoose = require("mongoose");
const collectionName = "people";
const Person = mongoose.model(collectionName);
const IdLink = mongoose.model("IdLinks");
const SlugRedirect = mongoose.model("slugRedirect");
const validateMongooseId = require("../../utils/validateMongooseId");

module.exports = app => {
	//Get
	app.get("/api/person/:id", async (req, res) => {
		const idIsValid = await validateMongooseId(req.params.id);
		if (!idIsValid) {
			res.status(400).send({
				response: "Invalid ID supplied",
				parameters: req.params
			});
		} else {
			const person = await Person.findById(req.params.id);
			if (person) {
				res.status(200).send(person);
			} else {
				res.status(400).send({
					Response: "Person not found",
					parameters: req.params
				});
			}
		}
	});
	app.get("/api/person/slug/:slug", async (req, res) => {
		let person = await Person.findOne({
			slug: req.params.slug
		});

		//If the slug doesn't match, check slugRedirect, to avoid broken links
		if (!person) {
			const slugRedirect = await SlugRedirect.findOne({
				oldSlug: req.params.slug,
				collectionName: "people"
			});

			if (slugRedirect) {
				person = await Person.findOne({
					_id: slugRedirect.itemId
				});
			}
		}

		if (person) {
			res.status(200).send(person);
		} else {
			res.status(400).send({
				Response: "Person not found",
				parameters: req.params
			});
		}
	});

	app.get("/api/person/search/:name", async (req, res) => {
		const results = await Person.searchByName(decodeURI(req.params.name));
		res.send(results);
	});
};
