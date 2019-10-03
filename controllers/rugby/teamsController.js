//Mongoose
import mongoose from "mongoose";
const collectionName = "teams";
const Team = mongoose.model(collectionName);
const TeamTypes = mongoose.model("teamTypes");
const Person = mongoose.model("people");
const Game = mongoose.model("games");

//Modules
const _ = require("lodash");

//Helpers
async function validateTeam(_id, res, promise = null) {
	//This allows us to populate specific fields if necessary
	const team = await (promise || Team.findById(_id));
	if (team) {
		return team;
	} else {
		res.status(404).send(`No team found with id ${_id}`);
		return false;
	}
}

//Constants
import { localTeam } from "~/config/keys";

async function getUpdatedTeam(id, res) {
	//To be called after post/put methods
	const team = await Team.findById([id]).fullTeam();
	res.send({ [id]: team });
}

function processBasics(values) {
	return _.mapValues(values, (val, key) => {
		switch (key) {
			case "_defaultGround":
				return val.value;
			case "colours":
				if (!val.customPitchColour) {
					val.pitchColour = null;
				}
				if (!val.customStatBarColour) {
					val.statBarColour = null;
				}
				return val;
			case "_grounds":
				return _.chain(val)
					.map((ground, _teamType) => {
						if (ground && ground.value) {
							return { _ground: ground.value, _teamType };
						}
					})
					.filter(_.identity)
					.value();
			default:
				return val;
		}
	});
}

/*
 * FULL TEAM METHODS
 */
export async function createTeam(req, res) {
	//Handle Plain Text Fields
	const values = processBasics(req.body);
	const team = new Team(values);
	await team.save();
	await getUpdatedTeam(team._id, res);
}

export async function updateTeam(req, res) {
	const { _id } = req.params;
	const team = await validateTeam(_id, res);
	if (team) {
		//Handle Plain Text Fields
		const values = processBasics(req.body);
		await Team.updateOne({ _id }, values);
		await getUpdatedTeam(_id, res);
	}
}

export async function getList(req, res) {
	const teams = await Team.find({}, "name colours images").lean();
	const teamList = _.keyBy(teams, "_id");
	res.send({ teamList });
}

export async function getTeam(req, res) {
	const { _id } = req.params;
	const team = await validateTeam(_id, res, Team.findById(_id).fullTeam());
	if (team) {
		res.send({ [team._id]: team });
	}
}

/*
 * SQUAD METHODS
 */
export async function createSquad(req, res) {
	const { _id } = req.params;
	const team = await validateTeam(_id, res);
	if (team) {
		const { players, _teamType, year } = req.body;
		const processedPlayers = await processBulkSquadAdd(players, _teamType);
		const newSquad = {
			year,
			_teamType,
			players: processedPlayers
		};

		team.squads.push(newSquad);
		await team.save();
		await getUpdatedTeam(_id, res);
	}
}

export async function appendSquad(req, res) {
	const { _id, squadId } = req.params;
	const team = await validateTeam(_id, res);
	if (team) {
		const squad = _.find(team.squads, squad => squad._id == squadId);
		if (!squad) {
			res.status(404).send({
				error: `No squad with id ${squadId} found for ${team.name.long}`
			});
		} else {
			const newSquad = await processBulkSquadAdd(req.body, squad._teamType);
			squad.players.push(...newSquad);
			await team.save();
			await getUpdatedTeam(_id, res);
		}
	}
}

async function processBulkSquadAdd(data, teamTypeId) {
	const results = [];
	for (const row of _.values(data)) {
		const { number, onLoan, from, to, _id, nameString } = row;
		let person;

		//Create New Player
		if (_id === "skip") {
			continue;
		} else if (_id === "new") {
			//Generate Slug
			const slug = await Person.generateSlug(nameString.first, nameString.last);

			//Get Gender
			const teamType = await TeamTypes.findById(teamTypeId);
			const { gender } = teamType;

			person = new Person({
				name: nameString,
				isPlayer: true,
				slug,
				gender
			});

			await person.save();
		} else {
			person = await Person.findByIdAndUpdate(_id, { isPlayer: true });
		}

		results.push({
			_player: person._id,
			onLoan,
			from: from.length ? from : null,
			to: to.length ? to : null,
			number: number.length ? number : null
		});
	}

	return results;
}

