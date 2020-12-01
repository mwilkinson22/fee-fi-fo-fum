//Modules
import _ from "lodash";
import mongoose from "mongoose";
const Broadcaster = mongoose.model("broadcasters");

async function validateBroadcaster(_id, res) {
	if (!_id) {
		res.status(400).send(`No id provided`);
	}

	const broadcaster = await Broadcaster.findById(_id);
	if (broadcaster) {
		return broadcaster;
	} else {
		res.status(404).send(`No broadcaster found with id ${_id}`);
		return false;
	}
}

export async function getBroadcasters(req, res) {
	const broadcasters = await Broadcaster.find({}).lean();
	res.send(_.keyBy(broadcasters, "_id"));
}

export async function getUpdatedBroadcaster(id, res) {
	const broadcaster = await Broadcaster.findById(id).lean();
	res.send({ [id]: broadcaster });
}

export async function createBroadcaster(req, res) {
	const broadcaster = new Broadcaster(req.body);
	await broadcaster.save();
	await getUpdatedBroadcaster(broadcaster._id, res);
}

export async function updateBroadcaster(req, res) {
	const { _id } = req.params;
	const broadcaster = await validateBroadcaster(_id, res);

	if (broadcaster) {
		await broadcaster.updateOne(req.body);
		await getUpdatedBroadcaster(_id, res);
	}
}

export async function deleteBroadcaster(req, res) {
	const { _id } = req.params;
	const broadcaster = await validateBroadcaster(_id, res);

	if (broadcaster) {
		//Ensure it's not been used on a game
		const Game = mongoose.model("games");
		const games = await Game.find({ _broadcaster: _id }, "slug").lean();

		if (games.length) {
			const error = `Broadcaster cannot be deleted, as it is required for ${games.length} ${
				games.length === 1 ? "game" : "games"
			}`;

			res.status(409).send({
				error,
				toLog: { games }
			});
		} else {
			await broadcaster.remove();
			res.send({});
		}
	}
}
