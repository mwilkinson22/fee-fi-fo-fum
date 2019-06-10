import * as competitionController from "../../controllers/rugby/competitionController";

module.exports = app => {
	app.get("/api/competitions/pregame", async (req, res) => {
		const mongoose = require("mongoose");
		const Competition = mongoose.model("competitionSegments");
		await Competition.updateMany(
			{
				"instances.usesPregameSquads": null
			},
			{
				$set: {
					"instances.$[instances.usersPregameSquads].usesPregameSquads": true
				}
			},
			{ multi: true, $multi: true, arrayFilters: [{ "instances.usesPregameSquads": null }] }
		);

		res.send({});
	});
	app.get("/api/competitions/segments", competitionController.getSegments);
	app.get("/api/competitions", competitionController.getCompetitions);
};
