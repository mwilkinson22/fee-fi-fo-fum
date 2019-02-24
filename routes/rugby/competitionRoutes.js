const mongoose = require("mongoose");

//Models
const Competition = mongoose.model("competitions");

module.exports = app => {
	app.get("/api/competitions", async (req, res) => {
		const competitions = await Competition.find({});
		res.send(competitions);
	});
};
