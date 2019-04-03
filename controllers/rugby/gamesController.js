//Mongoose
import mongoose from "mongoose";
const collectionName = "games";
const Game = mongoose.model(collectionName);
const NeutralGame = mongoose.model("neutralGames");

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
	}).fullGame();

	res.send(_.keyBy(games, "_id"));
}

export async function getNeutralGames(req, res) {
	const games = await NeutralGame.find({})
		.populate({ path: "home", select: "name image" })
		.populate({ path: "away", select: "name image" })
		.populate({ path: "_competition", select: "name" });
	res.send(games);
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
