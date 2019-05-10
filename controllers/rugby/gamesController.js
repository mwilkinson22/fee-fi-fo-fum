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
import PregameImage from "~/images/PregameImage";

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

export async function getGames(req, res) {
	const { ids } = req.params;
	const games = await Game.find({
		_id: {
			$in: ids.split(",")
		}
	}).fullGame();

	res.send(_.keyBy(games, "_id"));
}

async function getUpdatedGame(id, res) {
	//To be called after post/put methods
	const game = await Game.findById([id]).fullGame();
	res.send({ [id]: game });
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
	const { event } = req.body;
	let game = await Game.findById(_id);
	if (!game) {
		res.status(500).send(`No game with id ${_id} was found`);
	} else if (!gameEvents[event]) {
		res.status(500).send({ error: `Invalid event type '${event}'` });
	} else {
		const { postTweet, tweet, replyTweet } = req.body;

		//Update Player Event
		if (gameEvents[event].isPlayerEvent) {
			const { player } = req.body;
			game = await Game.findOneAndUpdate(
				{ _id },
				{ $inc: { [`playerStats.$[elem].stats.${event}`]: 1 } },
				{
					arrayFilters: [{ "elem._player": mongoose.Types.ObjectId(player) }],
					new: true
				}
			).fullGame();
		}

		if (postTweet) {
			const scores = _.values(game.score);
			await twitter.post("statuses/update", {
				status: tweet,
				in_reply_to_status_id: replyTweet,
				auto_populate_reply_metadata: true
			});
		}

		await getUpdatedGame(_id, res);
	}
}

//Image Generators
export async function generatePregameImage(req, res) {
	const { _id } = req.params;

	const game = await Game.findById(
		_id,
		"hashtags pregameSquads isAway date _ground _opposition _competition _teamType images"
	)
		.populate({ path: "pregameSquads.squad", select: "name image" })
		.populate({
			path: "_ground",
			select: "name address._city",
			populate: { path: "address._city", select: "name" }
		})
		.populate({
			path: "_competition",
			select: "name _parentCompetition instances instance hashtagPrefix",
			populate: {
				path: "_parentCompetition",
				select: "name"
			}
		});
	if (!game) {
		res.status(500).send(`No game with id ${_id} was found`);
	} else {
		const gameJSON = JSON.parse(JSON.stringify(game));
		const imageClass = new PregameImage(gameJSON, req.query);
		const image = await imageClass.render(false);
		res.send(image);
	}
}
