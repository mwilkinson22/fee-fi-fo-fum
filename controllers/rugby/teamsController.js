//Mongoose
import mongoose from "mongoose";
import { getListsAndSlugs } from "../genericController";
const collectionName = "teams";
const Team = mongoose.model(collectionName);
const TeamTypes = mongoose.model("teamTypes");
const Person = mongoose.model("people");

//Modules
const _ = require("lodash");
const Colour = require("color");

//Helpers
async function getUpdatedTeam(id, res) {
	//To be called after post/put methods
	const team = await Team.findById([id]).fullTeam();
	res.send({ [id]: team });
}

//Getters
export async function getList(req, res) {
	const teams = await Team.find({}, "name colours image slug").lean();

	const { list, slugMap } = await getListsAndSlugs(teams, collectionName);
	res.send({ teamList: list, slugMap });
}

export async function getTeam(req, res) {
	const { id } = req.params;
	const team = await Team.findById(id).fullTeam();
	res.send({ [team._id]: team });
}

export async function getTeamTypes(req, res) {
	const teamTypes = await TeamTypes.find({}).sort({ sortOrder: 1 });
	res.send(teamTypes);
}

export async function update(req, res) {
	const { _id } = req.params;
	const team = await Team.findById(_id);
	if (!team) {
		res.status(404).send(`No team with id ${_id} was found`);
	} else {
		//Handle Plain Text Fields
		const values = _.mapValues(req.body, (val, key) => {
			switch (key) {
				case "_ground":
					return val.value;
				case "colours":
					if (!val.customPitchColour) {
						val.pitchColour = null;
					}
					if (!val.customStatBarColour) {
						val.statBarColour = null;
					}
					return _.mapValues(val, colour => {
						if (typeof colour === "string") {
							return Colour(colour)
								.rgb()
								.array();
						} else {
							return colour;
						}
					});
				default:
					return val;
			}
		});
		await Team.updateOne({ _id }, values);
		await getUpdatedTeam(_id, res);
	}
}

async function processBulkSquadAdd(data) {
	const results = [];
	for (const row of _.values(data)) {
		const { number, onLoan, from, to, nameSelect, nameString } = row;
		let person;

		//Create New Player
		if (nameSelect.value === "skip") {
			continue;
		} else if (nameSelect.value === "new") {
			person = new Person({
				name: nameString,
				isPlayer: true
			});
			await person.save();
		} else {
			person = await Person.findById(nameSelect.value);
		}

		results.push({
			_player: person._id,
			onLoan,
			from: from.length ? from : null,
			to: to.length ? to : null,
			number: number.length ? number : null
		});
	}

	return results;
}

export async function appendSquad(req, res) {
	const { _id, squadId } = req.params;
	const team = await Team.findById(_id);
	if (!team) {
		res.status(404).send(`No team with id ${_id} was found`);
	} else {
		const squad = _.find(team.squads, squad => squad._id == squadId);
		if (!squad) {
			res.status(404).send({
				error: `No squad with id ${squadId} found for ${team.name.long}`
			});
		} else {
			const newSquad = await processBulkSquadAdd(req.body);
			squad.players.push(...newSquad);
			await team.save();
			await getUpdatedTeam(_id, res);
		}
	}
}

export async function updateSquad(req, res) {
	const { _id, squadId } = req.params;
	const team = await Team.findById(_id);
	if (!team) {
		res.status(404).send(`No team with id ${_id} was found`);
	} else {
		const squad = _.find(team.squads, squad => squad._id == squadId);
		if (!squad) {
			res.status(404).send({
				error: `No squad with id ${squadId} found for ${team.name.long}`
			});
		} else {
			squad.players = _.chain(req.body)
				.map((data, _player) => {
					const { number, onLoan, from, to, deletePlayer } = data;
					if (deletePlayer) {
						return null;
					}
					return {
						number: number === "" ? null : number,
						onLoan,
						from: from === "" ? null : new Date(from),
						to: to === "" ? null : new Date(to),
						_player
					};
				})
				.filter(_.identity)
				.value();

			await team.save();
			await getUpdatedTeam(_id, res);
		}
	}
}
