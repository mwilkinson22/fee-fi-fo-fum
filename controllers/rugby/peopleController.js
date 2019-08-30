//Modules
import _ from "lodash";
import mongoose from "mongoose";

//Mongoose
const collectionName = "people";
const Person = mongoose.model(collectionName);
const Game = mongoose.model("games");

//Helpers
import { getListsAndSlugs } from "../genericController";
const { earliestGiantsData } = require("../../config/keys");

//To Delete
const { ObjectId } = require("mongodb");

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
	const { localTeam } = require("../../config/keys");

	//Get Core Data
	const doc = await Person.findById(id)
		.populate({ path: "_hometown", populate: { path: "_country" } })
		.populate({ path: "_represents" })
		.populate({ path: "_sponsor" });
	const person = JSON.parse(JSON.stringify(doc));

	//Get Stat Years
	if (person.isPlayer) {
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
		person.playerStatYears = _.chain(games)
			.keyBy("_id")
			.mapValues(g => g.teamTypes)
			.value();
	}

	res.send(person);
}

export async function setExternalNames(req, res) {
	for (const obj of req.body) {
		await Person.findByIdAndUpdate(obj._player, { externalName: obj.name });
	}
	res.send({});
}
