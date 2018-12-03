const _ = require("lodash");
const mongoose = require("mongoose");
const collectionName = "neutralGames";
const NeutralGame = mongoose.model(collectionName);
const IdLink = mongoose.model("IdLinks");

module.exports = app => {
	app.post("/api/neutralGames", async (req, res) => {
		await _.each(req.body, async sql => {
			//Get home team
			const homeTeam = await IdLink.convertId(sql.home, "teams");
			const awayTeam = await IdLink.convertId(sql.away, "teams");
			const competition = await IdLink.convertId(
				sql.comp_id,
				"competitionSegments"
			);

			//Create New Entry
			const newEntry = new NeutralGame({
				_competition: competition,
				date: new Date(sql.date),
				_homeTeam: homeTeam,
				_awayTeam: awayTeam,
				homePoints: sql.home_points,
				awayPoints: sql.away_points,
				neutralGround: sql.neutral_ground == 1,
				rflFixtureId: null
			});
			await newEntry.save();

			//Add new newEntry to idLink document
			await new IdLink({
				_id: newEntry._id,
				sqlId: sql.id,
				collectionName
			}).save();
		});
		res.send({});
	});

	app.delete("/api/neutralGames", async (req, res) => {
		await IdLink.remove({ collectionName });
		res.send({});
	});
};
