//Mongoose
import _ from "lodash";
import mongoose from "mongoose";
const collectionName = "teamSelectors";
const TeamSelector = mongoose.model(collectionName);
const Team = mongoose.model("teams");
const Person = mongoose.model("people");
const Game = mongoose.model("games");

//Constants
import { teamSelectors as listProperties } from "~/constants/listProperties";

//Image
import SquadImage from "~/images/SquadImage";

//Helper
import { postToSocial } from "./oAuthController";
import { getExtraGameInfo, getFullGameById, getTeamSelectorValues as getValuesFromGame } from "./rugby/gamesController";

export async function fetchTeamSelector(_id, res, returnAsMongooseObject) {
	if (!_id) {
		res.status(400).send(`No id provided`);
		return false;
	}

	//Try to get a basic selector
	let selector = await TeamSelector.findById(_id).populate({
		path: "players",
		select: "name playingPositions"
	});

	if (!selector) {
		res.status(404).send(`No selector found with id ${_id}`);
		return false;
	}

	if (returnAsMongooseObject) {
		return selector;
	}

	//Convert to json object
	selector = JSON.parse(JSON.stringify(selector));

	//Dynamically populate game data
	if (selector._game) {
		const values = await getValuesFromGame(selector._game, res);
		selector = {
			...selector,
			...values
		};
	}

	return selector;
}

export async function getTeamSelector(req, res) {
	const { _id } = req.params;

	const selector = await fetchTeamSelector(_id, res);

	if (selector) {
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
}

export async function getPreviewImage(req, res) {
	const { _id } = req.params;
	const selector = await fetchTeamSelector(_id, res);

	if (selector) {
		const image = await generateImage(req, res, selector);
		if (image) {
			const output = await image.render(false);
			res.send([output]);
		}
	}
}

export async function getAllTeamSelectors(req, res) {
	const selectors = await TeamSelector.find({}, listProperties.join(" ")).populate({
		path: "_game",
		select: "slug"
	});

	res.send(_.keyBy(selectors, "_id"));
}

export async function getTeamSelectorForGame(req, res) {
	const { _game } = req.params;

	//Ensure the game exists
	const game = await Game.findById(_game, "slug").lean();
	if (!game) {
		res.status(404).send(`Could not find a game with the id ${_game}`);
	}

	//Check for an existing selector
	const selector = await TeamSelector.findOne({ _game }, "_id").lean();
	if (selector) {
		req.params._id = selector._id;
		await updateGameSelector(_game);
	} else {
		//Title and slug are unique fields, so we need to ensure we don't have any selectors with these values
		let title = `game-${game.slug}`;
		let slug = game.slug;
		const existingSelector = await TeamSelector.findOne({ $or: [{ title }, { slug }] }, "id").lean();
		if (existingSelector) {
			const suffix = `-${_game}`;
			title += suffix;
			slug += suffix;
		}

		//Fill with dummy data, as this will be dynamically populated by the API
		const values = {
			title,
			slug,
			players: [],
			_game
		};

		//Create a new selector
		const newSelector = new TeamSelector(values);
		await newSelector.save();

		req.params._id = newSelector._id;
	}

	await getTeamSelector(req, res);
}

export async function createTeamSelector(req, res) {
	const selector = new TeamSelector(req.body);
	await selector.save();

	//Update params to return updated selector
	req.params._id = selector._id;

	await getTeamSelector(req, res);
}

export async function updateGameSelector(_game) {
	//We only do this where a selector already exists
	//Otherwise we wait for one to be created on the fly.
	const selector = await TeamSelector.findOne({ _game }, "_id").lean();

	if (selector) {
		const values = await getValuesFromGame(_game);
		await TeamSelector.updateOne({ _game }, values);
	}
}

export async function updateTeamSelector(req, res) {
	const { _id } = req.params;
	const selector = await fetchTeamSelector(_id, res, true);
	if (selector) {
		await selector.updateOne(req.body);
		await getTeamSelector(req, res);
	}
}

export async function deleteTeamSelector(req, res) {
	const { _id } = req.params;
	const selector = await fetchTeamSelector(_id, res, true);
	if (selector) {
		await selector.remove();
		res.send({});
	}
}

export async function submitUserChoices(req, res) {
	const { _id } = req.params;
	const selector = await fetchTeamSelector(_id, res, true);
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
	const selector = await fetchTeamSelector(_id, res);

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

	//Try to get a game
	let game;
	if (selector._game) {
		const basicGame = await getFullGameById(selector._game, true, true);
		[game] = await getExtraGameInfo([basicGame], true, true);
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

	return new SquadImage(players, { selector, siteUrl: req.get("host"), game });
}
