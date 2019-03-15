const competitionController = require("../../controllers/rugby/competitionController");

module.exports = app => {
	app.get("/api/competitions/segments", competitionController.getSegments);
	app.get("/api/competitions", competitionController.getCompetitions);
};
