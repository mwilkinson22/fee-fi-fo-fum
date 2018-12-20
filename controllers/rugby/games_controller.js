const mongoose = require("mongoose");
const Game = mongoose.model("games");

function buildQuery(params) {
	const query = {};
	if (params.year) {
		const year = Number(params.year);
		query.date = {
			$gte: new Date(`${year}-01-01`),
			$lt: new Date(`${year + 1}-01-01`)
		};
	}

	return query;
}

module.exports = {
	async getFixtures(req, res) {
		const games = await Game.find({
			date: { $gt: new Date() },
			...buildQuery(req.query)
		})
			.sort({ date: 1 })
			.populate("_ground")
			.populate("_opposition");
		res.send(games);
	},

	async getResults(req, res) {
		const year = req.params.year;
		const query = buildQuery({ ...req.query, year });
		const games = await Game.find(query)
			.sort({ date: -1 })
			.populate("_ground")
			.populate("_opposition");
		res.send(games);
	}
};
