//Modules
import _ from "lodash";
import mongoose from "mongoose";

//Mongoose
const collectionName = "people";
const Person = mongoose.model(collectionName);
const Game = mongoose.model("games");
const Team = mongoose.model("teams");
const TeamTypes = mongoose.model("teamTypes");
const SlugRedirect = mongoose.model("slugRedirect");

//Constants
const { localTeam } = require("~/config/keys");

//Images
import PersonImageCard from "~/images/PersonImageCard";
import { postToSocial } from "~/controllers/oAuthController";

async function validatePerson(_id, res) {
	if (!_id) {
		res.status(400).send(`No id provided`);
	}

	const person = await Person.findById(_id);
	if (person) {
		return person;
	} else {
		res.status(404).send(`No person found with id ${_id}`);
		return false;
	}
}

async function getFullPeople(ids) {
	//Get Core Data
	const doc = await Person.find({ _id: { $in: ids } })
		.populate({ path: "_hometown", populate: { path: "_country" } })
		.populate({ path: "_represents" })
		.populate({ path: "_sponsor" });
	const people = JSON.parse(JSON.stringify(doc));

	for (const person of people) {
		//Get Played Games
		if (person.isPlayer) {
			person.playedGames = await getPlayedGames(person._id);
		}

		//Get Squad Entries
		if (person.isPlayer) {
			person.squadEntries = await getSquadEntries(person._id);
		}

		//Get Coaching Roles
		if (person.isCoach) {
			person.coachingRoles = await getCoachingRoles(person._id);
		}

		//Get Reffed Games
		if (person.isReferee) {
			person.reffedGames = await getReffedGames(person._id);
		}
	}

	return people;
}

async function getPlayedGames(_id) {
	const query = {
		$or: [{ "playerStats._player": _id }, { "pregameSquads.squad": _id }]
	};
	const playedGames = await Game.find(
		query,
		"playerStats._player playerStats._team pregameSquads date squadsAnnounced"
	).lean();

	return playedGames.map(game => {
		const playerStatEntry = game.playerStats.find(({ _player }) => _player == _id);
		const pregameOnly = !playerStatEntry;

		let forLocalTeam;
		if (pregameOnly) {
			const localTeamPregameSquad = game.pregameSquads.find(s => s._team == localTeam);
			if (localTeamPregameSquad && localTeamPregameSquad.squad) {
				forLocalTeam = Boolean(localTeamPregameSquad.squad.find(p => p == _id));
			} else {
				forLocalTeam = false;
			}
		} else {
			forLocalTeam = playerStatEntry._team == localTeam;
		}

		return {
			_id: game._id,
			pregameOnly,
			forLocalTeam,
			date: game.date,
			squadsAnnounced: game.squadsAnnounced
		};
	});
}

async function getSquadEntries(_id) {
	let teamTypes = await TeamTypes.find({}, "sortOrder name").lean();
	teamTypes = _.keyBy(teamTypes, "_id");

	const squadEntries = await Team.find(
		{
			"squads.players._player": _id
		},
		"squads name"
	).lean();

	return _.chain(squadEntries)
		.map(t => {
			const team = {
				name: t.name.long,
				_id: t._id
			};
			return t.squads
				.filter(squad => squad.players.find(({ _player }) => _player == _id))
				.map(({ year, _teamType, players }) => {
					const { number } = players.find(({ _player }) => _player == _id);
					return {
						team,
						year,
						number,
						_teamType: teamTypes[_teamType]
					};
				});
		})
		.flatten()
		.orderBy(["year", "teamTypes.sortOrder"], ["desc", "asc"])
		.value();
}

async function getCoachingRoles(_id) {
	const coachingRoles = await Team.find({ "coaches._person": _id }, "coaches").lean();

	const filteredCoachingRoles = coachingRoles.map(team =>
		team.coaches
			.filter(({ _person }) => _person == _id)
			.map(({ _person, ...coach }) => ({ ...coach, _team: team._id }))
	);

	return _.flatten(filteredCoachingRoles);
}

async function getReffedGames(_id) {
	return Game.find(
		{
			$or: [{ _referee: _id }, { _video_referee: _id }]
		},
		"slug date"
	).lean();
}

//Getters
export async function getList(req, res) {
	const people = await Person.find(
		{},
		"name isPlayer isCoach isReferee playingPositions coachDetails slug images gender twitter"
	).lean();

	res.send(_.keyBy(people, "_id"));
}

