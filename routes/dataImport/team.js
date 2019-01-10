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
						pattern: null //legacy data here is pretty much broken. Better to build a GUI and manually update squads
					}
				]
			});

			await team.save();

			//Add new squads to idLink document
			await new IdLink({
				_id: team._id,
				sqlId: sql.id,
				collectionName
			}).save();
		});
		res.send({});
	});

	app.post("/api/teams/squadnumbers", async (req, res) => {
		await _.each(req.body, async obj => {
			const teamId = await IdLink.convertId(obj.team, "teams");
			const team = await Team.findById(teamId);
			if (!team.squads) team.squads = [];

			const players = [];
			for (const p of obj.players) {
				const { from, to, number, onLoan, friendlyOnly } = await p;
				const newObj = await { from, to, number, onLoan, friendlyOnly };
				const playerId = await IdLink.convertId(p.player, "people");
				newObj._player = await playerId;
				await players.push(newObj);
			}
			await team.squads.push({
				year: obj.year,
				players
			});
			await team.save();
		});
		res.send({});
	});

	app.delete("/api/teams/squadnumbers", async (req, res) => {
		await Team.update({}, { squads: [] }, { multi: true });
		res.send({});
	});
	app.delete("/api/teams", async (req, res) => {
		await IdLink.remove({ collectionName });
		res.send({});
	});
};
