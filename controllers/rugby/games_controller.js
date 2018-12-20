const _ = require("lodash");
const mongoose = require("mongoose");
const Game = mongoose.model("games");
const Team = mongoose.model("teams");

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

	return query;
}

async function getGameList(query, sort, res) {
	const games = await Game.find(query, {
		_id: 1,
		_opposition: 1,
		_ground: 1,
		_competition: 1,
		isAway: 1,
		date: 1,
		slug: 1
	})
		.sort(sort)
		.populate({
			path: "_opposition",
			select: ["name", "colours", "image"]
		})
		.populate({
			path: "_ground",
			select: ["name", "address", "image"],
			populate: {
				path: "address._city"
			}
		});
	res.send(games);
}

module.exports = {
	async getFixtures(req, res) {
		const query = {
			date: { $gt: new Date() },
			...buildQuery(req.query)
		};
		getGameList(query, { date: 1 }, res);
	},

	async getResults(req, res) {
		const { year } = req.params;
		const query = buildQuery({ ...req.query, year });
		getGameList(query, { date: -1 }, res);
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

		//Get Teams
		const teamQuery = {};
		if (year === "fixtures") {
			teamQuery.date = {
				$gte: new Date()
			};
		} else {
			teamQuery.date = {
				$gte: new Date(year + "-01-01"),
				$lt: new Date(Number(year) + 1 + "-01-01")
			};
		}
		const teamIds = await Game.find(teamQuery).distinct("_opposition");
		const opposition = await Team.find({ _id: { $in: teamIds } }, { "name.long": 1 }).sort({
			"name.long": 1
		});

		const competitions = {
			1: "Super League",
			2: "Challenge Cup",
			3: "Friendlies"
		};
		const venue = {
			h: "Home",
			a: "Away"
		};
		res.send({
			competitions,
			opposition: _.mapValues(_.keyBy(opposition, "_id"), "name.long"),
			venue
		});
	}
};
