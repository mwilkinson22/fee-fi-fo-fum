const _ = require("lodash");
const mongoose = require("mongoose");
const Competition = mongoose.model("competitions");
const IdLink = mongoose.model("IdLinks");
const collectionName = "competitions";

function getCompetitionType(num) {
	switch (Number(num)) {
		case 1:
			return "League";
		case 2:
			return "Cup";
		case 3:
			return "Friendly";
	}
}

module.exports = app => {
	app.post("/api/competitions", async (req, res) => {
		await _.each(req.body, async sql => {
			//Create Competitions
			const newEntry = new Competition({
				type: sql.type,
				name: sql.name,
				playerLimit: sql.player_limit
			});
			await newEntry.save();

			//Add new grounds to idLink document
			await new IdLink({
				_id: newEntry._id,
				sqlId: sql.id,
				collectionName
			}).save();
		});
		res.send({});
	});

	app.post("/api/competitions/segments", async (req, res) => {
		await _.each(req.body, async sql => {
			//Get Parent Comp Id
			const competitionId = await IdLink.convertId(
				sql.comp_type,
				"competitions"
			);

			//Create Competitions
			const competition = await Competition.findOne({
				_id: competitionId
			});

			//Manually create segment ID
			const segmentId = mongoose.Types.ObjectId();

			await competition.segments.push({
				_id: segmentId,
				type: getCompetitionType(sql.type),
				name: sql.name,
				hashtagPrefix: sql.hashtag,
				appendCompetitionName: sql.name_in_title == 1,
				_pointsCarriedFrom: null //It's easier to manually add the one case where this currently happens
			});

			await competition.save();

			//Add new entries to idLink document
			await new IdLink({
				_id: segmentId,
				sqlId: sql.id,
				collectionName: "competitionSegments"
			}).save();
		});
		res.send({});
	});

	app.delete("/api/competitions", async (req, res) => {
		await IdLink.remove({ collectionName });
		res.send({});
	});

	app.delete("/api/competitions", async (req, res) => {
		await IdLink.remove({ collectionName });
		res.send({});
	});
};
