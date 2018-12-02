const _ = require("lodash");
const mongoose = require("mongoose");
const Country = mongoose.model("countries");
const City = mongoose.model("cities");
const IdLink = mongoose.model("IdLinks");
const collectionName = "cities";

module.exports = app => {
	app.post("/api/cities", async (req, res) => {
		await _.each(req.body, async sql => {
			const { id, name, country_id } = sql;

			//Get the country id
			const countryId = await IdLink.convertId(country_id, "countries");

			//Create City
			const city = await new City({
				name,
				_country: countryId
			});
			await city.save();

			//Add new cities to idLink document
			const idLink = await new IdLink({
				_id: city._id,
				sqlId: id,
				collectionName
			}).save();
		});
		res.send({});
	});

	app.delete("/api/cities", async (req, res) => {
		await IdLink.remove({ collectionName });
		res.send({});
	});
};
