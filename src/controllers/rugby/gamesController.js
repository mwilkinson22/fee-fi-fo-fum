//Mongoose
import mongoose from "mongoose";
const collectionName = "games";
const Game = mongoose.model(collectionName);
const NeutralGame = mongoose.model("neutralGames");
const Team = mongoose.model("teams");
const TeamType = mongoose.model("teamTypes");
const SlugRedirect = mongoose.model("slugRedirect");

//Modules
import _ from "lodash";
const ics = require("ics");
import twitter from "~/services/twitter";

//Constants
const { fansCanAttend, localTeam } = require("~/config/keys");
import gameEvents from "~/constants/gameEvents";

//Helpers
import { getMainTeamType } from "~/controllers/rugby/teamsController";
import { postToSocial } from "../oAuthController";
import { getUpdatedNeutralGames } from "./neutralGamesController";
import { getIdFromSlug } from "~/helpers/routeHelperSERVER";

import {
	parseExternalGame,
	convertGameToCalendarString,
	calendarStringOptions,
	formatDate
} from "~/helpers/gameHelper";
import { uploadBase64ImageToGoogle } from "~/helpers/fileHelper";

//Images
import GameSocialCardImage from "~/images/GameSocialCardImage";
import PregameImage from "~/images/PregameImage";
import FixtureListImage from "~/images/FixtureListImage";
import SquadImage from "~/images/SquadImage";
import GameEventImage from "~/images/GameEventImage";
import PersonImageCard from "~/images/PersonImageCard";
import TeamStatsImage from "~/images/TeamStatsImage";
import MultiplePlayerStats from "~/images/MultiplePlayerStats";
import LeagueTable from "~/images/LeagueTable";
import MinMaxLeagueTable from "~/images/MinMaxLeagueTable";

//Utility Functions
async function validateGame(_id, res, promise = null) {
	//This allows us to populate specific fields if necessary
	const game = await (promise || Game.findById(_id));
	if (game) {
		return game;
	} else {
		res.status(404).send(`No game found with id ${_id}`);
		return false;
	}
}

async function processGround(values) {
	//Sort ground, when the value is set to "auto"
	if (values._ground === "auto") {
		const Team = mongoose.model("teams");
		const homeTeamId =
			values.isAway === "true" || values.isAway === true ? values._opposition : localTeam;
		const homeTeam = await Team.findById(homeTeamId, "_defaultGround _grounds").lean();
		let ground = homeTeam._grounds.find(g => g._teamType == values._teamType);
		values._ground = ground ? ground._ground : homeTeam._defaultGround;
	}

	return values;
}

async function checkFanPotmVote(req, _id) {
	const game = await Game.findById(_id, "fan_potm");

	if (!game.fan_potm || !game.fan_potm.votes) {
		return null;
	}

	const { ipAddress, session } = req;

	return game.fan_potm.votes.find(v => v.ip == ipAddress || v.session == session.id);
}

export async function getExtraGameInfo(games, forGamePage, forAdmin) {
	//Convert to JSON and fix scoreOverride and fan_potm.votes
	games = games.map(g => {
		const game = JSON.parse(JSON.stringify(g));
		if (game.scoreOverride && game.scoreOverride.length) {
			game.scoreOverride = _.chain(game.scoreOverride)
				.keyBy("_team")
				.mapValues("points")
				.value();
		}

		//Convert fan_potm votes to simple count
		if (game.fan_potm && game.fan_potm.votes && game.fan_potm.votes.length) {
			game.fan_potm.votes = _.chain(game.fan_potm.votes)
				.groupBy("choice")
				.mapValues("length")
				.value();
		}

		return game;
	});

	if (!forGamePage) {
		//We load pregame squads on the server to properly calculate status.
		//For a "basic" load, we remove it here
		for (const game of games) {
			delete game.pregameSquads;
		}

		return games;
	}

	//Get all team types
	let teamTypes;
	const TeamType = mongoose.model("teamTypes");
	const results = await TeamType.find({}, "_id gender");
	teamTypes = _.keyBy(results, "_id");

	//Loop each game
	const processedGames = [];
	for (const g of games) {
		const game = JSON.parse(JSON.stringify(g));

		//Get gendered term for _____ of steel, of the match, etc
		game.gender = teamTypes[game._teamType].gender;
		game.genderedString = game.gender === "M" ? "Man" : "Woman";

		//Get all eligible players and coaches
		await getPlayersAndCoaches(game, forAdmin, teamTypes);

		//Work out which players to highlight in the pregame squad
		//First, check that the game actually uses them and that we need he inf
		if (game._competition.instance.usesPregameSquads && (game.status === 1 || forAdmin)) {
			//Get last game
			const date = new Date(game.date);
			const lastGame = await Game.findOne(
				{
					date: {
						$lt: date,
						$gt: `${date.getFullYear()}-01-01`
					},
					_teamType: game._teamType
				},
				"pregameSquads"
			)
				.lean()
				.sort({ date: -1 });
			if (lastGame) {
				const lastPregame =
					lastGame.pregameSquads &&
					lastGame.pregameSquads.find(({ _team }) => _team == localTeam);

				if (lastPregame) {
					game.previousPregameSquad = lastPregame.squad;
				}
			}
		}

		//Calculate the team form
		const allCompetitions = await getTeamForm(game, 5, true);
		const singleCompetition = await getTeamForm(game, 5, false);
		game.teamForm = { allCompetitions, singleCompetition };

		//Add variables to help govern reloading
		game.pageData = true;
		game.adminData = forAdmin;

		processedGames.push(game);
	}

	return processedGames;
}