export async function updateSquad(req, res) {
	const { _id, squadId } = req.params;
	const team = await validateTeam(_id, res);
	if (team) {
		const squad = _.find(team.squads, squad => squad._id == squadId);
		if (!squad) {
			res.status(404).send({
				error: `No squad with id ${squadId} found for ${team.name.long}`
			});
		} else {
			//Check for players scheduled for deletion
			//Ensure their presence in the squad isn't required for a game
			const playersToDelete = _.chain(req.body)
				.map((p, _id) => ({ ...p, _id }))
				.filter("deletePlayer")
				.map("_id")
				.value();

			//Get "Date" filter for games
			const date = {
				$gte: new Date(`${squad.year}-01-01`),
				$lt: new Date(`${squad.year + 1}-01-01`)
			};

			//In case any playyers cannot be deleted, we'll populate this array
			const undeleteables = [];

			//Check each player for dependent games
			for (const _player of playersToDelete) {
				const games = await Game.find(
					{
						$or: [
							{
								playerStats: {
									$elemMatch: {
										_player,
										_team: localTeam
									}
								}
							},
							{
								pregameSquads: {
									$elemMatch: {
										squad: _player,
										_team: localTeam
									}
								}
							}
						],
						date
					},
					"date _competition slug"
				).populate({
					path: "_competition",
					select: "_parentCompetition _teamType",
					populate: { path: "_parentCompetition" }
				});

				if (!games.length) {
					continue;
				}

				const competitions = _.chain(games)
					.uniqBy("_competition._id")
					.map(({ _competition }) => ({
						_id: _competition._id,
						_teamType: _competition._teamType,
						useAllSquads: _competition._parentCompetition.useAllSquads
					}))
					.filter(
						c => c.useAllSquads || c._teamType.toString() == squad._teamType.toString()
					)
					.value();

				//If there are any competitions with useAllSquads set to false,
				//then we know the player cannot be deleted
				let dependentCompetitions = competitions
					.filter(c => !c.useAllSquads)
					.map(c => c._id);
				let dependentGames;
				if (dependentCompetitions) {
					dependentGames = games.filter(g =>
						dependentCompetitions.find(c => c == g._competition._id)
					);
				} else {
					//If we get to this point, it means a player has only featured in
					//games that uses all squads. In this case, we need to confirm they
					//appear in at least one other relevant squad
					const otherSquads = team.squads.filter(
						s =>
							s._id != squadId &&
							s.year == squad.year &&
							s.players.find(p => p._player == _player)
					);
					if (!otherSquads.length) {
						dependentGames = games;
					}
				}

				if (dependentGames.length) {
					const player = await Person.findById(_player, "name").lean();
					undeleteables.push({
						player: `${player.name.first} ${player.name.last}`,
						games: dependentGames.map(g => g.slug)
					});
				}
			}

			if (undeleteables.length) {
				res.status(419).send({
					error: `Could not delete ${undeleteables.length} ${
						undeleteables.length == 1 ? "player" : "players"
					}`,
					toLog: undeleteables
				});
			} else {
				squad.players = _.chain(req.body)
					.map((data, _player) => {
						const { number, onLoan, from, to, deletePlayer } = data;
						if (deletePlayer) {
							return null;
						}
						return {
							number: number === "" ? null : number,
							onLoan,
							from: from === "" ? null : new Date(from),
							to: to === "" ? null : new Date(to),
							_player
						};
					})
					.filter(_.identity)
					.value();

				//Remove Empty Squad
				if (!squad.players.length) {
					team.squads = _.reject(team.squads, s => s._id == squadId);
				}

				await team.save();
				await getUpdatedTeam(_id, res);
			}
		}
	}
}

/*
 * COACH METHODS
 */
export async function addCoach(req, res) {
	const { _id } = req.params;
	const team = await validateTeam(_id, res);
	if (team) {
		team.coaches.push(req.body);
		await team.save();
		await getTeam(req, res);
	}
}

export async function updateCoaches(req, res) {
	const { _id } = req.params;
	const team = await validateTeam(_id, res);
	if (team) {
		team.coaches = _.chain(req.body)
			.map((values, _id) => {
				const { deleteCoach, ...valuesToSave } = values;
				if (deleteCoach) {
					return null;
				} else {
					return {
						...valuesToSave,
						_id
					};
				}
			})
			.filter(_.identity)
			.value();

		await team.save();
		await getTeam(req, res);
	}
}

/*
 * TEAM TYPES METHODS
 */
export async function getTeamTypes(req, res) {
	const teamTypes = await TeamTypes.find({}).sort({ sortOrder: 1 });
	res.send(_.keyBy(teamTypes, "_id"));
}
