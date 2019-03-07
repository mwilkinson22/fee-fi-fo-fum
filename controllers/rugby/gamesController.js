import HomePage from "../../client/pages/HomePage";

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
const { localTeam } = require("../../config/keys");

async function aggregateForList(initialPipelines) {
	const games = await Game.aggregate(
		_.concat(initialPipelines, getBasicGameData, { $project: projections.basic })
	);
	return _.map(games, game => getVirtuals(game));
}

async function processBasics(values) {
	//Combine datetime
	values.date += ` ${values.time}`;
	delete values.time;

	//Pull select values
	const selectable = [
		"_teamType",
		"_competition",
		"_opposition",
		"_ground",
		"_referee",
		"_video_referee"
	];
	_.each(selectable, prop => (values[prop] ? (values[prop] = values[prop].value) : null));

	//Get Null values
	const nullable = ["hashtags", "round", "title", "tv", "_referee", "_video_referee"];
	_.each(nullable, prop => (values[prop] === "" ? (values[prop] = null) : null));

	//Split Hashtags
	if (values.hashtags) {
		values.hashtags = values.hashtags.match(/[A-Za-z0-9]+/gi);
	}

	//Sort ground
	if (values._ground === "auto") {
		const Team = mongoose.model("teams");
		const homeTeam = await Team.findById(
			values.isAway === "true" ? values._opposition : localTeam
		);
		values._ground = homeTeam._ground;
	}

	return values;
}

function getVirtuals(game) {
	//Get status
	const { pregameSquads, playerStats } = game;
	if (!pregameSquads || pregameSquads.length < 2) {
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

async function getItemBySlug(req, res) {
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
}

module.exports = {
	getVirtuals,
	getItemBySlug,
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
	},
	async updateGameBasics(req, res) {
		const { _id } = req.params;
		const game = await Game.findById(_id);
		if (!game) {
			res.status(500).send(`No game with id ${_id} was found`);
		} else {
			const values = await processBasics(req.body);

			await Game.updateOne({ _id }, values);

			//Reload Game
			getItemBySlug({ params: { slug: game.slug } }, res);
		}
	},
	async setPregameSquads(req, res) {
		const { _id } = req.params;
		const game = await Game.findById(_id);
		if (!game) {
			res.status(500).send(`No game with id ${_id} was found`);
		} else {
			game.pregameSquads = _.chain(req.body)
				.map((squad, _team) => {
					if (squad.length) {
						return {
							_team,
							squad
						};
					} else {
						return null;
					}
				})
				.filter(_.identity)
				.value();

			await game.save();

			getItemBySlug({ params: { slug: game.slug } }, res);
		}
	}
};
