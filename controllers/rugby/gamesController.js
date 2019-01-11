const _ = require("lodash");
const mongoose = require("mongoose");
const Game = mongoose.model("games");
const {
	getBasicGameData,
	getCompetitionInfo,
	projections
} = require("../../pipelines/rugby/gamesPipelines");
const { ObjectId } = require("mongodb");
const { earliestGiantsData } = require("../../config/keys");

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

async function aggregateForList(initialPipelines) {
	const games = await Game.aggregate(
		_.concat(initialPipelines, getBasicGameData, { $project: projections.basic })
	);

	return games;
}

module.exports = {
	async getFixtures(req, res) {
		const query = {
			date: { $gt: new Date() },
			...buildQuery(req.query)
		};
		const games = await aggregateForList([
			{ $match: query },
			{
				$sort: {
					date: 1
				}
			}
		]);
		res.send(games);
	},

	async getResults(req, res) {
		const { year } = req.params;
		const query = buildQuery({ ...req.query, year });
		const games = await aggregateForList([
			{ $match: query },
			{
				$sort: {
					date: -1
				}
			}
		]);
		res.send(games);
	},

	async getGames(req, res) {
		const { year, teamType } = req.params;
		const query = {};
		const sort = {};
		const now = new Date();

		//Get Games
		if (year === "fixtures") {
			query.date = {
				$gt: now
			};
			sort.date = 1;
		} else {
			const endOfYear = new Date(`${Number(year) + 1}-01-01`);
			const latestDate = now < endOfYear ? now : endOfYear;

			query.date = {
				$gte: new Date(`${year}-01-01`),
				$lt: latestDate
			};
			sort.date = -1;
		}

		const games = await aggregateForList([
			{
				$match: query
			},
			{
				$sort: sort
			},
			{
				$lookup: {
					from: "teamtypes",
					localField: "_teamType",
					foreignField: "_id",
					as: "_teamType"
				}
			},
			{
				$unwind: "$_teamType"
			},
			{
				$addFields: {
					_teamType: "$_teamType.slug"
				}
			},
			{
				$match: {
					_teamType: teamType
				}
			}
		]);

		res.send({ year, teamType, games });
	},

	async getLists(req, res) {
		const now = new Date();
		const aggregation = [
			{
				$lookup: {
					from: "teamtypes",
					localField: "_teamType",
					foreignField: "_id",
					as: "teamTypes"
				}
			},
			{
				$unwind: "$teamTypes"
			},
			{
				$group: {
					_id: {
						$year: "$date"
					},
					teamTypes: {
						$addToSet: "$teamTypes"
					}
				}
			}
		];
		const results = await Game.aggregate(
			_.concat(
				[
					{
						$match: {
							date: {
								$lt: now
							}
						}
					},
					{
						$sort: {
							date: 1
						}
					}
				],
				aggregation
			)
		);
		const fixtures = await Game.aggregate(
			_.concat(
				[
					{
						$match: {
							date: {
								$gte: now
							}
						}
					}
				],
				aggregation,
				{
					$project: {
						_id: "fixtures",
						teamTypes: 1
					}
				}
			)
		);

		const games = _.chain(fixtures)
			.concat(results)
			.keyBy("_id")
			.mapValues(group => _.keyBy(group.teamTypes, "slug"))
			.value();

		res.send(games);
	},

	async getGamesByYear(req, res) {
		const { year } = req.params;
		let games;
		if (year === "fixtures") {
			games = await aggregateForList([
				{
					$match: {
						date: { $gt: new Date() }
					}
				},
				{
					$sort: {
						date: -1
					}
				}
			]);
		} else {
			const yearAsNumber = Number(year);
			const now = new Date();
			const endOfYear = new Date(`${yearAsNumber + 1}-01-01`);
			const latestDate = now < endOfYear ? now : endOfYear;
			games = await aggregateForList([
				{
					$match: {
						date: {
							$gte: new Date(`${yearAsNumber}-01-01`),
							$lt: latestDate
						}
					}
				},
				{
					$sort: {
						date: 1
					}
				}
			]);
		}

		res.send({ year, games });
	},

	async getFrontpageGames(req, res) {
		const lastGame = await Game.findOne({}, "_id")
			.getFixtures(false)
			.sort({ date: -1 });
		const nextGame = await Game.findOne({}, "isAway")
			.getFixtures(true)
			.sort({ date: 1 });
		const games = [lastGame, nextGame];
		if (nextGame.isAway) {
			const nextHomeGame = await Game.findOne({ isAway: false }, "_id")
				.getFixtures(true)
				.sort({ date: 1 });
			games.push(nextHomeGame);
		}
		const gameIds = [];
		for (const game of games) {
			if (game && game._id) {
				gameIds.push(ObjectId(game._id));
			}
		}

		const results = await aggregateForList([
			{
				$match: {
					_id: {
						$in: gameIds
					}
				}
			},
			{
				$sort: {
					date: 1
				}
			}
		]);

		res.send(results);
	},

	async getYearsWithResults(req, res) {
		const years = await Game.aggregate([
			{ $sort: { date: 1 } },
			{
				$match: {
					$and: [
						{ date: { $lt: new Date() } },
						{ date: { $gte: new Date(`${earliestGiantsData}-01-01`) } }
					]
				}
			},
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
