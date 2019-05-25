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

//Constants
const { localTeam, fixtureCrawlUrl } = require("../../config/keys");
import gameEvents from "~/constants/gameEvents";

//Images
import PregameImage from "~/images/PregameImage";
import SquadImage from "~/images/SquadImage";
import GameEventImage from "~/images/GameEventImage";
import PlayerEventImage from "~/images/PlayerEventImage";

//Helpers
import twitter from "~/services/twitter";

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

//Getters
export async function getList(req, res) {
	const games = await Game.find({}, "date _teamType slug _competition").lean();

	const { list, slugMap } = await getListsAndSlugs(games, collectionName);
	res.send({ gameList: list, slugMap });
}

export async function addEligiblePlayers(games) {
	//Get All Full Teams
	const teamIds = [localTeam, ...games.map(g => g._opposition._id)];
	let teams = await Team.find({ _id: { $in: teamIds } }, "squads").populate({
		path: "squads.players._player",
		select: "name playerDetails nickname displayNicknameInCanvases squadNameWhenDuplicate image"
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

async function getUpdatedGame(id, res) {
	//To be called after post/put methods
	let game = await Game.findById(id).fullGame();
	game = await addEligiblePlayers([game]);
	res.send(_.keyBy(game, "_id"));
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

//Setters
export async function updateGameBasics(req, res) {
	const { _id } = req.params;
	const game = await Game.findById(_id);
	if (!game) {
		res.status(500).send(`No game with id ${_id} was found`);
	} else {
		const values = await processBasics(req.body);

		await Game.updateOne({ _id }, values);

		await getUpdatedGame(_id, res);
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

		await getUpdatedGame(_id, res);
	}
}
export async function setSquads(req, res) {
	const { _id } = req.params;
	const game = await Game.findById(_id);
	if (!game) {
		res.status(500).send(`No game with id ${_id} was found`);
	} else {
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
	let game = await Game.findById(_id);
	if (!game) {
		res.status(500).send(`No game with id ${_id} was found`);
	} else if (!gameEvents[event]) {
		res.status(500).send({ error: `Invalid event type '${event}'` });
	} else {
		const { postTweet, tweet, replyTweet } = req.body;

		//Create Event Object
		const eventObject = {
			event,
			_player: player
		};

		//Update Database for Player Events
		if (gameEvents[event].isPlayerEvent) {
			await Game.findOneAndUpdate(
				{ _id },
				{ $inc: { [`playerStats.$[elem].stats.${event}`]: 1 } },
				{
					arrayFilters: [{ "elem._player": mongoose.Types.ObjectId(player) }]
				}
			);
		}

		//Post Tweet
		if (postTweet) {
			//Create Image
			let image;
			let media_ids = null;
			if (event !== "none") {
				if (gameEvents[event].isPlayerEvent) {
					const gameForImage = await Game.findById(_id).squadImage();

					//Check for hat-trick
					let imageEvent = event;
					if (event === "T") {
						const { stats } = _.find(
							gameForImage._doc.playerStats,
							p => p._player._id == player
						);
						const { T } = stats;
						if (T % 3 === 0) {
							imageEvent = "HT";
						}
					}

					const imageModel = await generatePlayerEventImage(
						player,
						imageEvent,
						gameForImage
					);
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
				media_ids
			});

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

//TEMPORARY - just while we get the format for the image sorted
async function generatePlayerEventImage(player, event, basicGame) {
	const [game] = await addEligiblePlayers([basicGame]);
	const image = new PlayerEventImage(player, { game });
	await image.drawGameData();
	await image.drawGameEvent(event);
	return image;
}

export async function fetchEventImagePreview(req, res) {
	const { _id } = req.params;
	const { event, player } = req.body;
	if (!gameEvents[event]) {
		res.send({});
	} else {
		const game = await Game.findById(_id).squadImage();
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

//Image Generators
async function generatePregameImage(game, forTwitter, options = {}) {
	const [gameWithSquads] = await addEligiblePlayers([game]);
	const imageClass = new PregameImage(gameWithSquads, options);
	const image = await imageClass.render(forTwitter);
	return image;
}
export async function fetchPregameImage(req, res) {
	const { _id } = req.params;

	const game = await Game.findById(_id).pregameImage();

	if (!game) {
		res.status(500).send(`No game with id ${_id} was found`);
	} else {
		const image = await generatePregameImage(game, false, req.query);
		res.send(image);
	}
}

export async function postPregameImage(req, res) {
	const { _id } = req.params;

	const game = await Game.findById(_id).pregameImage();

	if (!game) {
		res.status(500).send(`No game with id ${_id} was found`);
	} else {
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

async function generateSquadImage(game, forTwitter) {
	const [gameWithSquads] = await addEligiblePlayers([game]);
	const imageClass = new SquadImage(gameWithSquads);
	const image = await imageClass.render(forTwitter);
	return image;
}

export async function fetchSquadImage(req, res) {
	const { _id } = req.params;

	const game = await Game.findById(_id).squadImage();

	if (!game) {
		res.status(500).send(`No game with id ${_id} was found`);
	} else {
		const image = await generateSquadImage(game, false);
		res.send(image);
	}
}

export async function postSquadImage(req, res) {
	const { _id } = req.params;

	const game = await Game.findById(_id).squadImage();

	if (!game) {
		res.status(500).send(`No game with id ${_id} was found`);
	} else {
		const image = await generateSquadImage(game, true);
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
