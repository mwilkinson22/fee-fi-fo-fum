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

function validateTeam(team) {
	if (ObjectId.isValid(team)) {
		return ObjectId(team);
	} else {
		return false;
	}
}

//Getters
export async function getList(req, res) {
	const teams = await Team.find({}, "name colours image slug").lean();

	const { list, slugMap } = await getListsAndSlugs(teams, collectionName);
	res.send({ teamList: list, slugMap });
}

export async function getTeam(req, res) {
	const { id } = req.params;
	const team = await Team.findById(id).populate({
		path: "squads.players._player",
		select: "name position playerDetails slug isPlayer isCoach image"
	});
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
		res.status(500).send(`No team with id ${_id} was found`);
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
		const updatedTeam = await Team.findById(_id);
		res.send(updatedTeam);
	}
}