async function getPlayersAndCoaches(game, forAdmin, teamTypes) {
	const { ObjectId } = mongoose.Types;

	//Get Teams
	const teamIds = [localTeam, game._opposition._id];

	//Add shared squads if necessary
	if (game.sharedSquads) {
		const teamsToAdd = _.flatten(_.values(game.sharedSquads));
		teamIds.push(...teamsToAdd);
	}

	//Create date object
	const date = new Date(game.date);

	//Conditionally work out teamTypes to include
	let teamTypesToInclude = [game._teamType];
	if (game._competition._parentCompetition.useAllSquads) {
		const { gender } = teamTypes[game._teamType];
		teamTypesToInclude = _.filter(teamTypes, t => t.gender == gender).map(t => t._id);
	}

	//Conditionally filter players by ID
	let playersToInclude;
	if (!forAdmin) {
		//If game.status === 0, then we're expecting a pregame squad but don't have it yet.
		if (game.status === 0) {
			playersToInclude = [];
		} else {
			//If the comp uses pregame squads and we're past status 0,
			//then we have pregame squads to add.
			//We include the pregame squads in news previews so we need these players
			//even once we hit status 2 & 3
			if (game._competition.instance.usesPregameSquads) {
				const { pregameSquads } = game;
				if (pregameSquads && pregameSquads.length) {
					playersToInclude = _.flatten(pregameSquads.map(s => s.squad));
				}
			}

			//This means we have playerStats entries. Add those to the list
			if (game.status > 1) {
				//Ensure the array is initialised
				if (!playersToInclude) {
					playersToInclude = [];
				}

				const playersInSquads = game.playerStats.map(p => p._player);
				playersToInclude.push(...playersInSquads);
			}
		}

		//Finally, format the ids properly
		if (playersToInclude) {
			playersToInclude = _.uniq(playersToInclude).map(id => ObjectId(id));
		}
	}

	//Handle squad, coach and player filters
	//If we have no players to limit, playerFilter remains an empty array, and
	//the mongodb $and operator will return true - i.e. there will be no filtering
	const squadFilter = [
		{
			$eq: ["$$squad.year", date.getFullYear()]
		},
		{
			$in: ["$$squad._teamType", teamTypesToInclude.map(id => ObjectId(id))]
		}
	];
	const coachFilter = [
		{
			$eq: ["$$coach._teamType", ObjectId(game._teamType)]
		},
		{
			$lte: ["$$coach.from", date]
		},
		{
			$or: [
				{
					$eq: ["$$coach.to", null]
				},
				{
					$gte: ["$$coach.to", date]
				}
			]
		}
	];
	const playerFilter = [];
	if (playersToInclude) {
		playerFilter.push({ $in: ["$$p._player", playersToInclude] });
	}

	//Work out projection fields for players
	const playerProjection = {
		_id: 1,
		name: 1,
		nickname: 1,
		images: {
			main: 1,
			player: 1
		},
		slug: 1,
		gender: 1,
		playingPositions: 1
	};
	if (forAdmin) {
		Object.assign(playerProjection, {
			displayNicknameInCanvases: 1,
			squadNameWhenDuplicate: 1,
			_sponsor: 1,
			twitter: 1
		});
	}

	if (forAdmin) {
		let adminPlayerPopulate = {};
		adminPlayerPopulate.populate = {
			path: "_sponsor",
			select: "name twitter"
		};
	}

	const playersAndCoaches = await Team.aggregate([
		{
			$match: { _id: { $in: teamIds.map(id => ObjectId(id)) } }
		},
		//For each team, filter squads and coaches by the conditions declared above
		//
		//Coaches will always be filtered by team type and date.
		//
		//Squads will be filtered by year and team type
		{
			$project: {
				squads: {
					$filter: {
						input: "$squads",
						as: "squad",
						cond: {
							$and: squadFilter
						}
					}
				},
				coaches: {
					$filter: {
						input: "$coaches",
						as: "coach",
						cond: {
							$and: coachFilter
						}
					}
				}
			}
		},
		//Pull the players and unwind so we can have a single array
		{
			$addFields: {
				players: "$squads.players"
			}
		},
		{
			$unwind: {
				path: "$players",
				preserveNullAndEmptyArrays: true
			}
		},
		//Filter players by id
		{
			$addFields: {
				players: {
					$filter: {
						input: "$players",
						as: "p",
						cond: {
							$and: playerFilter
						}
					}
				}
			}
		},
		//Lookup the player data and save it to a "players" array
		{
			$lookup: {
				from: "people",
				localField: "players._player",
				foreignField: "_id",
				as: "playerInfo"
			}
		},
		//Lookup coach data and save it to a "coach_info" array
		{
			$lookup: {
				from: "people",
				localField: "coaches._person",
				foreignField: "_id",
				as: "coachInfo"
			}
		},
		//Reduce the playerInfo and coachInfo data to just the values we need
		{
			$project: {
				coaches: 1,
				players: 1,
				playerInfo: playerProjection,
				coachInfo: { name: 1, slug: 1, _id: 1 }
			}
		},
		//Merge the lookup data into the main arrays
		{
			$project: {
				players: {
					$map: {
						input: "$players",
						in: {
							$mergeObjects: [
								{ number: "$$this.number" },
								{
									$arrayElemAt: [
										"$playerInfo",
										{ $indexOfArray: ["$playerInfo._id", "$$this._player"] }
									]
								}
							]
						}
					}
				},
				coaches: {
					$map: {
						input: "$coaches",
						in: {
							$mergeObjects: [
								{ role: "$$this.role" },
								{
									$arrayElemAt: [
										"$coachInfo",
										{ $indexOfArray: ["$coachInfo._id", "$$this._person"] }
									]
								}
							]
						}
					}
				}
			}
		}
	]);

	game.eligiblePlayers = _.chain([localTeam, game._opposition._id])
		.map(teamId => {
			//Work out teams we need to pull players for
			const teams = [teamId];

			//Add shared squads
			if (game.sharedSquads && game.sharedSquads[teamId]) {
				teams.push(...game.sharedSquads[teamId]);
			}

			const players = _.chain(playersAndCoaches)
				.filter(({ _id }) => teams.find(t => t == _id))
				.map(s => s.players)
				.flatten()
				.filter(_.identity)
				.each(({ name }) => (name.full = `${name.first} ${name.last}`))
				.value();

			return [teamId, players];
		})
		.fromPairs()
		.value();

	game.coaches = _.chain([localTeam, game._opposition._id])
		.map(teamId => {
			const { coaches } = playersAndCoaches.find(({ _id }) => _id.toString() == teamId);
			coaches.forEach(({ name }) => (name.full = `${name.first} ${name.last}`));
			return [teamId, coaches];
		})
		.fromPairs()
		.value();

	return playersAndCoaches;
}

