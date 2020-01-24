//Mongoose
import mongoose from "mongoose";
const collectionName = "games";
const Game = mongoose.model(collectionName);
const Team = mongoose.model("teams");
const TeamType = mongoose.model("teamTypes");
const ics = require("ics");

//Modules
import _ from "lodash";
import { parse } from "node-html-parser";
import axios from "axios";
import twitter from "~/services/twitter";

//Constants
const { localTeam, fixtureCrawlUrl } = require("../../config/keys");
import gameEvents from "~/constants/gameEvents";
import coachTypes from "~/constants/coachTypes";

//Helpers
import { getRedirects } from "../genericController";
import { postToSocial } from "../oAuthController";
import { parseExternalGame, convertGameToCalendarString } from "~/helpers/gameHelper";
import { uploadBase64ImageToGoogle } from "~/helpers/fileHelper";

//Images
import GameSocialCardImage from "~/images/GameSocialCardImage";
import PregameImage from "~/images/PregameImage";
import FixtureListImage from "~/images/FixtureListImage";
import SquadImage from "~/images/SquadImage";
import GameEventImage from "~/images/GameEventImage";
import PlayerEventImage from "~/images/PlayerEventImage";
import TeamStatsImage from "~/images/TeamStatsImage";
import MultiplePlayerStats from "~/images/MultiplePlayerStats";

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

