//Mongoose
import mongoose from "mongoose";
const collectionName = "grounds";
const Ground = mongoose.model(collectionName);

//Helpers
import { getListsAndSlugs } from "../genericController";

async function validateGround(_id, res) {
	if (!_id) {
		res.status(400).send(`No id provided`);
	}

	const ground = await Ground.findById(_id).forList();
	if (ground) {
		return ground;
	} else {
		res.status(404).send(`No ground found with id ${_id}`);
		return false;
	}
}

//Getters
export async function getGroundsList(req, res) {
	const grounds = await Ground.find({}).forList();

	const { list, slugMap } = await getListsAndSlugs(grounds, collectionName);

	res.send({ groundList: list, slugMap });
}

//POSTers
export async function createGround(req, res) {
	const slug = await Ground.generateSlug(req.body);
	const ground = new Ground({
		...req.body,
		slug
	});
	await ground.save();
	const savedGround = await Ground.findById(ground._id).forList();
	res.send(savedGround);
}

//Putters
export async function updateGround(req, res) {
	const { _id } = req.params;
	const ground = await validateGround(_id, res);
	if (ground) {
		await ground.updateOne(req.body);
		const updatedGround = await Ground.findById(_id).forList();
		res.send(updatedGround);
	}
}

//Deleter
export async function deleteGround(req, res) {
	const { _id } = req.params;
	const ground = await validateGround(_id, res);
	if (ground) {
		const Game = mongoose.model("games");
		const games = await Game.find({ _ground: _id }, "slug").lean();

		const Team = mongoose.model("teams");
		const teams = await Team.find(
			{ $or: [{ _defaultGround: _id }, { "_grounds._ground": _id }] },
			"name slug"
		).lean();

		if (games.length || teams.length) {
			let error = "Ground cannot be deleted, as it is required for ";

			if (games.length) {
				error += `${games.length} ${games.length === 1 ? "game" : "games"}`;
				if (teams.length) {
					error += " & ";
				}
			}

			if (teams.length) {
				error += `${teams.length} ${teams.length === 1 ? "team" : "teams"}`;
			}

			res.status(409).send({
				error,
				toLog: { games, teams }
			});
		} else {
			await ground.remove();
			res.send({});
		}
	}
}
