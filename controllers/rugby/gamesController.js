//Mongoose
import mongoose from "mongoose";
const collectionName = "games";
const Game = mongoose.model(collectionName);
const Team = mongoose.model("teams");

//Modules
import _ from "lodash";
import { getListsAndSlugs } from "../genericController";
import { parse } from "node-html-parser";
import axios from "axios";
import twitter from "~/services/twitter";

//Constants
const { localTeam, fixtureCrawlUrl } = require("../../config/keys");
import gameEvents from "~/constants/gameEvents";

//Helpers
import { parseExternalGame } from "~/helpers/gameHelper";

//Images
import PregameImage from "~/images/PregameImage";
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
		res.status(404).send(`No game with id ${_id} was found`);
		return false;
	}
}

async function processBasics(values) {
	//Combine datetime
	values.date = new Date(`${values.date} ${values.time}`);
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
	const nullable = [
		"customHashtags",
		"round",
		"title",
		"tv",
		"_referee",
		"_video_referee",
		"attendance"
	];
	_.each(nullable, prop => (values[prop] === "" ? (values[prop] = null) : null));

	//Split Hashtags
	if (values.customHashtags) {
		values.customHashtags = values.customHashtags.match(/[A-Za-z0-9]+/gi);
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

async function addEligiblePlayers(games) {
	//Get All Full Teams
	const teamIds = [localTeam, ...games.map(g => g._opposition._id)];
	let teams = await Team.find({ _id: { $in: teamIds } }, "squads").populate({
		path: "squads.players._player",
		select:
			"name playerDetails nickname displayNicknameInCanvases squadNameWhenDuplicate image slug"
	});
	teams = _.keyBy(teams, "_id");

	//Loop each game
	games = games.map(g => {
		const game = JSON.parse(JSON.stringify(g));

		const year = new Date(game.date).getFullYear();

		//Loop local and opposition teams
		game.eligiblePlayers = _.chain([localTeam, game._opposition._id])
			.map(id => {
				const team = teams[id];
				const squad = _.find(
					team.squads,
					squad =>
						squad.year == year &&
						squad._teamType.toString() == game._teamType.toString()
				);
				return [id, squad ? squad.players : []];
			})
			.fromPairs()
			.value();

		return game;
	});

	return games;
}

async function getUpdatedGame(id, res) {
	//Get Full Game
	let game = await Game.findById(id).fullGame();
	game = await addEligiblePlayers([game]);
	const fullGames = _.keyBy(game, "_id");

	//Get Game For List
	const list = await processList();

	res.send({ id, fullGames, ...list });
}

async function processList() {
	const games = await Game.find({})
		.forList()
		.lean();

	const { list, slugMap } = await getListsAndSlugs(games, collectionName);
	return { gameList: list, slugMap };
}

//Getters
export async function getList(req, res) {
	const list = await processList();
	res.send(list);
}

export async function getGames(req, res) {
	const { ids } = req.params;
	let games = await Game.find({
		_id: {
			$in: ids.split(",")
		}
	}).fullGame();

	games = await addEligiblePlayers(games);

	res.send(_.keyBy(games, "_id"));
}

//Create New Game
export async function addGame(req, res) {
	const values = await processBasics(req.body);
	values.slug = await Game.generateSlug(values);
	const game = new Game(values);
	await game.save();
	await getUpdatedGame(game._id, res);
}

//Updaters
export async function updateGameBasics(req, res) {
	const { _id } = req.params;
	const game = await validateGame(_id, res);
	if (game) {
		const values = await processBasics(req.body);

		await Game.updateOne({ _id }, values);

		await getUpdatedGame(_id, res);
	}
}

export async function setPregameSquads(req, res) {
	const { _id } = req.params;
	const game = await validateGame(_id, res);
	if (game) {
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

		await getUpdatedGame(_id, res);
	}
}

export async function markSquadsAsAnnounced(req, res) {
	const { _id } = req.params;
	const game = await validateGame(_id, res);
	if (game) {
		game.squadsAnnounced = req.body.announced;
		await game.save();
		await getUpdatedGame(_id, res);
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
		await getUpdatedGame(_id, res);
	}
}

export async function handleEvent(req, res) {
	const { _id } = req.params;
	const { event, player } = req.body;

	if (!gameEvents[event]) {
		res.status(500).send({ error: `Invalid event type '${event}'` });
		return false;
	}

	//If the event is valid
	let game = await validateGame(_id, res, Game.findById(_id).gameDayImage());
	if (game) {
		const { postTweet, tweet, replyTweet } = req.body;

		//Create Event Object
		const eventObject = {
			event
		};

		//Update Database for Player Events
		if (gameEvents[event].isPlayerEvent) {
			eventObject.inDatabase = true;
			eventObject._player = player;
			game = await Game.findOneAndUpdate(
				{ _id },
				{ $inc: { [`playerStats.$[elem].stats.${event}`]: 1 } },
				{
					new: true,
					arrayFilters: [{ "elem._player": mongoose.Types.ObjectId(player) }]
				}
			).gameDayImage();
		} else if (event == "extraTime") {
			eventObject.inDatabase = true;
			game.extraTime = true;
			await game.save();
		}

		//Post Tweet
		if (postTweet) {
			//Create Image
			let image;
			let media_ids = null;
			if (event !== "none") {
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

					const imageModel = await generatePlayerEventImage(player, imageEvent, game);
					image = await imageModel.render(true);
				} else {
					const imageModel = await new GameEventImage(game, event);
					image = await imageModel.render(true);
				}
				const upload = await twitter.post("media/upload", {
					media_data: image
				});
				const { media_id_string } = upload.data;
				media_ids = [media_id_string];
			}

			//Post Tweet
			const postedTweet = await twitter.post("statuses/update", {
				status: tweet,
				in_reply_to_status_id: replyTweet,
				auto_populate_reply_metadata: true,
				tweet_mode: "extended",
				media_ids
			});

			eventObject.tweet_text = tweet;
			eventObject.tweet_id = postedTweet.data.id_str;
			const tweetMediaObject = postedTweet.data.entities.media;
			if (tweetMediaObject) {
				eventObject.tweet_image = tweetMediaObject[0].media_url;
			}
		}

		//Add Event
		await game.events.push(eventObject);
		await game.save();

		//Return Updated Game
		await getUpdatedGame(_id, res);
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
			res.status(500).send({ error: `Event '${_event}' not found` });
		} else {
			const { event, tweet_id, _player } = e;
			//Delete Tweet
			if (deleteTweet && tweet_id) {
				await twitter.post(`statuses/destroy/${tweet_id}`);
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
			await getUpdatedGame(_id, res);
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
		await getUpdatedGame(_id, res);
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
	const Person = mongoose.model("people");
	await Person.updateMany({}, { $unset: { rflSiteId: 1 } }, { multi: true, $multi: true });
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
async function generatePregameImage(game, forTwitter, options = {}) {
	const [gameWithSquads] = await addEligiblePlayers([game]);
	const imageClass = new PregameImage(gameWithSquads, options);
	const image = await imageClass.render(forTwitter);
	return image;
}

export async function fetchPregameImage(req, res) {
	const { _id } = req.params;

	const game = await validateGame(_id, res, Game.findById(_id).pregameImage());

	if (game) {
		const image = await generatePregameImage(game, false, req.query);
		res.send(image);
	}
}

export async function postPregameImage(req, res) {
	const { _id } = req.params;

	const game = await validateGame(_id, res, Game.findById(_id).pregameImage());

	if (game) {
		const image = await generatePregameImage(game, true, req.query);
		const upload = await twitter.post("media/upload", {
			media_data: image
		});
		const { media_id_string } = upload.data;
		const tweet = await twitter.post("statuses/update", {
			status: req.body.tweet,
			in_reply_to_status_id: req.body.replyTweet,
			auto_populate_reply_metadata: true,
			media_ids: [media_id_string]
		});

		res.send(tweet);
	}
}

async function generateSquadImage(game, showOpposition, forTwitter) {
	const [gameWithSquads] = await addEligiblePlayers([game]);
	const imageClass = new SquadImage(gameWithSquads, { showOpposition });
	const image = await imageClass.render(forTwitter);
	return image;
}

export async function fetchSquadImage(req, res) {
	const { _id } = req.params;
	const { showOpposition } = req.query;

	const game = await validateGame(_id, res, Game.findById(_id).gameDayImage());

	if (game) {
		const image = await generateSquadImage(game, showOpposition === "true", false);
		res.send(image);
	}
}

export async function postSquadImage(req, res) {
	const { _id } = req.params;

	const game = await validateGame(_id, res, Game.findById(_id).gameDayImage());

	if (game) {
		const image = await generateSquadImage(game, req.body.showOpposition, true);
		const upload = await twitter.post("media/upload", {
			media_data: image
		});
		const { media_id_string } = upload.data;
		const tweet = await twitter.post("statuses/update", {
			status: req.body.tweet,
			in_reply_to_status_id: req.body.replyTweet,
			auto_populate_reply_metadata: true,
			media_ids: [media_id_string]
		});

		res.send(tweet);
	}
}

async function generatePlayerEventImage(player, event, basicGame) {
	const [game] = await addEligiblePlayers([basicGame]);
	const image = new PlayerEventImage(player, { game });
	await image.drawGameData();
	await image.drawGameEvent(event);
	return image;
}

export async function fetchEventImage(req, res) {
	const { _id } = req.params;
	const { event, player } = req.body;
	if (!gameEvents[event]) {
		res.send({});
	} else {
		const game = await Game.findById(_id).gameDayImage();
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
