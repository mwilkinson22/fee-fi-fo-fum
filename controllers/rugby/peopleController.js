//Modules
import _ from "lodash";
import mongoose from "mongoose";

//Mongoose
const collectionName = "people";
const Person = mongoose.model(collectionName);
const Game = mongoose.model("games");

//Constants
const { localTeam } = require("../../config/keys");
const { earliestGiantsData } = require("../../config/keys");

//To Delete
const { ObjectId } = require("mongodb");

//Helpers
import { getListsAndSlugs } from "../genericController";

async function validatePerson(_id, res) {
	if (!_id) {
		res.status(400).send(`No id provided`);
	}

	const person = await Person.findById(_id);
	if (person) {
		return person;
	} else {
		res.status(404).send(`No person found with id ${_id}`);
		return false;
	}
}

async function getPlayingYears(id) {
	const games = await Game.aggregate([
		{
			$match: {
				date: {
					$gte: new Date(`${earliestGiantsData}-01-01`)
				},
				playerStats: {
					$elemMatch: {
						_team: ObjectId(localTeam),
						_player: ObjectId(id)
					}
				}
			}
		},
		{
			$group: {
				_id: {
					$year: "$date"
				},
				teamTypes: { $addToSet: "$_teamType" }
			}
		},
		{
			$unwind: "$_id"
		},
		{
			$sort: {
				_id: -1
			}
		}
	]);
	return _.chain(games)
		.keyBy("_id")
		.mapValues(g => g.teamTypes)
		.value();
}

async function getReffedGames(_id) {
	const reffedGames = await Game.find(
		{
			$or: [{ _referee: _id }, { _video_referee: _id }]
		},
		"slug date"
	).lean();

	return reffedGames;
}

//Getters
export async function getList(req, res) {
	const people = await Person.find(
		{},
		"name isPlayer isCoach isReferee playingPositions coachDetails slug image gender twitter"
	).lean();
	const { list, slugMap } = await getListsAndSlugs(people, collectionName);
	res.send({ peopleList: list, slugMap });
}

export async function getPerson(req, res) {
	const { id } = req.params;

	//Get Core Data
	const doc = await Person.findById(id)
		.populate({ path: "_hometown", populate: { path: "_country" } })
		.populate({ path: "_represents" })
		.populate({ path: "_sponsor" });
	const person = JSON.parse(JSON.stringify(doc));

	//Get Stat Years
	if (person.isPlayer) {
		person.playerStatYears = await getPlayingYears(id);
	}

	//Get Reffed Games
	if (person.isReferee) {
		person.reffedGames = await getReffedGames(id);
	}

	res.send(person);
}

//Create
export async function createPerson(req, res) {
	const { name } = req.body;
	req.body.slug = await Person.generateSlug(name.first, name.last);
	const person = new Person(req.body);
	await person.save();

	req.params.id = person._id;
	await getPerson(req, res);
}

//Update
export async function updatePerson(req, res) {
	const { id } = req.params;
	const person = await validatePerson(id, res);

	if (person) {
		await person.updateOne(req.body);

		await getPerson(req, res);
	}
}

export async function setExternalNames(req, res) {
	for (const obj of req.body) {
		await Person.findByIdAndUpdate(obj._player, { externalName: obj.name });
	}
	res.send({});
}

//Deleter
export async function deletePerson(req, res) {
	const { _id } = req.params;
	const person = await validatePerson(_id, res);
	if (person) {
		const errors = [];
		const toLog = {};

		//Check for news posts
		const NewsPost = mongoose.model("newsPosts");
		const newsPosts = await NewsPost.find({ _people: _id }, "title slug").lean();
		if (newsPosts.length) {
			errors.push(
				`linked to ${newsPosts.length} news ${newsPosts.length === 1 ? "post" : "posts"}`
			);
			toLog.newsPosts = newsPosts;
		}

		//Check for team squads
		const Team = mongoose.model("teams");
		const teams = await Team.find({ "squads.players._player": _id }, "name squads").lean();
		if (teams.length) {
			toLog.teams = _.chain(teams)
				.map(t => {
					const squads = t.squads
						.filter(s => s.players.find(p => p._player == _id))
						.map(({ year, _teamType, _id }) => ({ year, _teamType, _id }));
					return [t.name.long, _.orderBy(squads, "year", "desc")];
				})
				.fromPairs()
				.value();
			const squadCount = _.chain(toLog.teams)
				.values()
				.flatten()
				.value().length;

			errors.push(
				`part of ${squadCount} ${squadCount === 1 ? "squad" : "squads"} in ${
					teams.length
				} ${teams.length === 1 ? "team" : "teams"}`
			);
		}

		//Check for reffed games
		const reffedGames = await getReffedGames(_id);
		if (reffedGames.length) {
			errors.push(
				`a referee for ${reffedGames.length} ${reffedGames.length === 1 ? "game" : "games"}`
			);
			toLog.reffedGames = reffedGames;
		}

		if (errors.length) {
			let errorList;
			if (errors.length === 1) {
				errorList = errors[0];
			} else {
				const lastError = errors.pop();
				errorList = `${errors.join(", ")} & ${lastError}`;
			}
			res.status(409).send({
				error: `Cannot delete ${person.name.first}, as ${
					person.gender == "M" ? "he" : "she"
				} is ${errorList}`,
				toLog
			});
			return false;
		} else {
			await person.remove();
			res.send({});
		}
	}
}
