//Mongoose
import mongoose from "mongoose";
const collectionName = "games";
const Game = mongoose.model(collectionName);
const NeutralGame = mongoose.model("neutralGames");
const Team = mongoose.model("teams");

//Modules
import _ from "lodash";
import { parse } from "node-html-parser";
import axios from "axios";

//Constants
const { localTeam } = require("../../config/keys");

//Helpers
import { crawlFixtures } from "./gamesController";

//Getters
export async function getList(req, res) {
	const games = await NeutralGame.find({});
	res.send(_.keyBy(games, "_id"));
}

async function getUpdatedNeutralGames(ids, res) {
	//To be called after post/put methods
	const games = await NeutralGame.find({ _id: { $in: ids } }).lean();
	res.send(_.keyBy(games, "_id"));
}

//Setters
export async function createNeutralGames(req, res) {
	const bulkOperation = _.map(req.body, (document, id) => {
		return {
			insertOne: { document }
		};
	});
	const newGames = await NeutralGame.bulkWrite(bulkOperation);
	await getUpdatedNeutralGames(_.values(newGames.insertedIds), res);
}

export async function updateGames(req, res) {
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

export async function deleteGame(req, res) {
	const { _id } = req.params;
	await NeutralGame.deleteOne({ _id: req.params });
	res.send(_id);
}

//External Getters
export async function crawl(req, res) {
	const games = await crawlFixtures();
	const localTeamObject = await Team.findById(localTeam, "name.short");
	const filteredGames = _.chain(games)
		.reject(g => [g.home, g.away].indexOf(localTeamObject.name.short) > -1)
		.map(g => ({ ...g, externalSite: "SL", tv: undefined, round: undefined }))
		.value();
	res.send(filteredGames);
}

export async function crawlAndUpdate(req, res) {
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
			const header = html.querySelector(".overview h3");
			if (header) {
				const [homePoints, awayPoints] = header.text.match(/\d+/gi);
				values[_id] = {
					homePoints,
					awayPoints
				};
			}
		}
	}
	await updateGames({ body: values }, res);
}