async function getTeamForm(game, gameLimit, allCompetitions) {
	const query = {
		_teamType: game._teamType,
		date: { $lt: game.date }
		// hideGame: { $in: [false, null] }
	};
	if (!allCompetitions) {
		query._competition = game._competition._id;
	}

	//First, we get the last five local games
	const localteamForm = await Game.find(query)
		.fullGame(false, false)
		.sort({ date: -1 })
		.limit(gameLimit);
	//Then the last five head to heads
	const headToHeadForm = await Game.find({ ...query, _opposition: game._opposition._id })
		.fullGame(false, false)
		.sort({ date: -1 })
		.limit(gameLimit);
	//And the last 5 neutral games for the opponent
	const neutralQuery = {
		_teamType: game._teamType,
		date: { $lt: game.date },
		$or: [{ _homeTeam: game._opposition._id }, { _awayTeam: game._opposition._id }]
	};

	//Pull the local team object
	const localTeamObject = await Team.findById(localTeam, "name images.main").lean();

	if (!allCompetitions) {
		neutralQuery._competition = game._competition._id;
	}
	const neutralGames = await NeutralGame.find(
		neutralQuery,
		"date _homeTeam _awayTeam homePoints awayPoints"
	)
		.sort({ date: -1 })
		.populate({ path: "_homeTeam", select: "name images.main" })
		.populate({ path: "_awayTeam", select: "name images.main" })
		.limit(gameLimit)
		.lean();

	//Convert the Game results to match the neutral format
	const localgamesNormalised = _.chain([localteamForm, headToHeadForm])
		.flatten()
		.uniqBy(g => g._id.toString())
		.map(({ _id, date, isAway, _opposition, score, slug, title }) => {
			const _homeTeam = isAway ? _opposition : localTeamObject;
			const _awayTeam = isAway ? localTeamObject : _opposition;
			let homePoints = null;
			let awayPoints = null;
			if (score) {
				homePoints = score[_homeTeam._id];
				awayPoints = score[_awayTeam._id];
			}
			return { homePoints, awayPoints, _homeTeam, _awayTeam, date, slug, title, _id };
		})
		.value();

	//And create one big array
	const allGames = _.chain([localgamesNormalised, neutralGames])
		.flatten()
		.map(g => ({
			...g,
			date: new Date(g.date)
		}))
		.orderBy("date", "desc")
		.value();

	//Define a helper function to get team-specific form and convert individual teams to
	//just "opposition"
	const formatTeamSpecificForm = (games, _team) => {
		return games
			.filter(g => [g._homeTeam._id.toString(), g._awayTeam._id.toString()].includes(_team))
			.map(g => {
				const { _homeTeam, _awayTeam, ...game } = g;
				let opposition, isAway;
				if (_homeTeam._id.toString() == _team) {
					isAway = false;
					opposition = _awayTeam;
				} else {
					isAway = true;
					opposition = _homeTeam;
				}
				return { ...game, opposition, isAway };
			})
			.slice(0, gameLimit);
	};

	//And finally, create separate local, opposition and h2h objects
	const local = formatTeamSpecificForm(allGames, localTeam);
	const opposition = formatTeamSpecificForm(allGames, game._opposition._id);
	const headToHead = allGames
		//We only need IDs here as we'll have all the team data preloaded on the frontend
		.map(g => {
			g._homeTeam = g._homeTeam._id.toString();
			g._awayTeam = g._awayTeam._id.toString();
			return g;
		})
		.filter(
			g =>
				[g._homeTeam, g._awayTeam].includes(localTeam) &&
				[g._homeTeam, g._awayTeam].includes(game._opposition._id)
		)
		.slice(0, gameLimit);
	return { local, opposition, headToHead };
}

async function getUpdatedGame(id, res, refreshSocialImage = false) {
	//Get Full Game
	let game = await Game.findById(id).fullGame(true, true);

	//This only gets called after an admin action, so it's safe to assume we want the full admin data
	game = await getExtraGameInfo([game], true, true);
	const fullGames = _.keyBy(game, "_id");

	//Get Game For List
	//Again, this is only called after an admin action so include hidden games
	const gameList = await processList(true);

	res.send({ id, fullGames, gameList });

	if (refreshSocialImage) {
		await updateSocialMediaCard(id);
	}
}

async function processList(userIsAdmin, query = {}) {
	if (!userIsAdmin) {
		query.hideGame = { $in: [false, null] };
	}
	const games = await Game.find(query)
		.forList()
		.lean();

	return _.keyBy(games, "_id");
}

//Getters
export async function getGameYears(req, res) {
	const now = new Date();
	const query = { date: { $lt: now } };
	if (!req.user || !req.user.isAdmin) {
		query.hideGame = { $in: [false, null] };
	}

	//Get all years
	const aggregatedYears = await Game.aggregate([
		{ $match: query },
		{ $project: { _id: 0, year: { $year: "$date" } } },
		{ $group: { _id: "$year" } }
	]);

	const years = aggregatedYears
		.map(({ _id }) => _id)
		.sort()
		.reverse();

	//Work out if we have any fixtures
	const fixture = await Game.findOne({ date: { $gt: now } }, "_id").lean();
	if (fixture) {
		years.unshift("fixtures");
	}

	res.send(years);
}
export async function getEntireList(req, res) {
	const { exclude } = req.query;
	const query = {};
	if (exclude) {
		query._id = { $nin: exclude.split(",") };
	}
	await getList(req, res, query);
}
export async function getListByIds(req, res) {
	const { ids } = req.params;
	const query = { _id: { $in: ids.split(",") } };
	await getList(req, res, query);
}
export async function getListByYear(req, res) {
	const { year } = req.params;
	const { exclude } = req.query;

	const query = {};

	const now = new Date();
	if (year === "fixtures") {
		query.date = { $gt: now };
	} else {
		const endOfYear = new Date(`${Number(year) + 1}-01-01`);
		query.date = { $gt: `${year}-01-01`, $lt: new Date(Math.min(now, endOfYear)) };
	}

	if (exclude) {
		query._id = { $nin: exclude.split(",") };
	}

	await getList(req, res, query);
}

