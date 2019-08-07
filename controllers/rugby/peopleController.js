//Modules
import _ from "lodash";
import mongoose from "mongoose";

//Mongoose
const collectionName = "people";
const Person = mongoose.model(collectionName);
const PlayerSponsor = mongoose.model("playerSponsors");
const Game = mongoose.model("games");

//Helpers
import { getListsAndSlugs } from "../genericController";
import { addEligiblePlayers } from "~/controllers/rugby/gamesController";
import { getDirectoryList } from "~/helpers/fileHelper";
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

async function validateSponsor(_id, res) {
	if (!_id) {
		res.status(400).send(`No id provided`);
	}

	const sponsor = await PlayerSponsor.findById(_id);
	if (sponsor) {
		return sponsor;
	} else {
		res.status(404).send(`No sponsor found with id ${_id}`);
		return false;
	}
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

export async function createSponsor(req, res) {
	const sponsor = new PlayerSponsor(req.body);
	await sponsor.save();
	res.send(sponsor);
}

export async function getSponsors(req, res) {
	const sponsors = await PlayerSponsor.find({}).lean();
	res.send(_.keyBy(sponsors, "_id"));
}

export async function updateSponsor(req, res) {
	const { _id } = req.params;
	const sponsor = await validateSponsor(_id, res);
	if (sponsor) {
		await sponsor.updateOne(req.body);
		const newSponsor = await PlayerSponsor.findById(_id).lean();
		res.send(newSponsor);
	}
}

export async function deleteSponsor(req, res) {
	const { _id } = req.params;
	const sponsor = await validateSponsor(_id, res);
	if (sponsor) {
		const players = await Person.find({ _sponsor: _id }, "name").lean();
		if (players.length) {
			let error = `Sponsor cannot be deleted as it is required for ${players.length} ${
				players.length == 1 ? "player" : "players"
			}`;

			res.status(409).send({
				error,
				toLog: { players }
			});
		} else {
			await sponsor.remove();
			res.send({});
		}
	}
}

export async function getSponsorLogos(req, res) {
	const imageList = await getDirectoryList("images/sponsors/");
	res.send(imageList);
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

export async function setExternalNames(req, res) {
	for (const obj of req.body) {
		await Person.findByIdAndUpdate(obj._player, { externalName: obj.name });
	}
	res.send({});
}