export async function getPerson(req, res) {
	const { id } = req.params;

	const people = await getFullPeople([id]);

	res.send(people[0]);
}
export async function getPersonFromSlug(req, res) {
	const { slug } = req.params;

	let result;
	//First, do a simple lookup
	const directLookup = await Person.findOne({ slug }, "_id").lean();
	if (directLookup) {
		result = directLookup._id;
	}

	//Otherwise, we check for redirects
	if (!result) {
		const redirect = await SlugRedirect.findOne(
			{ collectionName: "people", oldSlug: slug },
			"itemId"
		).lean();
		if (redirect) {
			result = redirect.itemId;
		}
	}

	//If we get a result, return it
	if (result) {
		const people = await getFullPeople([result]);
		res.send(people[0]);
	} else {
		res.status(404).send({});
	}
}

export async function getPeople(req, res) {
	const { ids } = req.params;
	const peopleIds = ids.split(",");
	const limit = 20;

	if (peopleIds > limit) {
		res.status(413).send(`Cannot fetch more than ${limit} people at one time`);
	} else {
		const person = await getFullPeople(ids.split(","));

		res.send(_.keyBy(person, "_id"));
	}
}

//Create
export async function createPerson(req, res) {
	const { name } = req.body;
	req.body.slug = await Person.generateSlug(name.first, name.last);
	const person = new Person(req.body);
	await person.save();

	req.params.id = person._id;
	await getPerson(req, res);
}

//Update
export async function updatePerson(req, res) {
	const { id } = req.params;
	const person = await validatePerson(id, res);

	if (person) {
		const values = _.mapValues(req.body, val => {
			return val === "" ? null : val;
		});
		await person.updateOne(values);

		await getPerson(req, res);
	}
}

export async function updatePeople(req, res) {
	const bulkOperations = _.map(req.body, (data, _id) => ({
		updateOne: {
			filter: { _id },
			update: {
				$set: data
			}
		}
	}));

	//Update the DB
	if (bulkOperations.length) {
		await Person.bulkWrite(bulkOperations);
	}

	//Return people
	const people = await getFullPeople(Object.keys(req.body));
	res.send(_.keyBy(people, "_id"));
}

export async function setExternalNames(req, res) {
	for (const obj of req.body) {
		await Person.findByIdAndUpdate(obj._player, { externalName: obj.name });
	}
	res.send({});
}

//Image card
export async function getImageCard(req, res) {
	const { _id } = req.params;
	const person = validatePerson(_id, res);
	if (person) {
		const image = await generateImageCard(_id, req.body);
		const output = await image.render(false);
		res.send(output);
	}
}
export async function postImageCard(req, res) {
	const { _id } = req.params;
	const person = validatePerson(_id, res);
	if (person) {
		const { content, channels, _profile, replyTweet, ...imageData } = req.body;

		//Create Image
		const image = await generateImageCard(_id, imageData);
		const output = await image.render(true);

		//Upload to twitter
		const result = await postToSocial("twitter", content, {
			_profile,
			images: [output],
			replyTweet
		});

		//Handle errors
		if (!result.success) {
			res.send(result.error);
			return;
		}

		//Upload to facebook
		if (channels.find(c => c == "facebook")) {
			const tweetMediaObject = result.post.entities.media;
			const images = tweetMediaObject.map(t => t.media_url);
			await postToSocial("facebook", content, { _profile, images });
		}

		res.send({});
	}
}
async function generateImageCard(person, data) {
	const options = { imageType: data.imageType, includeName: data.includeName };
	const image = new PersonImageCard(person, options);
	await image.drawCustomText(data.textRows, data.alignment, data.lineHeight);
	return image;
}

