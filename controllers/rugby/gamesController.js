const _ = require("lodash");
const mongoose = require("mongoose");
const collectionName = "games";
const Game = mongoose.model(collectionName);
const SlugRedirect = mongoose.model("slugRedirect");
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
	return _.map(games, game => getVirtuals(game));
}

function getVirtuals(game) {
	//Get status
	const { pregameSquads, playerStats } = game;
	if (Object.keys(_.pickBy(pregameSquads)).length < 2) {
		game.status = 0;
	} else if (Object.keys(_.groupBy(playerStats, "_team")).length < 2) {
		game.status = 1;
	} else if (!_.sumBy(playerStats, "stats.TK")) {
		game.status = 2;
	} else {
		game.status = 3;
	}

	//Get Scores
	const gameDate = Date.parse(new Date(game.date));
	if (gameDate <= new Date() && game.playerStats.length > 0) {
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
	getVirtuals,
	async getItemBySlug(req, res) {
		const { slug } = req.params;
		let game = await Game.aggregate(_.concat([{ $match: { slug } }], getFullGame));

		if (game.length) {
			res.send(getVirtuals(game[0]));
		} else {
			//Check for a redirect
			const slugRedirect = await SlugRedirect.findOne({ collectionName, oldSlug: slug });
			if (slugRedirect) {
				game = await Game.findById(slugRedirect.itemId, { slug: 1 });
				res.status(308).send(game);
			} else {
				res.status(404).send({});
			}
		}
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