async function getList(req, res, query = {}) {
	const list = await processList(req.user && req.user.isAdmin, query);
	res.send(list);
}
export async function getGameFromSlug(req, res) {
	const { slug } = req.params;

	const _id = await getIdFromSlug("games", slug);

	if (_id) {
		req.params.ids = _id;
		await getGames(req, res, true, false);
	} else {
		res.status(404).send({});
	}
}
export async function getBasicGames(req, res) {
	await getGames(req, res, false, false);
}
export async function getGamesForGamePage(req, res) {
	await getGames(req, res, true, false);
}
export async function getGamesForAdmin(req, res) {
	await getGames(req, res, true, true);
}
async function getGames(req, res, forGamePage, forAdmin) {
	const ids = req.params.ids.split(",");

	let games = await Game.find({ _id: { $in: ids } }).fullGame(forGamePage, forAdmin);

	games = await getExtraGameInfo(games, forGamePage, forAdmin);

	//Here, we loop through the games and check to see if the user has
	//voted for fan_potm yet. Currently this will be overwritten if getUpdatedGame is called,
	//but that will only happen to admins so shouldn't be a major issue.
	//The alternative is passing req (or at least the ip and session info)
	//to almost every method that handles games. This seems overkill, not least because
	//it only affects the UI options when voting. If a user tries to vote again,
	//it will be stopped on the server.
	if (forGamePage) {
		for (const game of games) {
			const currentVote = await checkFanPotmVote(req, game._id);
			if (currentVote) {
				game.activeUserFanPotmVote = currentVote.choice;
			}
		}
	}

	const results = _.keyBy(games, "_id");

	//Loop through given IDs, anything missing from results needs setting to false
	ids.forEach(id => {
		if (!results[id]) {
			results[id] = false;
		}
	});

	res.send(results);
}

export async function getHomePageGames(req, res) {
	const games = [];

	//Get the main team type
	const mainTeamType = await getMainTeamType("id");

	//Create a basic query
	const query = {
		_teamType: mainTeamType._id,
		hideGame: { $in: ["false", null] }
	};

	//First, get the previous game
	const lastGame = await Game.findOne(
		{
			...query,
			date: {
				$lte: new Date()
			}
		},
		"_id"
	)
		.lean()
		.sort({ date: -1 });
	if (lastGame) {
		games.push(lastGame._id);
	}

	//Then get the next one
	const nextGame = await Game.findOne(
		{
			...query,
			date: {
				$gt: new Date()
			}
		},
		"_id isAway isNeutralGround"
	)
		.lean()
		.sort({ date: 1 });
	if (nextGame) {
		games.push(nextGame._id);

		//Provisionally get the next home game
		if (fansCanAttend && (nextGame.isAway || nextGame.isNeutralGround)) {
			const nextHomeGame = await Game.findOne(
				{
					...query,
					date: {
						$gt: new Date()
					},
					isAway: false,
					isNeutralGround: false
				},
				"_id"
			)
				.lean()
				.sort({ date: 1 });
			if (nextHomeGame) {
				games.push(nextHomeGame._id);
			}
		}
	}

	//Get games
	req.params.ids = games.join(",");
	await getGames(req, res, false, false);
}

export async function getGamesByAggregate(match) {
	return Game.aggregate([
		{
			$match: match
		},
		//Create individual documents for each playerStats entry
		{
			$unwind: "$playerStats"
		},
		//Convert each playerStats entry to a score
		{
			$addFields: {
				score: {
					$sum: [
						{ $multiply: ["$playerStats.stats.T", 4] },
						{ $multiply: ["$playerStats.stats.CN", 2] },
						{ $multiply: ["$playerStats.stats.PK", 2] },
						"$playerStats.stats.DG"
					]
				}
			}
		},
		//Group by game id and player team
		{
			$group: {
				_id: { $concat: [{ $toString: "$_id" }, { $toString: "$playerStats._team" }] },
				gameId: { $first: "$_id" },
				isAway: { $first: "$isAway" },
				_team: { $first: "$playerStats._team" },
				score: {
					$sum: "$score"
				}
			}
		},
		//Group again to have a single document for each game
		{
			$group: {
				_id: "$gameId",
				isAway: { $first: "$isAway" },
				slug: { $first: "$slug" },
				score: {
					$push: {
						k: { $toString: "$_team" },
						v: "$score"
					}
				}
			}
		},
		//Convert the score array to an object
		{
			$addFields: {
				score: { $arrayToObject: "$score" }
			}
		}
	]);
}

//Create New Games
export async function addGame(req, res) {
	const values = await processGround(req.body);
	values.slug = await Game.generateSlug(values);
	const game = new Game(values);
	await game.save();
	await getUpdatedGame(game._id, res, true);
}

export async function addCrawledGames(req, res) {
	//Results object
	const savedData = {};

	//First, add local games
	const localBulkOperations = [];

	for (const game of req.body.local) {
		//Get Ground
		await processGround(game);

		//Get Slug
		game.slug = await Game.generateSlug(game);

		localBulkOperations.push({
			insertOne: { document: game }
		});
	}

	if (localBulkOperations.length) {
		//Save to database
		const result = await Game.bulkWrite(localBulkOperations);

		//Pull new games
		const list = await processList(req.user && req.user.isAdmin);
		const games = await Game.find({ _id: { $in: _.values(result.insertedIds) } }).fullGame(
			true,
			true
		);
		const fullGames = await getExtraGameInfo(games, true, true);

		//Return new games
		savedData.local = {
			fullGames,
			...list
		};
	}

	//Then, add neutral games
	const neutralBulkOperations = _.map(req.body.neutral, document => {
		return {
			insertOne: { document }
		};
	});
	if (neutralBulkOperations.length) {
		//Save to database
		const result = await NeutralGame.bulkWrite(neutralBulkOperations);

		//Return new games
		savedData.neutral = await getUpdatedNeutralGames(
			_.map(result.insertedIds, id => id.toString())
		);
	}

	res.send(savedData);
}

//Delete Game
export async function deleteGame(req, res) {
	const { _id } = req.params;
	const game = await validateGame(_id, res);

	if (game) {
		const NewsPost = mongoose.model("newsPosts");
		const posts = await NewsPost.find({ _game: _id }, "title slug").lean();

		if (posts.length) {
			res.status(409).send({
				error: `Could not delete game as ${posts.length} news ${
					posts.length == 1 ? "post depends" : "posts depend"
				} on it`,
				toLog: { posts }
			});
		} else {
			await game.remove();
			res.send({});
		}
	}
}

