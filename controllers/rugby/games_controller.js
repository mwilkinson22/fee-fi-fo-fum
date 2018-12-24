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

	if (params.opposition) {
		query._opposition = params.opposition;
	}

	if (params.venue) {
		query.isAway = params.venue === "a";
	}

	if (params.competitions) {
		query._competition = params.competitions;
	}

	return query;
}

async function getGameList(query, sort, res) {
	const games = await Game.find(query, {
		_id: 1,
		_opposition: 1,
		_ground: 1,
		_competition: 1,
		round: 1,
		isAway: 1,
		date: 1,
		slug: 1,
		title: 1,
		generatedTitle: 1,
		year: 1
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
		})
		.populate({
			path: "_competition",
			select: [
				"name",
				"_parentCompetition",
				"appendCompetitionName",
				"frontendTitle",
				"instances.year",
				"instances.sponsor"
			],
			populate: {
				path: "_parentCompetition"
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

		//Create query
		const query = {};
		if (year === "fixtures") {
			query.date = {
				$gte: new Date()
			};
		} else {
			query.date = {
				$gte: new Date(year + "-01-01"),
				$lt: new Date(Number(year) + 1 + "-01-01")
			};
		}

		//Get competitions
		const competitions = await Game.aggregate([
			{ $match: query },
			{
				$lookup: {
					from: "competitionsegments",
					localField: "_competition",
					foreignField: "_id",
					as: "_competition"
				}
			},
			{
				$unwind: "$_competition"
			},
			{
				$lookup: {
					from: "competitions",
					localField: "_competition._parentCompetition",
					foreignField: "_id",
					as: "_parentCompetition"
				}
			},
			{
				$unwind: "$_parentCompetition"
			},
			{
				$project: {
					name: {
						$cond: {
							if: "$_competition.appendCompetitionName",
							then: {
								$concat: ["$_parentCompetition.name", " ", "$_competition.name"]
							},
							else: "$_parentCompetition.name"
						}
					},
					_id: "$_competition._id"
				}
			},
			{
				$group: {
					_id: "$_id",
					name: { $first: "$name" }
				}
			},
			{
				$sort: {
					name: 1
				}
			}
		]);

		//Get Opposition
		const opposition = await Game.aggregate([
			{ $match: query },
			{
				$lookup: {
					from: "teams",
					localField: "_opposition",
					foreignField: "_id",
					as: "_opposition"
				}
			},
			{ $group: { _id: "$_opposition._id", name: { $first: "$_opposition.name.long" } } },
			{ $sort: { name: 1 } }
		]);
		const venue = [{ _id: "h", name: "home" }, { _id: "a", name: "away" }];
		res.send({
			competitions,
			opposition,
			venue
		});
	}
};