//Parser
export async function parsePlayerList(req, res) {
	const { names, gender } = req.body;

	//Regex to normalise names
	const regEx = new RegExp("[^a-zA-Z]", "gi");

	//Get full people list
	let people = await Person.find({ gender }, "name isPlayer isCoach isReferee").lean();
	people = people.map(p => {
		const name = `${p.name.first} ${p.name.last}`;
		return {
			...p,
			name,
			filteredName: name.replace(regEx, "").toLowerCase()
		};
	});

	//Get Matches
	const matches = [];
	for (const unfilteredName of names) {
		const name = unfilteredName.replace(regEx, "").toLowerCase();

		const exact = people.filter(p => p.filteredName === name);
		if (exact.length) {
			matches.push({ exact: exact.length == 1 && exact[0].isPlayer, results: exact });
		} else {
			//Create a Regex that matches first initial and last name
			const firstInitial = name.substr(0, 1);
			const lastName = unfilteredName
				.split(" ")
				.pop()
				.replace(regEx, "")
				.toLowerCase();
			const approxRegex = new RegExp(`^${firstInitial}.+ ${lastName}$`, "ig");

			//Find anyone who matches the regex
			const approx = people.filter(p => p.name.match(approxRegex));
			matches.push({ exact: false, results: approx });
		}
	}

	//Use isCoach or isReferee to generate extra text
	const extraText = _.chain(matches)
		.map("results")
		.flatten()
		.uniqBy("_id")
		.keyBy("_id")
		.mapValues(({ isCoach, isReferee }) => (isCoach ? "Coach" : isReferee ? "Referee" : null))
		.value();

	//Then cycle players to add additional info
	for (const id in extraText) {
		if (!extraText[id]) {
			const squadEntries = await getSquadEntries(id);
			if (squadEntries.length) {
				const { team, year, _teamType } = squadEntries[0];
				extraText[id] = `${year} ${team.name} ${
					_teamType.sortOrder > 1 ? _teamType.name : ""
				}`.trim();
			}
		}
	}

	//And finally map the extra text into results
	res.send(
		matches.map(match => {
			const results = match.results.map(({ _id, name }) => ({
				_id,
				name,
				extraText: extraText[_id]
			}));
			return {
				...match,
				results
			};
		})
	);
}

//Deleter
export async function deletePerson(req, res) {
	const { _id } = req.params;
	const person = await validatePerson(_id, res);
	if (person) {
		const errors = [];
		const toLog = {};

		//Check for news posts
		const NewsPost = mongoose.model("newsPosts");
		const newsPosts = await NewsPost.find({ _people: _id }, "title slug").lean();
		if (newsPosts.length) {
			errors.push(
				`linked to ${newsPosts.length} news ${newsPosts.length === 1 ? "post" : "posts"}`
			);
			toLog.newsPosts = newsPosts;
		}

		//Check for team squads
		const Team = mongoose.model("teams");
		const teams = await Team.find({ "squads.players._player": _id }, "name squads").lean();
		if (teams.length) {
			toLog.teams = _.chain(teams)
				.map(t => {
					const squads = t.squads
						.filter(s => s.players.find(p => p._player == _id))
						.map(({ year, _teamType, _id }) => ({ year, _teamType, _id }));
					return [t.name.long, _.orderBy(squads, "year", "desc")];
				})
				.fromPairs()
				.value();
			const squadCount = _.chain(toLog.teams)
				.values()
				.flatten()
				.value().length;

			errors.push(
				`part of ${squadCount} ${squadCount === 1 ? "squad" : "squads"} in ${
					teams.length
				} ${teams.length === 1 ? "team" : "teams"}`
			);
		}

		//Check for played games
		const playedGames = await getPlayedGames(_id);
		if (playedGames.length) {
			errors.push(
				`a player in ${playedGames.length} ${playedGames.length === 1 ? "game" : "games"}`
			);
			toLog.playedGames = playedGames;
		}

		const coachingRoles = await getCoachingRoles(_id);
		if (coachingRoles.length) {
			const teamCount = _.uniqBy(coachingRoles, "_team").length;
			errors.push(`a coach for ${teamCount} ${teamCount === 1 ? "team" : "teams"}`);
			toLog.coachingRoles = coachingRoles;
		}

		//Check for reffed games
		const reffedGames = await getReffedGames(_id);
		if (reffedGames.length) {
			errors.push(
				`a referee for ${reffedGames.length} ${reffedGames.length === 1 ? "game" : "games"}`
			);
			toLog.reffedGames = reffedGames;
		}

		if (errors.length) {
			let errorList;
			if (errors.length === 1) {
				errorList = errors[0];
			} else {
				const lastError = errors.pop();
				errorList = `${errors.join(", ")} & ${lastError}`;
			}
			res.status(409).send({
				error: `Cannot delete ${person.name.first}, as ${
					person.gender == "M" ? "he" : "she"
				} is ${errorList}`,
				toLog
			});
			return false;
		} else {
			await person.remove();
			res.send({});
		}
	}
}

