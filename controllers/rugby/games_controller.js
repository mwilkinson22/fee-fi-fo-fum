const mongoose = require("mongoose");
const Game = mongoose.model("games");

function buildQuery(params) {
	const query = {};
	if (params.year) {
		//Only fired for "results"
		const year = Number(params.year);
		const latestDate = Math.min(new Date(`${year + 1}-01-01`), new Date());
		query.date = {
			$gte: new Date(`${year}-01-01`),
			$lt: latestDate
		};
	}

	if (params.opposition && params.opposition !== null) {
		query._opposition = params.opposition;
	}

	if (params.venue && params.venue !== null) {
		query.isAway = params.venue === "a";
	}
	console.log(params);
	console.log(query);

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
		const { year } = req.params;

		const query = buildQuery({ ...req.query, year });
		const games = await Game.find(query)
			.sort({ date: -1 })
			.populate("_ground")
			.populate("_opposition");
		res.send(games);
	},

	async getYearsWithResults(req, res) {
		const years = await Game.aggregate([
			{ $sort: { date: 1 } },
			{ $match: { date: { $lt: new Date() } } },
			{ $group: { _id: { $year: "$date" } } }
		]);
		res.send(years.map(year => year._id));
	},

	async getFilters(req, res) {
		const { year } = req.params;

		const competitions = {
			1: "Super League",
			2: "Challenge Cup",
			3: "Friendlies"
		};
		const opposition = {
			"5c041478e2b66153542b373e": "Salford",
			"5c041478e2b66153542b3746": "Wigan"
		};
		const venue = {
			h: "Home",
			a: "Away"
		};
		res.send({
			competitions,
			opposition,
			venue
		});
	}
};
