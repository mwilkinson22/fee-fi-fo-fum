//Mongoose
import _ from "lodash";
import mongoose from "mongoose";
const collectionName = "teamSelectors";
const TeamSelector = mongoose.model(collectionName);
const Team = mongoose.model("teams");
const Person = mongoose.model("people");

//Constants
import { teamSelectors as listProperties } from "~/constants/listProperties";

//Image
import SquadImage from "~/images/SquadImage";

//Helper
import { postToSocial } from "./oAuthController";

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
		select: "name playingPositions"
	});

	//Convert to json object
	selector = JSON.parse(JSON.stringify(selector));

	//Set choices for active user
	const activeUserChoices = selector.choices.find(({ ip }) => ip == req.ipAddress);
	if (activeUserChoices) {
		selector.activeUserChoices = activeUserChoices.squad;
	}

	//Remove other choices for non-admins
	if (!req.user || !req.user.isAdmin) {
		delete selector.choices;
	}

	res.send(selector);
}

export async function getPreviewImage(req, res) {
	const { _id } = req.params;
	const selector = await validateTeamSelector(_id, res);

	if (selector) {
		const image = await generateImage(req, res, selector);
		if (image) {
			const output = await image.render(false);
			res.send([output]);
		}
	}
}

export async function getAllTeamSelectors(req, res) {
	const selectors = await TeamSelector.find({}, listProperties.join(" ")).lean();

	res.send(_.keyBy(selectors, "_id"));
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

export async function shareSelector(req, res) {
	const { _id } = req.params;
	const selector = await validateTeamSelector(_id, res);

	if (selector) {
		const { service, text } = req.body;

		//Get keys from the session
		const keys = req.session.oAuthAccounts[service];

		//Ensure they exist, and match what we received
		if (!keys || keys.access_token != req.body.access_token) {
			res.status(401).send("Invalid credentials");
			return;
		}

		//Get Image
		const imageClass = await generateImage(req, res, selector);
		const image = await imageClass.render(true);

		const result = await postToSocial(service, text, { keys, images: [image] });

		if (result.success) {
			res.send(result.post);
		} else {
			res.status(result.error.statusCode).send(result.error.message);
		}
	}
}

export async function generateImage(req, res, selector) {
	//Get active user choices
	const activeUserChoices = selector.choices.find(({ ip }) => ip == req.ipAddress);
	if (!activeUserChoices) {
		res.status(404).send("No selection found for current IP address");
		return;
	}
	const { squad } = activeUserChoices;

	//Get main player info
	const playerData = await Person.find(
		{ _id: { $in: squad } },
		"name images nickname displayNicknameInCanvases squadNameWhenDuplicate gender"
	).lean();

	//Get squad numbers
	let squadNumbers = [];
	if (selector.numberFromSquad) {
		const team = await Team.findById(selector.numberFromTeam, "squads").lean();
		const squad = team.squads.find(({ _id }) => _id.toString() == selector.numberFromSquad);
		squadNumbers = squad ? squad.players : [];
	}

	const players = squad.map(playerId => {
		//Player Data
		const player = playerData.find(({ _id }) => _id.toString() == playerId);

		//Number
		const squadEntry = squadNumbers.find(({ _player }) => _player.toString() == playerId);
		const number = squadEntry ? squadEntry.number : "";

		return {
			number,
			...player
		};
	});

	return new SquadImage(players, { selector, siteUrl: req.get("host") });
}
