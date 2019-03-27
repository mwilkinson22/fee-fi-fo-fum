//Mongoose
import mongoose from "mongoose";
import { getListsAndSlugs } from "../genericController";
const collectionName = "teams";
const Team = mongoose.model(collectionName);
const TeamTypes = mongoose.model("teamTypes");

//Modules
const _ = require("lodash");
const { ObjectId } = require("mongodb");
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
			_.find(squad.players, player => player.number == 21).number = 21;
			squad.players = _.map(req.body, (data, _player) => {
				const { number, onLoan, from, to } = data;
				return {
					number: number === "" ? null : number,
					onLoan,
					from: from === "" ? null : new Date(from),
					to: to === "" ? null : new Date(to),
					_player
				};
			});

			await team.save();
			await getUpdatedTeam(_id, res);
		}
	}
}
