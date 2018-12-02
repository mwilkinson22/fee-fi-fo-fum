const _ = require("lodash");
const mongoose = require("mongoose");
const Country = mongoose.model("countries");
const IdLink = mongoose.model("IdLinks");
const collectionName = "countries";

module.exports = app => {
	app.post("/api/countries", async (req, res) => {
		await _.each(req.body, async sql => {
			const { id, name, demonym } = sql;
			const country = new Country({
				name,
				demonym
			});

			await country.save();

			//Add new grounds to idLink document
			await new IdLink({
				_id: country._id,
				sqlId: id,
				collectionName
			}).save();
		});
		res.send({});
	});

	app.delete("/api/countries", async (req, res) => {
		await IdLink.remove({ collectionName });
		res.send({});
	});
};
