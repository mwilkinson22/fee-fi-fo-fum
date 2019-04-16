//Mongoose
import mongoose from "mongoose";
const collectionName = "games";
const Game = mongoose.model(collectionName);
const NeutralGame = mongoose.model("neutralGames");
const Team = mongoose.model("teams");

//Modules
import _ from "lodash";
import { getListsAndSlugs } from "../genericController";
import { parse } from "node-html-parser";
import axios from "axios";

//Config
const { localTeam, fixtureCrawlUrl } = require("../../config/keys");

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

export async function getNeutralGames(req, res) {
	const games = await NeutralGame.find({});
	res.send(_.keyBy(games, "_id"));
}

async function getUpdatedGame(id, res) {
	//To be called after post/put methods
	const game = await Game.findById([id]).fullGame();
	res.send({ [id]: game });
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

async function getUpdatedNeutralGames(ids, res) {
	//To be called after post/put methods
	const games = await NeutralGame.find({ _id: { $in: ids } }).lean();
	res.send(_.keyBy(games, "_id"));
}

export async function createNeutralGames(req, res) {
	const bulkOperation = _.map(req.body, (document, id) => {
		return {
			insertOne: { document }
		};
	});
	const newGames = await NeutralGame.bulkWrite(bulkOperation);
	await getUpdatedNeutralGames(_.values(newGames.insertedIds), res);
}

export async function updateNeutralGames(req, res) {
	const bulkOperation = _.map(req.body, (data, id) => {
		return {
			updateOne: {
				filter: { _id: id },
				update: data
			}
		};
	});
	if (bulkOperation.length > 0) {
		await NeutralGame.bulkWrite(bulkOperation);
		await getUpdatedNeutralGames(Object.keys(req.body), res);
	} else {
		res.send({});
	}
}

export async function deleteNeutralGame(req, res) {
	const { _id } = req.params;
	await NeutralGame.deleteOne({ _id: req.params });
	res.send(_id);
}

//External Getters
async function crawlFixtures() {
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

export async function crawlNeutralGames(req, res) {
	const games = await crawlFixtures();
	const localTeamObject = await Team.findById(localTeam, "name.short");
	const filteredGames = _.chain(games)
		.reject(g => [g.home, g.away].indexOf(localTeamObject.name.short) > -1)
		.map(g => ({ ...g, externalSite: "SL", tv: undefined, round: undefined }))
		.value();
	res.send(filteredGames);
}

export async function crawlAndUpdateNeutralGames(req, res) {
	const games = await NeutralGame.find(
		{
			externalSync: true,
			externalId: { $ne: null },
			externalSite: { $ne: null },
			date: {
				$gt: new Date().addDays(-2),
				$lte: new Date().addHours(-2)
			}
		},
		"_id externalId externalSite"
	).lean();

	const values = {};

	for (const game of games) {
		const { _id, externalId, externalSite } = game;
		let url;
		switch (externalSite) {
			case "RFL":
				url = `https://www.rugby-league.com/challengecup/match_report/${externalId}`;
				break;
			case "SL":
				url = `https://www.superleague.co.uk/match-centre/report/${externalId}`;
				break;
			default:
				continue;
		}

		const { data } = await axios.get(url);
		const html = parse(data);

		if (externalSite === "SL") {
			const [homePoints, awayPoints] = html.querySelectorAll(".matchreportheader .col-2 h2");
			values[_id] = {
				homePoints: homePoints.text.trim(),
				awayPoints: awayPoints.text.trim()
			};
		}

		if (externalSite === "RFL") {
			const [homePoints, awayPoints] = html.querySelector(".overview h3").text.match(/\d+/gi);
			values[_id] = {
				homePoints,
				awayPoints
			};
		}
	}
	await updateNeutralGames({ body: values }, res);
}
