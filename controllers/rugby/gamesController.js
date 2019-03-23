//Mongoose
import mongoose from "mongoose";
const collectionName = "games";
const Game = mongoose.model(collectionName);

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
	})
		.populate({
			path: "_opposition",
			select: "name colours hashtagPrefix image"
		})
		.populate({
			path: "_ground",
			populate: {
				path: "address._city"
			}
		})
		.populate({
			path: "_competition",
			select: "name _parentCompetition appendCompetitionName instances instance",
			populate: {
				path: "_parentCompetition",
				select: "name"
			}
		});

	//Purge instances, use instance key instead

	games.map(game => {
		const year = new Date(game.date).getFullYear();
		game.instance = game._competition.instances.filter(
			instance => instance.year === null || instance.year == year
		)[0];
	});

	res.send(_.keyBy(games, "_id"));
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

		res.send(game);
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

		res.send(game);
	}
}
