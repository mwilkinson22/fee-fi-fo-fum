const _ = require("lodash");
const mongoose = require("mongoose");
const Team = mongoose.model("teams");
const IdLink = mongoose.model("IdLinks");
const collectionName = "teams";

function colourToArray(str) {
	if (str) return str.split(",").map(num => Number(num));
	return null;
}

module.exports = app => {
	app.post("/api/teams", async (req, res) => {
		await _.each(req.body, async sql => {
			//Get Homeground
			const groundId = sql.homeground
				? await IdLink.convertId(sql.homeground, "grounds")
				: null;

			//Create Ground
			const team = new Team({
				name: {
					long: sql.fullname,
					short: sql.name
				},
				nickname: sql.nickname,
				_ground: groundId,
				hashtagPrefix: sql.hashtag,
				colours: {
					main: colourToArray(sql.main_colour),
					trim1: colourToArray(sql.trim_colour1),
					trim2: colourToArray(sql.trim_colour2),
					text: colourToArray(sql.text_colour),
					pitchColour: colourToArray(sql.pitch_colour),
					statBarColour: colourToArray(sql.stat_bar_colour)
				},
				shirt: [
					{
						year: 2017,
						colour: colourToArray(sql.shirt_colour),
						sleeveTrim: colourToArray(sql.shirt_sleeve),
						collarTrim: colourToArray(sql.shirt_collar),
						pattern: null //legacy data here is pretty much broken. Better to build a GUI and manually update teams
					}
				]
			});

			await team.save();

			//Add new teams to idLink document
			await new IdLink({
				_id: team._id,
				sqlId: sql.id,
				collectionName
			}).save();
		});
		res.send({});
	});

	app.delete("/api/teams", async (req, res) => {
		await IdLink.remove({ collectionName });
		res.send({});
	});
};
