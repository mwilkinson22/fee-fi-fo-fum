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
const { localTeam } = require("~/config/keys");
import gameEvents from "~/constants/gameEvents";
import coachTypes from "~/constants/coachTypes";

//Helpers
import { getRedirects } from "../genericController";
import { postToSocial } from "../oAuthController";
import { getUpdatedNeutralGames } from "./neutralGamesController";

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
	} else {
		//Work out required player fields
		const playerSelect = [
			"name",
			"nickname",
			"images.main",
			"images.player",
			"slug",
			"gender",
			"playingPositions"
		];
		let adminPlayerPopulate = {};
		if (forAdmin) {
			playerSelect.push(
				"displayNicknameInCanvases",
				"squadNameWhenDuplicate",
				"_sponsor",
				"twitter"
			);
			adminPlayerPopulate.populate = {
				path: "_sponsor",
				select: "name twitter"
			};
		}

		//Get All Full Teams
		const teamIds = [localTeam];

		//Add opposition and shared squads
		games.forEach(g => {
			teamIds.push(g._opposition._id);

			if (g.sharedSquads && Object.keys(g.sharedSquads).length) {
				_.map(g.sharedSquads, teams => teamIds.push(...teams));
			}
		});

		let teams = await Team.find({ _id: { $in: teamIds } }, "squads coaches")
			.populate({
				path: "squads.players._player",
				select: playerSelect.join(" "),
				...adminPlayerPopulate
			})
			.populate({ path: "coaches._person", select: "name slug" });

		teams = _.keyBy(JSON.parse(JSON.stringify(teams)), "_id");

		//Get team types
		let teamTypes;
		const TeamType = mongoose.model("teamTypes");
		const results = await TeamType.find({}, "_id gender");
		teamTypes = _.keyBy(results, "_id");

		//Loop each game
		games = games.map(g => {
			const game = JSON.parse(JSON.stringify(g));
			const date = new Date(game.date);
			const year = date.getFullYear();

			//Get gendered term for _____ of steel, of the match, etc
			game.gender = teamTypes[game._teamType].gender;
			game.genderedString = game.gender === "M" ? "Man" : "Woman";

			//Get Coaches
			game.coaches = _.chain([localTeam, game._opposition._id])
				.map(id => [id, teams[id].coaches])
				.fromPairs()
				.mapValues(coaches => {
					return _.chain(coaches)
						.filter(c => {
							return (
								c._teamType.toString() == game._teamType.toString() &&
								new Date(c.from) < date &&
								(c.to == null || new Date(c.to) > date)
							);
						})
						.orderBy(
							[({ role }) => coachTypes.findIndex(({ key }) => role == key)],
							["asc"]
						)
						.uniqBy("_person._id")
						.map(({ _person, role }) => ({ _person, role }))
						.value();
				})
				.value();

			//Get Valid Team Types
			const { useAllSquads } = game._competition._parentCompetition;
			let validTeamTypes;
			if (useAllSquads) {
				validTeamTypes = _.filter(teamTypes, t => t.gender == game.gender).map(t =>
					t._id.toString()
				);
			} else {
				validTeamTypes = [game._teamType];
			}

			game.eligiblePlayers = _.chain([localTeam, game._opposition._id])
				//Loop local and opposition teams
				.map(id => {
					//Create an array with this team's id, plus
					//the ids of any shared squads they might have
					const teamsToCheck = [id];
					if (game.sharedSquads && game.sharedSquads[id]) {
						teamsToCheck.push(...game.sharedSquads[id]);
					}

					//Loop through the above array
					const squad = _.chain(teamsToCheck)
						.map(teamToCheck => {
							//Get the team whose squad we'll be pulling
							const team = teams[teamToCheck];

							//Return any squads that match the year with an
							//appropriate team type
							return team.squads
								.filter(
									squad =>
										squad.year == year &&
										validTeamTypes.indexOf(squad._teamType.toString()) > -1
								)
								.map(s => s.players);
						})
						//At this stage we'll have nested values, so flatten
						//them first to get a simple list of player objects
						.flattenDeep()
						//Remove duplicates
						.uniqBy(p => p._player._id)
						//Remove squad numbers where more than one squad is used
						.map(p => {
							if (teamsToCheck.length > 1 || validTeamTypes.length > 1) {
								p.number = null;
							}
							return p;
						})
						.value();
					return [id, squad];
				})
				.fromPairs()
				.value();

			//Add variables to help govern reloading
			game.pageData = true;
			game.adminData = forAdmin;

			return game;
		});
	}
	return games;
}

async function getUpdatedGame(id, res, refreshSocialImage = false) {
	//Get Full Game
	let game = await Game.findById(id).fullGame(true, true);

	//This only gets called after an admin action, so it's safe to assume we want the full admin data
	game = await getExtraGameInfo([game], true, true);
	const fullGames = _.keyBy(game, "_id");

	//Get Game For List
	//Again, this is only called after an admin action so include hidden games
	const list = await processList(true);

	res.send({ id, fullGames, ...list });

	if (refreshSocialImage) {
		await updateSocialMediaCard(id);
	}
}

async function processList(userIsAdmin) {
	const query = {};
	if (!userIsAdmin) {
		query.hideGame = { $in: [false, null] };
	}
	const games = await Game.find(query)
		.forList()
		.lean();
	const gameList = _.keyBy(games, "_id");

	const redirects = await getRedirects(gameList, collectionName);
	return { count: games.length, gameList, redirects };
}

//Getters
export async function getList(req, res) {
	const list = await processList(req.user && req.user.isAdmin);
	res.send(list);
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
	const { ids } = req.params;

	let games = await Game.find({ _id: { $in: ids.split(",") } }).fullGame(forGamePage, forAdmin);

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

	res.send(_.keyBy(games, "_id"));
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
			gameWithSquads.eligiblePlayers[teamToMatch].find(ep => ep._player._id == _player._id)
		)
		//Pull off number and player data
		.map(({ _player, number }) => ({ number, ..._player }))
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
		hideGame: false
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
	const [game] = await getExtraGameInfo([basicGame], true, false);
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
			players = players.filter(({ _player }) =>
				pregameSquad.squad.find(p => p == _player._id)
			);
		}
	}
	values.players = players.map(({ _player }) =>
		_.pick(_player, ["_id", "name", "playingPositions"])
	);

	//Add squad for numbers
	const correspondingSquad = team.squads.find(
		({ year, _teamType }) => year == game.date.getFullYear() && _teamType == game._teamType
	);
	if (correspondingSquad) {
		values.numberFromSquad = correspondingSquad._id;
	}

	return values;
}
