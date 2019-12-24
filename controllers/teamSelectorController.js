//Mongoose
import _ from "lodash";
import mongoose from "mongoose";
const collectionName = "teamSelectors";
const TeamSelector = mongoose.model(collectionName);

//Constants
import { teamSelectors as listProperties } from "~/constants/listProperties";

export async function validateTeamSelector(_id, res) {
	if (!_id) {
		res.status(400).send(`No id provided`);
	}

	const selector = await TeamSelector.findById(_id);
	if (selector) {
		return selector;
	} else {
		res.status(404).send(`No selector found with id ${_id}`);
		return false;
	}
}

export async function getTeamSelector(req, res) {
	const { _id } = req.params;

	let selector = await TeamSelector.findById(_id).populate({
		path: "players",
		select: "name playingPositions image"
	});

	//Convert to json object
	selector = JSON.parse(JSON.stringify(selector));

	//Set choices for active user
	const activeUserChoices = selector.choices.find(({ ip }) => ip == req.ipAddress);
	selector.activeUserChoices = activeUserChoices ? activeUserChoices.squad : null;

	//Remove other choices for non-admins
	if (!req.user || !req.user.isAdmin) {
		delete selector.choices;
	}

	res.send(selector);
}

export async function getAllTeamSelectors(req, res) {
	const selector = await TeamSelector.find({}, listProperties.join(" ")).lean();

	res.send(_.keyBy(selector, "_id"));
}

export async function createTeamSelector(req, res) {
	const selector = new TeamSelector(req.body);
	await selector.save();

	//Update params to return updated selector
	req.params._id = selector._id;

	await getTeamSelector(req, res);
}

export async function updateTeamSelector(req, res) {
	const { _id } = req.params;
	const selector = await validateTeamSelector(_id, res);
	if (selector) {
		await selector.updateOne(req.body);
		await getTeamSelector(req, res);
	}
}

export async function deleteTeamSelector(req, res) {
	const { _id } = req.params;
	const selector = await validateTeamSelector(_id, res);
	if (selector) {
		await selector.remove();
		res.send({});
	}
}

export async function submitUserChoices(req, res) {
	const { _id } = req.params;
	const selector = await validateTeamSelector(_id, res);
	if (selector) {
		//Work out if we're adding an entry or updating //Check to see if we've already voted
		const { ipAddress } = req;
		const currentVote = selector.choices.find(c => c.ip === ipAddress);

		//Process data
		const squad = _.values(req.body);

		if (currentVote) {
			await TeamSelector.updateOne(
				{ _id, "choices._id": currentVote._id },
				{ $set: { "choices.$.squad": squad } }
			);
		} else {
			selector.choices.push({ ip: ipAddress, squad });
			await selector.save();
		}

		await getTeamSelector(req, res);
	}
}
