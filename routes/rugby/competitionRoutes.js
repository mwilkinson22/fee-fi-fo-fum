const mongoose = require("mongoose");

//Models
const Competition = mongoose.model("competitions");
const CompetitionSegment = mongoose.model("competitionSegments");

module.exports = app => {
	app.get("/api/competitions/segments", async (req, res) => {
		const competitions = await CompetitionSegment.find({}).populate("_parentCompetition");
		res.send(competitions);
	});
	app.get("/api/competitions", async (req, res) => {
		const competitions = await Competition.find({});
		res.send(competitions);
	});
};