//Updaters
export async function updateGame(req, res) {
	const { _id } = req.params;
	const game = await validateGame(_id, res);
	if (game) {
		const values = await processGround(req.body);

		//If we're editing the date, check whether we need to update the slug
		if (values.date) {
			const oldDate = new Date(game.date).toString("yyyy-MM-dd");
			const newDate = new Date(values.date).toString("yyyy-MM-dd");
			if (oldDate !== newDate) {
				//Update slug
				values.slug = await Game.generateSlug(values);

				//Add slug redirect
				const slugRedirect = new SlugRedirect({
					oldSlug: game.slug,
					collectionName: "games",
					itemId: _id
				});
				await slugRedirect.save();
			}
		}

		//In case we're updating the post-game settings, convert fan_potm
		//to dot notation, so we don't overwrite the votes
		if (values.fan_potm) {
			for (const subKey in values.fan_potm) {
				values[`fan_potm.${subKey}`] = values.fan_potm[subKey];
			}

			delete values.fan_potm;
		}

		//Update values
		await game.updateOne(values);

		await getUpdatedGame(_id, res, true);
	}
}

export async function markSquadsAsAnnounced(req, res) {
	const { _id } = req.params;
	const game = await validateGame(_id, res);
	if (game) {
		game.squadsAnnounced = req.body.announced;
		await game.save();
		await getUpdatedGame(_id, res, true);
	}
}

export async function setSquads(req, res) {
	const { _id } = req.params;
	const game = await validateGame(_id, res);
	if (game) {
		const { team, squad } = req.body;
		const PlayerStatsCollection = require("../../models/rugby/PlayerStatsCollection");

		//Rather than simply apply the values
		//We loop through and update the position, where possible
		//That way, we preserve the stats
		const bulkOperation = _.chain(game.playerStats)
			.filter(s => s._team == team)
			.map(s => {
				const position = _.findKey(squad, p => p == s._player);
				if (!position) {
					return {
						updateOne: {
							filter: { _id },
							update: {
								$pull: {
									playerStats: {
										_player: s._player
									}
								}
							}
						}
					};
				} else {
					return {
						updateOne: {
							filter: { _id },
							update: {
								$set: {
									"playerStats.$[elem].position": position
								}
							},
							arrayFilters: [{ "elem._player": { $eq: s._player } }]
						}
					};
				}
			})
			.filter(_.identity)
			.value();

		//Then, add the new players
		_.chain(squad)
			.map((_player, position) => ({ _player, position }))
			.reject(
				({ _player }) => !_player || _.find(game.playerStats, s => s._player == _player)
			)
			.each(({ _player, position }) => {
				bulkOperation.push({
					updateOne: {
						filter: { _id },
						update: {
							$addToSet: {
								playerStats: {
									_player,
									_team: team,
									position: position,
									stats: PlayerStatsCollection
								}
							}
						}
					}
				});
			})
			.value();

		await Game.bulkWrite(bulkOperation);
		await getUpdatedGame(_id, res, true);
	}
}

export async function handleEvent(req, res) {
	const { _id } = req.params;
	const { event, player } = req.body;

	if (!event) {
		res.status(400).send(`No event type specified`);
	}
	if (!gameEvents[event]) {
		res.status(400).send(`Invalid event type - '${event}'`);
		return;
	}

	//If the event is valid
	let game = await validateGame(_id, res, Game.findById(_id).eventImage());
	if (game) {
		const { postTweet, postToFacebook, tweet, replyTweet, _profile } = req.body;

		//Create Event Object
		const eventObject = {
			event,
			_user: req.user._id
		};

		//Update Database for Player Events
		if (gameEvents[event].isPlayerEvent) {
			if (!player) {
				res.status(400).send("No player specified");
				return;
			}
			eventObject.inDatabase = true;
			eventObject._player = player;
			game = await Game.findOneAndUpdate(
				{ _id },
				{ $inc: { [`playerStats.$[elem].stats.${event}`]: 1 } },
				{
					new: true,
					arrayFilters: [{ "elem._player": mongoose.Types.ObjectId(player) }]
				}
			).eventImage();
		} else if (event == "extraTime") {
			eventObject.inDatabase = true;
			game.extraTime = true;
			await game.save();
		}

		//Post Tweet
		if (postTweet) {
			const twitterClient = await twitter(_profile);

			//Create Image
			let media_ids = null;
			if (event !== "none") {
				let image;
				if (gameEvents[event].isPlayerEvent) {
					//Check for hat-trick
					let imageEvent = event;
					if (event === "T") {
						const { stats } = _.find(
							game._doc.playerStats,
							p => p._player._id == player
						);
						const { T } = stats;
						if (T % 3 === 0) {
							imageEvent = "HT";
						}
					}
					image = await generatePlayerEventImage(player, imageEvent, game);
				} else {
					switch (event) {
						case "pregameSquad":
							image = await generatePregameImage(game, req.body.imageOptions);
							break;
						case "matchSquad":
							image = await generateSquadImage(
								game,
								req.body.showOpposition,
								req.get("host")
							);
							break;
						default:
							image = await new GameEventImage(game, event);
							break;
					}
				}

				const media_data = image ? await image.render(true) : null;
				const upload = await twitterClient.post("media/upload", {
					media_data
				});
				const { media_id_string } = upload.data;
				media_ids = [media_id_string];
			}

			//Post Tweet
			let postedTweet, tweetError;
			try {
				postedTweet = await twitterClient.post("statuses/update", {
					status: tweet,
					in_reply_to_status_id: replyTweet,
					auto_populate_reply_metadata: true,
					tweet_mode: "extended",
					media_ids
				});
			} catch (e) {
				tweetError = e;
			}

			if (tweetError) {
				res.status(tweetError.statusCode).send(`(Twitter) - ${tweetError.message}`);
				return;
			}

			eventObject.tweet_text = tweet;
			eventObject.tweet_id = postedTweet.data.id_str;
			eventObject._profile = _profile;

			const tweetMediaObject = postedTweet.data.entities.media;
			if (tweetMediaObject) {
				eventObject.tweet_image = tweetMediaObject[0].media_url;
			}

			if (postToFacebook) {
				//Post to ifttt
				const facebookImages = [];
				if (eventObject.tweet_image) {
					facebookImages.push(eventObject.tweet_image);
				}
				await postToSocial("facebook", tweet, { _profile, images: facebookImages });
			}
		}

		//Add Event
		await game.events.push(eventObject);
		await game.save();

		//Return Updated Game
		await getUpdatedGame(_id, res, true);
	}
}

