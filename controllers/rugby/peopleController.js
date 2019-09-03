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

//Getters
export async function getList(req, res) {
	const people = await Person.find(
		{},
		"name isPlayer isCoach isReferee playerDetails coachDetails slug image gender twitter"
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
