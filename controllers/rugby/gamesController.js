const _ = require("lodash");
const mongoose = require("mongoose");
const Game = mongoose.model("games");
const {
	getBasicGameData,
	getFullGame,
	projections
} = require("../../pipelines/rugby/gamesPipelines");
const { ObjectId } = require("mongodb");

async function aggregateForList(initialPipelines) {
	const games = await Game.aggregate(
		_.concat(initialPipelines, getBasicGameData, { $project: projections.basic })
	);
	return _.map(games, game => getScores(game));
}

function getScores(game) {
	const gameDate = Date.parse(new Date(game.date));

	if (gameDate <= new Date()) {
		game.scores = _.chain(game.playerStats)
			.groupBy("_team")
			.mapValues(team => {
				return _.sumBy(team, statList => {
					const { T, CN, PK, DG } = statList.stats;
					return T * 4 + CN * 2 + PK * 2 + DG;
				});
			})
			.value();
	}
	return game;
}

module.exports = {
	async getItemBySlug(req, res) {
		const { slug } = req.params;
		const game = await Game.aggregate(_.concat([{ $match: { slug } }], getFullGame));

		res.send(getScores(game[0]));
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
	}
};
