//Modules
import _ from "lodash";
import mongoose from "mongoose";

//Mongoose
const Award = mongoose.model("awards");

//Helpers
function getIpAddress(req) {
	const forwarded = req.headers["x-forwarded-for"];
	return forwarded ? forwarded.split(/, /)[0] : req.connection.remoteAddress;
}

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

async function getUpdatedAward(_id, res = null) {
	if (!_id) {
		res.status(400).send(`No id provided`);
	}
	const award = await Award.findById(_id).lean();

	if (res) {
		res.send(award);
	} else {
		return award;
	}
}

//Getters
export async function getCurrent(req, res) {
	const now = new Date();
	const currentAwards = await Award.findOne({
		year: now.getFullYear(),
		votingBegins: {
			$lte: now
		},
		votingEnds: {
			$gte: now
		}
	}).lean();

	const ip = req.query.ip || getIpAddress(req);
	console.log("GET CURRENT AWARDS FOR ", ip);
	if (currentAwards) {
		currentAwards.votes = currentAwards.votes.find(vote => vote.ip === ip);
		res.send(currentAwards);
	} else {
		res.send(false);
	}
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

export async function addCategory(req, res) {
	const { _id } = req.params;
	let award = await validateAward(_id, res);
	if (award) {
		const index = award.categories.push(req.body);
		await award.save();
		const categoryId = award.categories[index - 1]._id;
		res.send({ award, categoryId });
	}
}

//Updaters
export async function updateAward(req, res) {
	const { _id } = req.params;
	const award = await validateAward(_id, res);
	if (award) {
		const { categories, ...data } = req.body;

		//Reorder categories
		if (categories && categories.length) {
			data.categories = _.chain(categories)
				.map(id => award.categories.find(c => c._id == id))
				.filter(_.identity)
				.value();
			await award.save();
		}

		//Update core data
		await award.updateOne(data);

		await getUpdatedAward(_id, res);
	}
}

export async function updateCategory(req, res) {
	const { awardId, categoryId } = req.params;
	let award = await validateAward(awardId, res);
	if (award) {
		await Award.updateOne(
			{ _id: awardId, "categories._id": categoryId },
			{ $set: { "categories.$": { ...req.body, _id: categoryId } } }
		);
		await getUpdatedAward(awardId, res);
	}
}

export async function submitVotes(req, res) {
	const { _id } = req.params;
	const award = await validateAward(_id, res);
	if (award) {
		//Check to see if we've already voted
		const ip = getIpAddress(req);
		const currentVote = award.votes.find(v => v.ip === ip);

		//Process data
		const choices = _.map(req.body, (choice, categoryId) => ({ choice, categoryId }));

		if (currentVote) {
			await Award.updateOne(
				{ _id, "votes._id": currentVote._id },
				{ $set: { "votes.$.choices": choices } }
			);
		} else {
			award.votes.push({ ip, choices });
			await award.save();
		}
		console.log("SUBMITVOTES FOR", ip);

		await getCurrent(req, res);
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

export async function deleteCategory(req, res) {
	const { awardId, categoryId } = req.params;
	let award = await validateAward(awardId, res);
	if (award) {
		award.categories.pull({ _id: categoryId });
		await award.save();
		await getUpdatedAward(awardId, res);
	}
}