export async function deleteEvent(req, res) {
	const { _id, _event } = req.params;
	let { deleteTweet, removeFromDb } = req.query;
	const game = await validateGame(_id, res);

	//Convert strings to booleans. Default to false
	deleteTweet = deleteTweet === "true";
	removeFromDb = removeFromDb === "true";

	if (game) {
		const e = _.find(game._doc.events, e => e._id == _event);
		if (!e) {
			res.status(404).send(`Event with id ${_event} not found`);
		} else {
			const { event, tweet_id, _player, _profile } = e;
			//Delete Tweet
			if (deleteTweet && tweet_id) {
				const twitterClient = await twitter(_profile);
				await twitterClient.post(`statuses/destroy/${tweet_id}`);
			}

			//Undo DB Data
			const eventObject = game.events.id(_event);
			if (removeFromDb && _player && eventObject.inDatabase) {
				await game.updateOne(
					{ $inc: { [`playerStats.$[elem].stats.${event}`]: -1 } },
					{
						arrayFilters: [{ "elem._player": mongoose.Types.ObjectId(_player) }]
					}
				);
			}

			if (removeFromDb && event == "extraTime" && eventObject.inDatabase) {
				game.extraTime = false;
			}

			//Update model
			if (deleteTweet) {
				eventObject.tweet_id = null;
				eventObject.tweet_image = null;
				eventObject.tweet_text = null;
			}
			if (removeFromDb) {
				eventObject.inDatabase = false;
			}
			if (!eventObject.tweet_id && !eventObject.inDatabase) {
				await game.events.id(_event).remove();
			}
			await game.save();

			//Return Updated Game
			await getUpdatedGame(_id, res, true);
		}
	}
}

export async function setStats(req, res) {
	const { _id } = req.params;
	const game = await validateGame(_id, res);
	if (game) {
		for (const _player in req.body) {
			const stats = _.map(req.body[_player], (val, key) => [
				`playerStats.$[elem].stats.${key}`,
				val
			]);
			await game.updateOne(
				{ $set: _.fromPairs(stats) },
				{
					arrayFilters: [{ "elem._player": mongoose.Types.ObjectId(_player) }]
				}
			);
		}
		await getUpdatedGame(_id, res, true);
	}
}

//Crawlers
export async function fetchExternalGame(req, res) {
	const { _id } = req.params;
	const game = await validateGame(_id, res, Game.findById(_id).crawl());
	if (game) {
		const result = await parseExternalGame(
			game,
			false,
			req.query.includeScoringStats == "true"
		);
		if (result.error) {
			res.status(500).send({ toLog: result.error, errorMessage: "UHOH" });
		} else {
			res.send(result);
		}
	}
}

//Image Generators
async function generatePregameImage(game, options = {}) {
	const [gameWithSquads] = await getExtraGameInfo([game], true, true);
	return new PregameImage(gameWithSquads, options);
}

export async function fetchPregameImage(req, res) {
	const { _id } = req.params;

	const game = await validateGame(_id, res, Game.findById(_id).eventImage());

	if (game) {
		const imageModel = await generatePregameImage(game, req.query);
		const image = await imageModel.render(false);
		res.send(image);
	}
}

async function generateSquadImage(game, showOpposition, siteUrl) {
	const [gameWithSquads] = await getExtraGameInfo([game], true, true);

	const teamToMatch = showOpposition ? game._opposition._id : localTeam;

	const players = _.chain(gameWithSquads.playerStats)
		.filter(({ _team }) => _team == teamToMatch)
		.sortBy("position")
		//Get data from eligible players
		.map(({ _player }) =>
			gameWithSquads.eligiblePlayers[teamToMatch].find(ep => ep._id == _player._id)
		)
		.value();

	return new SquadImage(players, { game: gameWithSquads, showOpposition, siteUrl });
}

export async function fetchSquadImage(req, res) {
	const { _id } = req.params;
	const { showOpposition } = req.query;

	const game = await validateGame(_id, res, Game.findById(_id).eventImage());

	if (game) {
		const imageClass = await generateSquadImage(
			game,
			showOpposition === "true",
			req.get("host")
		);
		const image = await imageClass.render(false);
		res.send(image);
	}
}

async function generatePlayerEventImage(player, event, basicGame) {
	const [game] = await getExtraGameInfo([basicGame], true, true);

	//If the player plays for the local team, and has an image, then
	//we use a PersonImageCard. Otherwise it's a GameEvent Card
	let usePlayerImage = false;
	const eligiblePlayerEntry = _.find(game.playerStats, ({ _player }) => _player._id == player);
	if (eligiblePlayerEntry) {
		const { _team, _player } = eligiblePlayerEntry;
		if (_team == localTeam && (_player.images.main || _player.images.player)) {
			usePlayerImage = true;
		}
	}
	if (usePlayerImage) {
		const image = new PersonImageCard(player, { game });
		await image.drawGameData(true);
		await image.drawGameEvent(event);
		return image;
	} else {
		return new GameEventImage(game, event, player);
	}
}

async function updateSocialMediaCard(id) {
	const gameForImage = await Game.findById(id).eventImage();
	const imageClass = new GameSocialCardImage(gameForImage);
	const image = await imageClass.render();
	const result = await uploadBase64ImageToGoogle(image, "images/games/social/", false, id, "jpg");
	await Game.findByIdAndUpdate(id, { $inc: { socialImageVersion: 1 } });
	return result;
}

export async function fetchEventImage(req, res) {
	const { _id } = req.params;
	const { event, player } = req.body;
	if (!event) {
		res.status(400).send("No event type specified");
	} else if (!gameEvents[event] || event === "none") {
		res.status(400).send(`Invalid event type - '${event}'`);
	} else if (gameEvents[event].isPlayerImage && !player) {
		res.status(400).send("No player selected");
	} else {
		const game = await Game.findById(_id).eventImage();
		if (gameEvents[event].isPlayerEvent) {
			const image = await generatePlayerEventImage(player, event, game);
			const output = await image.render(false);
			res.send(output);
		} else {
			const image = await new GameEventImage(game, event);
			const output = await image.render(false);
			res.send(output);
		}
	}
}

async function generateFixtureListImage(year, competitions, fixturesOnly) {
	let fromDate;

	if (fixturesOnly) {
		fromDate = new Date().toString("yyyy-MM-dd");
	} else {
		fromDate = `${year}-01-01`;
	}

	const games = await Game.find({
		date: { $gte: fromDate, $lt: `${Number(year) + 1}-01-01` },
		_competition: {
			$in: competitions
		},
		hideGame: false
	}).fullGame();

	if (games.length) {
		return new FixtureListImage(games, year);
	} else {
		return false;
	}
}

