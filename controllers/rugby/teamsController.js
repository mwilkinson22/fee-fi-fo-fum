//Mongoose
import mongoose from "mongoose";
import { getListsAndSlugs } from "../genericController";
const collectionName = "teams";
const Team = mongoose.model(collectionName);
const TeamTypes = mongoose.model("teamTypes");
const Person = mongoose.model("people");

//Modules
const _ = require("lodash");

//Helpers
async function getUpdatedTeam(id, res) {
	//To be called after post/put methods
	const team = await Team.findById([id]).fullTeam();
	res.send({ [id]: team });
}

//Getters
export async function getList(req, res) {
	const teams = await Team.find({}, "name colours images slug").lean();

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
	res.send(_.keyBy(teamTypes, "_id"));
}

export async function updateTeam(req, res) {
	const { _id } = req.params;
	const team = await Team.findById(_id);
	if (!team) {
		res.status(404).send(`No team with id ${_id} was found`);
	} else {
		//Handle Plain Text Fields
		const values = _.mapValues(req.body, (val, key) => {
			switch (key) {
				case "_defaultGround":
					return val.value;
				case "colours":
					if (!val.customPitchColour) {
						val.pitchColour = null;
					}
					if (!val.customStatBarColour) {
						val.statBarColour = null;
					}
					return val;
				case "_grounds":
					return _.chain(val)
						.map((ground, _teamType) => {
							if (ground && ground.value) {
								return { _ground: ground.value, _teamType };
							}
						})
						.filter(_.identity)
						.value();
				default:
					return val;
			}
		});
		await Team.updateOne({ _id }, values);
		await getUpdatedTeam(_id, res);
	}
}

async function processBulkSquadAdd(data, teamTypeId) {
	const results = [];
	for (const row of _.values(data)) {
		const { number, onLoan, from, to, nameSelect, nameString } = row;
		let person;

		//Create New Player
		if (nameSelect.value === "skip") {
			continue;
		} else if (nameSelect.value === "new") {
			//Generate Slug
			const slug = await Person.generateSlug(nameString.first, nameString.last);

			//Get Gender
			const teamType = await TeamTypes.findById(teamTypeId);
			const { gender } = teamType;

			person = new Person({
				name: nameString,
				isPlayer: true,
				slug,
				gender
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

export async function createSquad(req, res) {
	const { _id } = req.params;
	const team = await Team.findById(_id);
	if (!team) {
		res.status(404).send(`No team with id ${_id} was found`);
	} else {
		const { players, _teamType, year } = req.body;
		const processedPlayers = await processBulkSquadAdd(players, _teamType);
		const newSquad = {
			year,
			_teamType,
			players: processedPlayers
		};

		team.squads.push(newSquad);
		await team.save();
		await getUpdatedTeam(_id, res);
	}
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
			const newSquad = await processBulkSquadAdd(req.body, squad._teamType);
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

			//Remove Empty Squad
			if (!squad.players.length) {
				team.squads = _.reject(team.squads, s => s._id == squadId);
			}

			await team.save();
			await getUpdatedTeam(_id, res);
		}
	}
}