export async function mergePerson(req, res) {
	const { _source, _destination } = req.params;

	//First, ensure both source and destination are valid, separate people
	if (_source === _destination) {
		res.status(500).send("The same ID was provided for source and destination values");
		return;
	}
	const source = await validatePerson(_source, res);
	const destination = await validatePerson(_destination, res);

	if (!source || !destination) {
		//res handling is done in validatePerson
		return;
	}

	//We create arrays for the mongo response for players, coaches and refs,
	//so we know whether to enforce isPlayer, isCoach or isReferee
	const playerResults = [];
	const coachResults = [];
	const refereeResults = [];

	let error;
	try {
		//First, update award references
		const Award = mongoose.model("awards");
		const updatedAwards = await Award.updateMany(
			{ $or: [{ "categories.nominees.nominee": _source, "votes.choices.choice": _source }] },
			{
				$set: {
					"categories.$[cat].nominees.$[nom].nominee": _destination,
					"votes.$[vote].choices.$[ch].choice": _destination
				}
			},
			{
				arrayFilters: [
					{ "cat.nominees.nominee": _source },
					{ "nom.nominee": _source },
					{ "vote.choices.choice": _source },
					{ "ch.choice": _source }
				],
				multi: true
			}
		);
		playerResults.push(updatedAwards);

		//Next, update team selectors
		const TeamSelector = mongoose.model("teamSelectors");
		const updatedSelectors = await TeamSelector.updateMany(
			{ $or: [{ players: _source, "choices.squad": _source }] },
			{
				$set: { "players.$[src]": _destination, "choices.$[ch].squad.$[src]": _destination }
			},
			{ arrayFilters: [{ src: _source }, { "ch.squad": _source }], multi: true }
		);
		playerResults.push(updatedSelectors);

		//Update all nested player references within games
		const playersInGames = await Game.updateMany(
			{
				$or: [
					{ "pregameSquads.squad": _source },
					{ "events._player": _source },
					{ "playerStats._player": _source }
				]
			},
			{
				$set: {
					"pregameSquads.$[pgs].squad.$[src]": _destination,
					"events.$[ev]._player": _destination,
					"playerStats.$[ps]._player": _destination,
					"_kickers.$[ks]._player": _destination,
					"fan_potm.options.$[src]": _destination,
					"fan_potm.votes.$[vote].choice": _destination,
					"overrideGameStarStats.$[star]._player": _destination,
					"manOfSteel.$[steel]._player": _destination
				}
			},
			{
				arrayFilters: [
					{ src: _source },
					{ "pgs.squad": _source },
					{ "ev._player": _source },
					{ "ps._player": _source },
					{ "ks._player": _source },
					{ "vote.choice": _source },
					{ "star._player": _source },
					{ "steel._player": _source }
				],
				multi: true
			}
		);
		playerResults.push(playersInGames);

		//And do the same for refs
		const refs = await Game.updateMany(
			{ _referee: _source },
			{ _referee: _destination },
			{ multi: true }
		);
		const videoRefs = await Game.updateMany(
			{ _video_referee: _source },
			{ _video_referee: _destination },
			{ multi: true }
		);
		refereeResults.push(refs, videoRefs);

		//Update references in squads
		const updatedSquadEntries = await Team.updateMany(
			{ "squads.players._player": _source },
			{ $set: { "squads.$[squad].players.$[pl]._player": _destination } },
			{
				arrayFilters: [{ "squad.players._player": _source }, { "pl._player": _source }],
				multi: true
			}
		);
		playerResults.push(updatedSquadEntries);

		//Update coaching history
		const updatedCoachHistory = await Team.updateMany(
			{ "coaches._person": _source },
			{ $set: { "coaches.$[coach]._person": _destination } },
			{
				arrayFilters: [{ "coach._person": _source }],
				multi: true
			}
		);
		coachResults.push(updatedCoachHistory);

		//Set up a slug redirect and ensure any existing ones are updated
		const newSlug = new SlugRedirect({
			collectionName,
			oldSlug: source.slug,
			itemId: destination
		});
		await newSlug.save();
		await SlugRedirect.updateMany(
			{ itemId: _source, collectionName },
			{ itemId: destination },
			{ multi: true }
		);

		//Enforce player/coach/referee data where necessary
		const updateQuery = {};
		playerResults.forEach(({ nModified }) => {
			if (nModified) {
				updateQuery.isPlayer = true;
			}
		});
		coachResults.forEach(({ nModified }) => {
			if (nModified) {
				updateQuery.isCoach = true;
			}
		});
		refereeResults.forEach(({ nModified }) => {
			if (nModified) {
				updateQuery.isReferee = true;
			}
		});
		if (Object.keys(updateQuery).length) {
			await destination.updateOne(updateQuery);
		}

		//Delete the source user
		await source.remove();
	} catch (e) {
		error = e;
	}

	if (error) {
		res.status(500).send({ error: "Merge failed", toLog: error });
	} else {
		//Return the updated destination person
		req.params.id = _destination;
		await getPerson(req, res);
	}
}
