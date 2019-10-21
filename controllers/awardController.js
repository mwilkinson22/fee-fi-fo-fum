//Modules
import _ from "lodash";
import mongoose from "mongoose";

//Mongoose
const Award = mongoose.model("awards");

//Helpers
async function validateAward(_id, res) {
	if (!_id) {
		res.status(400).send(`No id provided`);
	}

	const award = await Award.findById(_id);
	if (award) {
		return award;
	} else {
		res.status(404).send(`No awards found with id ${_id}`);
		return false;
	}
}

async function getUpdatedAward(_id, res) {
	if (!_id) {
		res.status(400).send(`No id provided`);
	}
	const award = await Award.findById(_id).lean();
	res.send(award);
}

//Getters
export async function getCurrent(req, res) {
	const forwarded = req.headers["x-forwarded-for"];
	const ip = forwarded ? forwarded.split(/, /)[0] : req.connection.remoteAddress;
	const now = new Date();
	let awards = await Award.find({
		votingBegins: {
			$lte: now
		},
		votingEnds: {
			$gte: now
		}
	}).lean();

	awards.map(award => {
		const { votes, ...data } = award;
		const hasVoted = Boolean(votes.find(vote => vote.ip === ip));
		return { ...data, hasVoted };
	});

	res.send(awards);
}

export async function getAwards(req, res) {
	const awards = await Award.find({}).lean();
	res.send(_.keyBy(awards, "_id"));
}

//Creators
export async function createAward(req, res) {
	const data = req.body;
	data.categories = [];
	data.votes = [];
	const award = new Award(data);
	await award.save();
	const updatedAward = await getUpdatedAward(award._id, res);
	res.send(updatedAward);
}

//Updaters
export async function updateAward(req, res) {
	const { _id } = req.params;
	const award = await validateAward(_id, res);
	if (award) {
		await award.updateOne(req.body);
		await getUpdatedAward(_id, res);
	}
}

//Deleters
export async function deleteAward(req, res) {
	const { _id } = req.params;
	const award = await validateAward(_id, res);
	if (award) {
		await award.remove();
		res.send({});
	}
}
