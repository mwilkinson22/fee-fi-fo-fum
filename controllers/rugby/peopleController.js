//Modules
import _ from "lodash";
import mongoose from "mongoose";

//Mongoose
const collectionName = "people";
const Person = mongoose.model(collectionName);
const Game = mongoose.model("games");

//Helpers
import { getListsAndSlugs } from "../genericController";
import PregameImage from "~/images/PregameImage";
import { addEligiblePlayers } from "~/controllers/rugby/gamesController";
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
		.populate({ path: "_represents" });
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

export async function searchNames(req, res) {
	const names = decodeURI(req.params.names).split(",");
	const processedNames = {};
	for (const name of names) {
		//Exact results
		const exact = await Person.searchByName(name, true);

		//Near results
		const idsToSkip = _.map(exact, person => person._id);
		const near = await Person.searchByName(name.split(" ").pop(), false, {
			_id: { $nin: idsToSkip }
		});

		processedNames[name] = { exact, near };
	}

	res.send(processedNames);
}