export async function fetchFixtureListImage(req, res) {
	const { year, competitions } = req.params;
	const fixturesOnly = req.query.fixturesOnly === "true";

	const imageClass = await generateFixtureListImage(year, competitions.split(","), fixturesOnly);

	if (imageClass) {
		const image = await imageClass.render(false);
		res.send(image);
	} else {
		res.status(400).send("No valid games found");
	}
}

export async function postFixtureListImage(req, res) {
	const { year, _competitions, _profile, tweet, fixturesOnly } = req.body;
	const twitterClient = await twitter(_profile);

	//Render Image
	const imageClass = await generateFixtureListImage(year, _competitions, fixturesOnly);

	if (!imageClass) {
		res.status(400).send("No valid games found");
		return;
	}

	const image = await imageClass.render(true);

	//Upload image
	const upload = await twitterClient.post("media/upload", {
		media_data: image
	});
	const { media_id_string } = upload.data;
	const media_ids = [media_id_string];

	//Post Tweet
	let postedTweet, tweetError;
	try {
		postedTweet = await twitterClient.post("statuses/update", {
			status: tweet,
			tweet_mode: "extended",
			media_ids
		});
	} catch (e) {
		tweetError = e;
	}

	if (tweetError) {
		res.status(tweetError.statusCode).send(`(Twitter) - ${tweetError.message}`);
		return;
	}

	const tweetMediaObject = postedTweet.data.entities.media;
	if (tweetMediaObject) {
		await postToSocial("facebook", tweet, {
			_profile,
			images: [tweetMediaObject[0].media_url]
		});
	}

	//Post to ifttt
	res.send(true);
}

async function generatePostGameEventImage(game, data, res) {
	const { customHeader, type, _player, playersAndStats } = data;

	if (!type) {
		res.status(400).send("No event type specified");
	} else {
		//Pull the correct image, based on event type
		switch (type) {
			case "breakdown-intro":
				return new GameEventImage(game, type);
			case "team-stats":
				return new TeamStatsImage(game, data.teamStats);
			case "player-stats": {
				const image = new PersonImageCard(_player, { game });
				await image.drawGameData();
				await image.drawGameStats(data.playerStats);
				return image;
			}
			case "grouped-player-stats":
			case "fan-potm-options":
			case "steel-points": {
				return new MultiplePlayerStats(game, playersAndStats, type, {
					customHeader
				});
			}
			case "league-table": {
				const teamsToHighlight = [localTeam, game._opposition._id];
				const date = new Date(game.date);
				const options = {
					fromDate: `${date.getFullYear()}-01-01`,
					toDate: date
						.next()
						.tuesday()
						.toString("yyyy-MM-dd")
				};
				return new LeagueTable(
					game._competition._id,
					new Date(game.date).getFullYear(),
					teamsToHighlight,
					options
				);
			}
			case "min-max-league-table": {
				return new MinMaxLeagueTable(
					game._competition._id,
					new Date(game.date).getFullYear()
				);
			}
		}
	}
}

export async function fetchPostGameEventImage(req, res) {
	const { _id } = req.params;

	const basicGame = await validateGame(_id, res, Game.findById(_id).eventImage());

	if (basicGame) {
		const [game] = await getExtraGameInfo([basicGame], true, true);

		const image = await generatePostGameEventImage(game, req.body, res);
		if (image) {
			const output = await image.render(false);
			res.send(output);
		}
	}
}

export async function submitPostGameEvents(req, res) {
	const { _id } = req.params;

	const basicGame = await validateGame(_id, res, Game.findById(_id).eventImage());

	if (basicGame) {
		const [game] = await getExtraGameInfo([basicGame], true, true);
		let { replyTweet, _profile, channels, posts } = req.body;

		//Get Twitter Client for uploading images
		const twitterClient = await twitter(_profile);

		//Loop through posts and render images for twitter
		const images = {};
		for (const i in posts) {
			const post = posts[i];
			if (post.type !== "text-only") {
				//Create base64 image
				console.info(`Creating Image for Tweet #${Number(i) + 1} of ${posts.length}...`);
				const image = await generatePostGameEventImage(game, posts[i].additionalValues);
				const media_data = await image.render(true);

				console.info(`Uploading Image...`);
				//Upload it to twitter
				const upload = await twitterClient.post("media/upload", {
					media_data
				});

				//Save the media_id_string
				console.info(`Image uploaded!`);
				images[i] = upload.data.media_id_string;
			}
		}

		//Post Tweets
		const imageUrls = {};
		for (const i in posts) {
			const { content } = posts[i];

			const media_strings = [];
			if (images[i]) {
				media_strings.push(images[i]);
			}
			console.info(`Posting Tweet #${Number(i) + 1} of ${posts.length}...`);
			const result = await postToSocial("twitter", content, {
				_profile,
				media_strings,
				replyTweet
			});

			if (result.success) {
				//Update reply tweet to continue thread
				replyTweet = result.post.id_str;

				//Get image URLs, for Facebook
				const tweetMediaObject = result.post.entities.media;
				if (tweetMediaObject) {
					imageUrls[i] = tweetMediaObject[0].media_url;
				}
			}
		}

		//Handle facebook
		if (channels.find(c => c === "facebook")) {
			for (const i in posts) {
				const images = [];
				if (imageUrls[i]) {
					images.push(imageUrls[i]);
				}
				console.info(`Posting Facebook Post #${Number(i) + 1} of ${posts.length}...`);
				await postToSocial("facebook", posts[i].content, {
					_profile,
					images
				});
			}
		}

		res.send({});
	}
}

