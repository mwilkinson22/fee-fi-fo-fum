//Mongoose
import mongoose from "mongoose";
const collectionName = "games";
const Game = mongoose.model(collectionName);

//Modules
import _ from "lodash";
import { getListsAndSlugs } from "../genericController";

//Config
const { localTeam } = require("../../config/keys");

//Getters
export async function getList(req, res) {
	const games = await Game.find({}, "date _teamType slug").lean();

	const { list, slugMap } = await getListsAndSlugs(games, collectionName);
	res.send({ gameList: list, slugMap });
}

export async function getGames(req, res) {
	const { ids } = req.params;
	const games = await Game.find({
		_id: {
			$in: ids.split(",")
		}
	})
		.populate({
			path: "_opposition",
			select: "name colours hashtagPrefix image"
		})
		.populate({
			path: "_ground",
			populate: {
				path: "address._city"
			}
		})
		.populate({
			path: "_competition",
			select: "name _parentCompetition appendCompetitionName instances instance",
			populate: {
				path: "_parentCompetition",
				select: "name"
			}
		});

	//Purge instances, use instance key instead

	games.map(game => {
		const year = new Date(game.date).getFullYear();
		game.instance = game._competition.instances.filter(
			instance => instance.year === null || instance.year == year
		)[0];
	});

	res.send(_.keyBy(games, "_id"));
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
/*

async function aggregateForList(initialPipelines) {
	const games = await Game.aggregate(
		_.concat(initialPipelines, getBasicGameData, { $project: projections.basic })
	);
	return _.map(games, game => getVirtuals(game));
}

export function getVirtuals(game) {
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

export async function getItemBySlug(req, res) {
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

export async function getGames(req, res) {
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
}

export async function getLists(req, res) {
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
}

export async function getFrontpageGames(req, res) {
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
*/

//Setters
export async function updateGameBasics(req, res) {
	const { _id } = req.params;
	const game = await Game.findById(_id);
	if (!game) {
		res.status(500).send(`No game with id ${_id} was found`);
	} else {
		const values = await processBasics(req.body);

		await Game.updateOne({ _id }, values);

		res.send(game);
	}
}
export async function setPregameSquads(req, res) {
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

		res.send(game);
	}
}
