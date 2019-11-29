//Mongoose
import mongoose from "mongoose";
const collectionName = "games";
const Game = mongoose.model(collectionName);
const Team = mongoose.model("teams");
const TeamType = mongoose.model("teamTypes");
const ics = require("ics");

//Modules
import _ from "lodash";
import { getRedirects } from "../genericController";
import { parse } from "node-html-parser";
import axios from "axios";
import twitter from "~/services/twitter";

//Constants
const { localTeam, fixtureCrawlUrl } = require("../../config/keys");
import gameEvents from "~/constants/gameEvents";
import coachTypes from "~/constants/coachTypes";

//Helpers
import { parseExternalGame, postToIfttt, convertGameToCalendarString } from "~/helpers/gameHelper";
import { uploadBase64ImageToGoogle } from "~/helpers/fileHelper";

//Images
import GameSocialCardImage from "~/images/GameSocialCardImage";
import PregameImage from "~/images/PregameImage";
import FixtureListImage from "~/images/FixtureListImage";
import SquadImage from "~/images/SquadImage";
import GameEventImage from "~/images/GameEventImage";
import PlayerEventImage from "~/images/PlayerEventImage";

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

async function processBasics(values) {
	//Handle Score Override
	// values.scoreOverride = _.chain(values.scoreOverride)
	// 	.map((points, _team) => ({ points, _team }))
	// 	.reject(({ points }) => points === null || points === "")
	// 	.value();

	//Check for empty images
	// values.images = _.chain(values.images)
	// 	.pick(["header", "midpage", "customLogo"])
	// 	.mapValues(i => i || null)
	// 	.value();

	//Filter Hashtags
	if (values.customHashtags) {
		values.customHashtags = values.customHashtags.map(tag =>
			tag.replace(/[^A-Za-z0-9]+/gi, "")
		);
	}

	//Sort ground
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
		const teamIds = [localTeam, ...games.map(g => g._opposition._id)];

		let teams = await Team.find({ _id: { $in: teamIds } }, "squads coaches")
			.populate({
				path: "squads.players._player",
				select: playerSelect.join(" "),
				...adminPlayerPopulate
			})
			.populate({ path: "coaches._person", select: "name slug" });

		teams = _.keyBy(teams, "_id");

		//Check to see if any games are valid for more than one teamType
		let teamTypes;
		if (games.filter(g => g._competition._parentCompetition.useAllSquads).length) {
			const TeamType = mongoose.model("teamTypes");
			const results = await TeamType.find({}, "_id gender");
			teamTypes = _.keyBy(results, "_id");
		}

		//Loop each game
		games = games.map(g => {
			const game = JSON.parse(JSON.stringify(g));
			const date = new Date(game.date);
			const year = date.getFullYear();

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
				const { gender } = teamTypes[game._teamType];
				validTeamTypes = _.filter(teamTypes, t => t.gender == gender).map(t =>
					t._id.toString()
				);
			} else {
				validTeamTypes = [game._teamType];
			}

			//Loop local and opposition teams
			game.eligiblePlayers = _.chain([localTeam, game._opposition._id])
				.map(id => {
					const team = teams[id];
					const squad = _.chain(team.squads)
						.filter(
							squad =>
								squad.year == year &&
								validTeamTypes.indexOf(squad._teamType.toString()) > -1
						)
						.map(s => s.players)
						.flatten()
						.uniqBy(p => p._player._id)
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
	let game = await Game.findById(id).fullGame();

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

	res.send(_.keyBy(games, "_id"));
}

//Create New Game
export async function addGame(req, res) {
	const values = await processBasics(req.body);
	values.slug = await Game.generateSlug(values);
	const game = new Game(values);
	await game.save();
	await getUpdatedGame(game._id, res, true);
}

//Updaters
export async function updateGame(req, res) {
	const { _id } = req.params;
	const game = await validateGame(_id, res);
	if (game) {
		const values = await processBasics(req.body);
		await Game.updateOne({ _id }, values);

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
				const index = _.findIndex(squad, p => p == s._player);
				if (index === -1) {
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
									"playerStats.$[elem].position": index + 1
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
			.reject(id => _.find(game.playerStats, s => s._player == id))
			.each(id => {
				bulkOperation.push({
					updateOne: {
						filter: { _id },
						update: {
							$addToSet: {
								playerStats: {
									_player: id,
									_team: team,
									position: squad.indexOf(id) + 1,
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
			await postToIfttt(_profile, tweet, eventObject.tweet_image);
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

export async function setManOfSteelPoints(req, res) {
	const { _id } = req.params;
	const game = await validateGame(_id, res);
	if (game) {
		game.manOfSteel = _.map(req.body, (_player, points) => ({ _player, points }));
		await game.save();
		await getUpdatedGame(_id, res);
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

export async function setMotm(req, res) {
	const { _id } = req.params;
	const game = await validateGame(_id, res);
	if (game) {
		const { _motm, _fan_motm, fan_motm_link } = req.body;
		const originalData = _.pick(game, ["_motm", "_fan_motm", "fan_motm_link"]);

		//Update Values
		game._motm = _motm;
		game._fan_motm = _fan_motm;
		game.fan_motm_link = fan_motm_link;

		//Add events on new data
		if (_motm != originalData._motm) {
			await game.events.push({ event: "motm", _player: _motm });
		}
		if (_fan_motm != originalData._fan_motm) {
			await game.events.push({ event: "fan_motm", _player: _fan_motm });
		}
		if (fan_motm_link != originalData._fan_motm) {
			await game.events.push({ event: "fan_motm_link", tweet_id: fan_motm_link });
		}

		//Save
		await game.save();
		await getUpdatedGame(_id, res);
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
	return new SquadImage(gameWithSquads, { showOpposition });
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
	await image.drawGameData();
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
		await postToIfttt(_profile, tweet, tweetMediaObject[0].media_url);
	}

	//Post to ifttt
	res.send(true);
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