async function getExtraGameInfo(games, forGamePage, forAdmin) {
	//Convert to JSON and fix scoreOverride
	games = games.map(g => {
		const game = JSON.parse(JSON.stringify(g));
		if (game.scoreOverride && game.scoreOverride.length) {
			game.scoreOverride = _.chain(game.scoreOverride)
				.keyBy("_team")
				.mapValues("points")
				.value();
		}
		return game;
	});

	if (forGamePage) {
		//Work out required player fields
		const playerSelect = ["name", "nickname", "images.main", "images.player", "slug", "gender"];
		let adminPlayerPopulate = {};
		if (forAdmin) {
			playerSelect.push(
				"playingPositions",
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

					//Loop through the abbove array
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
	const list = await processList();

	if (refreshSocialImage) {
		updateSocialMediaCard(id);
	}

	res.send({ id, fullGames, ...list });
}

async function processList() {
	const games = await Game.find({})
		.forList()
		.lean();
	const gameList = _.keyBy(games, "_id");

	const redirects = await getRedirects(gameList, collectionName);
	return { gameList, redirects };
}

//Getters
export async function getList(req, res) {
	const list = await processList();
	res.send(list);
}
export async function getBasicGames(req, res) {
	getGames(req, res, false, false);
}
export async function getGamesForGamePage(req, res) {
	getGames(req, res, true, false);
}
export async function getGamesForAdmin(req, res) {
	getGames(req, res, true, true);
}
async function getGames(req, res, forGamePage, forAdmin) {
	const { ids } = req.params;

	let games = await Game.find({
		_id: {
			$in: ids.split(",")
		}
	}).fullGame(forGamePage, forAdmin);

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

//Create New Game
export async function addGame(req, res) {
	const values = await processGround(req.body);
	values.slug = await Game.generateSlug(values);
	const game = new Game(values);
	await game.save();
	await getUpdatedGame(game._id, res, true);
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
		const { postTweet, tweet, replyTweet, _profile } = req.body;

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
							image = await generateSquadImage(game, req.body.showOpposition);
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

			//Post to ifttt
			const facebookImages = [];
			if (eventObject.tweet_image) {
				facebookImages.push(eventObject.tweet_image);
			}
			await postToSocial("facebook", tweet, { _profile, images: facebookImages });
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
		res.send(result);
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

async function generateSquadImage(game, showOpposition) {
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

	return new SquadImage(players, { game: gameWithSquads, showOpposition });
}

export async function fetchSquadImage(req, res) {
	const { _id } = req.params;
	const { showOpposition } = req.query;

	const game = await validateGame(_id, res, Game.findById(_id).eventImage());

	if (game) {
		const imageClass = await generateSquadImage(game, showOpposition === "true");
		const image = await imageClass.render(false);
		res.send(image);
	}
}

async function generatePlayerEventImage(player, event, basicGame) {
	const [game] = await getExtraGameInfo([basicGame], true, true);
	const image = new PlayerEventImage(player, { game });
	await image.drawGameData(true);
	await image.drawGameEvent(event);
	return image;
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

async function generateFixtureListImage(year, competitions) {
	const games = await Game.find({
		date: { $gte: `${year}-01-01`, $lt: `${Number(year) + 1}-01-01` },
		_competition: {
			$in: competitions
		}
	}).fullGame();

	return new FixtureListImage(games, year);
}

export async function fetchFixtureListImage(req, res) {
	const { year, competitions } = req.params;

	const imageClass = await generateFixtureListImage(year, competitions.split(","));
	const image = await imageClass.render(false);
	res.send(image);
}

export async function postFixtureListImage(req, res) {
	const { year, _competitions, _profile, tweet } = req.body;
	const twitterClient = await twitter(_profile);

	//Render Image
	const imageClass = await generateFixtureListImage(year, _competitions);
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
	const { customHeader, eventType, _player, stats, playersAndStats } = data;

	if (!eventType) {
		res.status(400).send("No event type specified");
	} else {
		//Pull the correct image, based on event type
		switch (eventType) {
			case "breakdown-intro":
				return new GameEventImage(game, eventType);
			case "team-stats":
				return new TeamStatsImage(game, stats);
			case "player-stats": {
				const image = new PlayerEventImage(_player, { game });
				await image.drawGameData();
				await image.drawGameStats(stats);
				return image;
			}
			case "grouped-player-stats":
			case "fan-potm-options":
			case "steel-points": {
				const image = new MultiplePlayerStats(game, playersAndStats, eventType, {
					customHeader
				});
				return image;
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
		let { replyTweet, _profile, postToFacebook, tweets } = req.body;

		//Get Twitter Client for uploading images
		const twitterClient = await twitter(_profile);

		//Loop through tweets and render images
		const images = {};
		for (const i in tweets) {
			const tweet = tweets[i];
			if (tweet.eventType !== "text-only") {
				//Create base64 image
				console.info(`Creating Image for Tweet #${Number(i) + 1} of ${tweets.length}...`);
				const image = await generatePostGameEventImage(game, tweets[i]);
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
		for (const i in tweets) {
			const { text } = tweets[i];

			const media_strings = [];
			if (images[i]) {
				media_strings.push(images[i]);
			}
			console.info(`Posting Tweet #${Number(i) + 1} of ${tweets.length}...`);
			const result = await postToSocial("twitter", text, {
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
		if (postToFacebook) {
			for (const i in tweets) {
				const images = [];
				if (imageUrls[i]) {
					images.push(imageUrls[i]);
				}
				console.info(`Posting Facebook Post #${Number(i) + 1} of ${tweets.length}...`);
				await postToSocial("facebook", tweets[i].text, {
					_profile,
					images
				});
			}
		}

		res.send({});
	}
}

//Calendar
export async function createCalendar(req, res) {
	const { _competitions, options } = req.body;

	//Get Team Types
	const teamTypes = await TeamType.find({}, "name sortOrder").lean();

	//Get Local Team Name
	const localTeamName = await Team.findById(localTeam, "name").lean();

	//Get Games
	let games = await Game.find({
		date: {
			$gte: new Date()
		},
		_competition: {
			$in: _competitions
		}
	}).fullGame();
	games = JSON.parse(JSON.stringify(games));

	//Create Event Data
	const events = games.map(g => {
		//Set Basic Variables
		const { _ground, slug, title } = g;
		const date = new Date(g.date);

		//Determine Ground
		const { address } = _ground;
		const locationArr = [
			_ground.name,
			address.street,
			address.street2,
			address._city.name,
			address._city._country.name
		];
		const location = _.filter(locationArr, _.identity).join(", ");
		return {
			title: convertGameToCalendarString(
				g,
				options,
				_.keyBy(teamTypes, "_id"),
				localTeamName.name
			),
			description: title,
			start: [
				date.getFullYear(),
				date.getMonth() + 1,
				date.getDate(),
				date.getHours(),
				date.getMinutes()
			],
			duration: { hours: 2 },
			location,
			url: `https://www.feefifofum.co.uk/games/${slug}`
		};
	});

	//Create Events
	const { error, value } = ics.createEvents(events);
	if (error) {
		res.status(500).send(error);
	} else {
		res.set({ "Content-Disposition": 'attachment; filename="Giants.ics"' });
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

//To Be Replaced
export async function crawlFixtures() {
	const url = fixtureCrawlUrl;
	const { data } = await axios.get(url);

	const html = parse(data);
	const list = html.querySelector(".row.matches").childNodes[1].childNodes;
	const games = [];
	let date;
	for (const row of list) {
		if (!row.tagName) {
			continue;
		}

		if (row.tagName === "h3") {
			const [dayText, day, month, year] = row.text.split(" ");
			const dayNum = day.replace(/\D/g, "");
			date = new Date(`${dayNum} ${month} ${year}`);
		} else if (row.classNames.indexOf("fixture-card") > -1) {
			const anchor = row.querySelector("a");
			const externalId = anchor.rawAttributes.href.split("/").pop();
			const [firstRow, secondRow, thirdRow] = _.reject(
				anchor.childNodes,
				n => n.tagName === undefined
			);

			//Date and time
			let timeStringClass;
			if (firstRow.querySelector(".uk-time")) {
				timeStringClass = "uk-time";
			} else {
				timeStringClass = "middle";
			}
			const [hours, minutes] = firstRow
				.querySelector(`.${timeStringClass}`)
				.text.match(/\d+/g);
			date.setHours(hours, minutes);

			//Teams
			const _homeTeam = firstRow.querySelector(".left").text.trim();
			const _awayTeam = firstRow.querySelector(".right").text.trim();

			//Round
			const [ignore, roundStr] = secondRow.text.split("Round");
			const round = roundStr && roundStr.replace(/\D/g, "");

			//TV
			let tv = null;
			if (thirdRow && thirdRow.querySelector("img")) {
				const tvImageName = thirdRow
					.querySelector("img")
					.rawAttributes.src.split("/")
					.pop();
				if (tvImageName.includes("sky-sports")) {
					tv = "sky";
				} else if (tvImageName.includes("bbc")) {
					tv = "bbc";
				}
			}

			//Core Game Object
			games.push({
				externalId,
				date,
				round,
				_homeTeam,
				_awayTeam,
				tv
			});
		}
	}
	return games;
}

export async function crawlLocalGames(req, res) {
	const games = await crawlFixtures();
	const localTeamObject = await Team.findById(localTeam, "name.short");
	const localTeamName = localTeamObject.name.short;
	const filteredGames = _.chain(games)
		.filter(g => [g.home, g.away].indexOf(localTeamName) > -1)
		.map(g => ({
			...g,
			isAway: g.away === localTeamName,
			_opposition: g.home === localTeamName ? g.away : g.home,
			home: undefined,
			away: undefined
		}))
		.value();
	res.send(filteredGames);
}