//Calendar
export async function getCalendar(req, res) {
	const query = {
		date: { $gt: new Date("2020-01-01") },
		hideGame: { $in: [false, null] }
	};

	//Set default options
	const options = {
		teams: "oppositionOnly",
		teamName: "short",
		displayTeamTypes: "allButFirst",
		venue: "short",
		withBroadcaster: true
	};

	//Get Team Types
	const teamTypes = await TeamType.find({}, "name slug sortOrder").lean();

	//Loop through req.query to find option overrides
	for (const option in req.query) {
		//Check for teamType flag
		if (option === "teamTypes") {
			//Get Team Type ids from slug
			const selectedTeamTypes = req.query[option].split(",");
			const validTeamTypes = teamTypes.filter(({ slug }) =>
				selectedTeamTypes.find(t => t == slug)
			);

			//If teamTypes are declared but none are valid, throw an error
			if (!validTeamTypes || !validTeamTypes.length) {
				res.status(404).send("Invalid value for parameter teamTypes");
				return;
			}

			//Otherwise, add to query object
			query._teamType = { $in: validTeamTypes.map(t => t._id) };
		}

		//Separate logic for withBroadcaster as we need to cast the string to a bool
		else if (option === "withBroadcaster") {
			switch (req.query[option].toLowerCase()) {
				case "true":
					options.withBroadcaster = true;
					break;
				case "false":
					options.withBroadcaster = false;
					break;
				default:
					res.status(404).send(
						"Invalid value for parameter 'withBroadcaster'. Must be true or false"
					);
					return;
			}
		}

		//Anything else needs just to be a valid option type
		else if (calendarStringOptions[option]) {
			//Ensure the given value is valid
			const value = req.query[option];
			if (calendarStringOptions[option].indexOf(value) > -1) {
				options[option] = value;
			} else {
				res.status(404).send(
					`Invalid value for parameter '${option}'. Must be one of: ${calendarStringOptions[
						option
					]
						.map(o => `"${o}"`)
						.join(", ")}`
				);
				return;
			}
		}
	}

	//Get Local Team Name
	const localTeamName = await Team.findById(localTeam, "name").lean();

	//Get Games
	let games = await Game.find(query).fullGame();
	games = JSON.parse(JSON.stringify(games));

	//Create Event Data
	const events = games.map(g => {
		//Set Basic Variables
		const { _ground, slug, title, dateRange, hasTime } = g;

		//Create date object
		g.date = new Date(g.date);

		//Create Basic Object
		const calObject = {
			title: convertGameToCalendarString(
				g,
				options,
				_.keyBy(teamTypes, "_id"),
				localTeamName.name
			),
			description: title,
			url: `${req.protocol}://${req.get("host")}/games/${slug}`
		};

		//Set date and duration
		if (dateRange) {
			//If this game has a date range, we set it here, and assume no time is defined
			const altDate = new Date(g.date).addDays(dateRange);

			//Work out first and last dates
			const startDate = new Date(Math.min(g.date, altDate));
			const endDate = new Date(Math.max(g.date, altDate));

			//Update calObject
			calObject.start = [
				startDate.getFullYear(),
				startDate.getMonth() + 1,
				startDate.getDate()
			];
			calObject.end = [endDate.getFullYear(), endDate.getMonth() + 1, endDate.getDate()];

			//Update description
			calObject.description += "\n\nDate and kick-off time not yet confirmed";
			calObject.description += `\n\nThis game will take place between ${formatDate(g)}`;
		} else {
			//Otherwise, we know the date and set it
			calObject.start = [g.date.getFullYear(), g.date.getMonth() + 1, g.date.getDate()];

			//If the game has a time, then we add it here and se the duration property
			//Otherwise, we leave off the time and set an end property
			if (hasTime) {
				calObject.start.push(g.date.getHours(), g.date.getMinutes());
				calObject.duration = { hours: 2 };
			} else {
				calObject.end = calObject.start;
				calObject.description += "\nKick-off time not yet confirmed";
			}
		}

		//Conditionally add Ground
		if (_ground) {
			const { address } = _ground;

			const locationArr = [
				_ground.name,
				address.street,
				address.street2,
				address._city.name,
				address._city._country.name
			];
			calObject.location = _.filter(locationArr, _.identity).join(", ");
		}
		return calObject;
	});

	//Create Events
	const { error, value } = ics.createEvents(events);
	if (error) {
		res.status(500).send(error);
	} else {
		//Set header
		res.set({
			"Content-Disposition": `attachment; filename="${localTeamName.name.long} Fixture Calendar.ics"`
		});
		res.send(value);
	}
}

//Fan POTM
export async function saveFanPotmVote(req, res) {
	const { _game, _player } = req.params;

	const game = await validateGame(_game, res);

	if (game) {
		//Check to see if the user has already voted
		const currentVote = await checkFanPotmVote(req, game._id);

		//Create a vote object to add
		const { ipAddress, session } = req;
		const vote = {
			ip: ipAddress,
			session: session.id,
			choice: _player
		};

		if (currentVote) {
			await Game.updateOne(
				{ _id: _game, "fan_potm.votes._id": currentVote._id },
				{ $set: { "fan_potm.votes.$": vote } }
			);
		} else {
			game.fan_potm.votes.push(vote);
			await game.save();
		}

		//Return vote
		res.send({ hadAlreadyVoted: Boolean(currentVote), choice: _player });
	}
}

//Get values for corresponding team selectors
export async function getTeamSelectorValues(_id, res) {
	//Load the game
	const basicGame = await validateGame(_id, res, Game.findById(_id).fullGame(true, false));
	const [game] = await getExtraGameInfo([basicGame], true, true);
	game.date = new Date(game.date);

	//Load team type
	const teamType = await TeamType.findById(game._teamType, "name sortOrder").lean();

	//Load team
	const team = await Team.findById(localTeam, "squads");

	//Create a basic values object
	const values = {
		interchanges: 4,
		slug: game.slug,
		defaultSocialText: `Check out my Starting 17 for #${game.hashtags[0]}!\n\nvia {site_social}\n{url}`,
		numberFromTeam: localTeam
	};

	//Generate a title
	values.title = game._opposition.name.short;
	if (teamType.sortOrder > 1) {
		values.title += ` ${teamType.name}`;
	}
	values.title += ` - ${game.date.toString("dd/MM/yyyy")}`;

	//Add players
	let players = game.eligiblePlayers[localTeam];
	if (game._competition.instance.usesPregameSquads) {
		const pregameSquad = game.pregameSquads.find(({ _team }) => _team == localTeam);
		if (pregameSquad && pregameSquad.squad) {
			players = players.filter(({ _id }) => pregameSquad.squad.find(p => p == _id));
		}
	}
	values.players = players.map(p => _.pick(p, ["_id", "name", "playingPositions"]));

	//Add squad for numbers
	const correspondingSquad = team.squads.find(
		({ year, _teamType }) => year == game.date.getFullYear() && _teamType == game._teamType
	);
	if (correspondingSquad) {
		values.numberFromSquad = correspondingSquad._id;
	}

	return values;
}
