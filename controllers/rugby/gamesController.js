const _ = require("lodash");
const mongoose = require("mongoose");
const Game = mongoose.model("games");
const {
	getBasicGameData,
	getCompetitionInfo,
	exportBasicInfoOnly
} = require("../../pipelines/rugby/gamesPipelines");
const { ObjectId } = require("mongodb");

function buildQuery(params) {
	const query = {};
	if (params.year) {
		//Only fired for "results"
		const year = Number(params.year);
		const now = new Date();
		const endOfYear = new Date(`${year + 1}-01-01`);
		const latestDate = now < endOfYear ? now : endOfYear;
		query.date = {
			$gte: new Date(`${year}-01-01`),
			$lt: latestDate
		};
	}

	if (params.opposition) {
		query._opposition = ObjectId(params.opposition);
	}

	if (params.venue) {
		query.isAway = params.venue === "a";
	}

	if (params.competitions) {
		query._competition = ObjectId(params.competitions);
	}

	return query;
}

module.exports = {
	async getFixtures(req, res) {
		const query = {
			date: { $gt: new Date() },
			...buildQuery(req.query)
		};

		const games = await Game.aggregate(
			_.concat(
				[
					{ $match: query },
					{
						$sort: {
							date: 1
						}
					}
				],
				getBasicGameData,
				exportBasicInfoOnly
			)
		);
		res.send(games);
	},

	async getResults(req, res) {
		const { year } = req.params;
		const query = buildQuery({ ...req.query, year });
		const games = await Game.aggregate(
			_.concat(
				[
					{ $match: query },
					{
						$sort: {
							date: -1
						}
					}
				],
				getBasicGameData,
				exportBasicInfoOnly
			)
		);
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
		const competitions = await Game.aggregate(
			_.concat(
				[{ $match: query }],
				getCompetitionInfo,

				[
					{
						$group: {
							_id: "$_competition._id",
							name: { $first: "$_competition.name" }
						}
					},
					{
						$sort: {
							name: 1
						}
					}
				]
			)
		);

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

		const venue = await Game.aggregate([
			{ $match: query },
			{
				$project: {
					_id: {
						$cond: {
							if: "$isAway",
							then: "a",
							else: "h"
						}
					},
					name: {
						$cond: {
							if: "$isAway",
							then: "Away",
							else: "Home"
						}
					}
				}
			},
			{
				$group: { _id: "$_id", name: { $first: "$name" } }
			},
			{
				$sort: {
					name: -1
				}
			}
		]);
		res.send({
			competitions,
			opposition,
			venue
		});
	}
};
