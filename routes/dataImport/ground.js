const _ = require("lodash");
const mongoose = require("mongoose");
const Ground = mongoose.model("grounds");
const IdLink = mongoose.model("IdLinks");
const collectionName = "grounds";

module.exports = app => {
	app.post("/api/grounds", async (req, res) => {
		await _.each(req.body, async sql => {
			//Get City Id
			const cityId = await IdLink.convertId(sql.city, "cities");

			//Get Directions
			const directions = [];
			if (sql.train_station) {
				directions.push({
					method: "train",
					destination: sql.train_station,
					duration: sql.train_duration
				});
				directions.push({
					method: "walk",
					duration: sql.train_walk
				});
			}
			//Create Ground
			const ground = new Ground({
				name: sql.name,
				address: {
					street: sql.street,
					street2: sql.street2,
					_city: cityId,
					postcode: sql.postcode,
					googlePlaceId: sql.google_place_id
				},
				parking: {
					stadium: sql.stadium_parking === 1,
					roadside: sql.roadside_paring === 1
				},
				directions,
				addThe: sql.add_the === 1
			});
			await ground.save();

			//Add new grounds to idLink document
			await new IdLink({
				_id: ground._id,
				sqlId: sql.id,
				collectionName
			}).save();
		});
		res.send({});
	});

	app.delete("/api/grounds", async (req, res) => {
		await IdLink.remove({ collectionName });
		res.send({});
	});
};
