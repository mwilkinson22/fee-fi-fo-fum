//Mongoose
import mongoose from "mongoose";
const collectionName = "teams";
const Team = mongoose.model(collectionName);
const TeamType = mongoose.model("teamTypes");
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

async function validateTeamType(_id, res) {
	//This allows us to populate specific fields if necessary
	const teamType = await TeamType.findById(_id);
	if (teamType) {
		return teamType;
	} else {
		res.status(404).send(`No Team Type found with id ${_id}`);
		return false;
	}
}

async function validateTeamTypeSlug(slug, res, id = null) {
	const slugs = await TeamType.find({ _id: { $ne: id } }, "slug").lean();
	const isValid = !slugs.find(s => s.slug == slug);
	if (!isValid) {
		res.status(409).send(`Could not save. Slug '${slug}' is already in use`);
	} else {
		return true;
	}
}

async function getUpdatedTeam(_id, res, fullData) {
	//To be called after post/put methods
	let fullTeam = await Team.findById([_id]).fullTeam(fullData);
	fullTeam = JSON.parse(JSON.stringify(fullTeam));

	const forList = await Team.findById([_id]).forList();
	res.send({
		fullTeams: {
			[_id]: { ...fullTeam, fullData }
		},
		teamList: {
			[_id]: forList
		},
		_id
	});
}

/* ----------------------------------------------------------------
 *
 * Full Team CRUD Methods
 *
 * ---------------------------------------------------------------- */
export async function createTeam(req, res) {
	//Handle Plain Text Fields
	const team = new Team(req.body);
	await team.save();
	await getUpdatedTeam(team._id, res, true);
}

export async function updateTeam(req, res) {
	const { _id } = req.params;
	const team = await validateTeam(_id, res);
	if (team) {
		//Handle Plain Text Fields
		await Team.updateOne({ _id }, req.body);
		await getUpdatedTeam(_id, res, true);
	}
}

export async function deleteTeam(req, res) {
	const { _id } = req.params;
	const team = await validateTeam(_id, res);
	if (team) {
		//Check if a team is required for any games
		const Game = mongoose.model("games");
		const games = await Game.find({ _opposition: _id }, "slug").lean();
		const NeutralGame = mongoose.model("neutralGames");
		const neutralGames = await NeutralGame.find({ $or: [{ _homeTeam: _id }, { _awayTeam: _id }] }, "date").lean();
		const totalGames = games.length + neutralGames.length;

		//Check if a team is named in a competition instance
		const CompetitionSegment = mongoose.model("competitionSegments");
		const segments = await CompetitionSegment.find(
			{ "instances.teams": _id },
			"name instances.year instances.teams"
		).lean();

		//If games or instances are found, report an error
		if (totalGames || segments.length) {
			let error = "Team cannot be deleted, as it is required for ";

			if (totalGames) {
				error += `${totalGames} ${totalGames === 1 ? "game" : "games"}`;
				if (segments.length) {
					error += " & ";
				}
			}

			if (segments.length) {
				error += `instances in ${segments.length} competition ${
					segments.length === 1 ? "segment" : "segments"
				}`;
			}

			res.status(409).send({
				error,
				toLog: {
					games,
					neutralGames,
					segments: segments.map(segment => {
						const instances = segment.instances
							.filter(({ teams }) => teams && teams.find(team => team._id == _id))
							.map(({ year }) => year);
						return { ...segment, instances };
					})
				}
			});
		} else {
			await team.remove();
			res.send({});
		}
	}
}

export async function getList(req, res) {
	const teams = await Team.find({})
		.forList()
		.lean();
	const teamList = _.keyBy(teams, "_id");
	res.send({ teamList });
}

export async function getBasicTeam(req, res) {
	await getTeam(req, res, false);
}

export async function getFullTeam(req, res) {
	await getTeam(req, res, true);
}

async function getTeam(req, res, fullData) {
	const { _id } = req.params;
	const team = await validateTeam(_id, res, Team.findById(_id).fullTeam(fullData));
	if (team) {
		res.send(team);
	}
}

/* ----------------------------------------------------------------
 *
 * Squad Methods
 *
 * ---------------------------------------------------------------- */
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
		await getUpdatedTeam(_id, res, true);
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

			//Prevent duplicates
			const newSquadWithoutDuplicates = newSquad.filter(
				({ _player }) => !squad.players.find(p => p._player.toString() == _player.toString())
			);

			squad.players.push(...newSquadWithoutDuplicates);
			await team.save();
			await getUpdatedTeam(_id, res, true);
		}
	}
}

async function processBulkSquadAdd(data, teamTypeId) {
	const results = [];
	for (const row of _.values(data)) {
		const { number, onLoan, from, to, _player, name } = row;
		let person;

		//Create New Player
		if (_player === "new") {
			//Generate Slug
			const slug = await Person.generateSlug(name.first, name.last);

			//Get Gender
			const teamType = await TeamType.findById(teamTypeId);
			const { gender } = teamType;

			person = new Person({
				name,
				isPlayer: true,
				slug,
				gender
			});

			await person.save();
		} else {
			person = await Person.findByIdAndUpdate(_player, { isPlayer: true });
		}

		results.push({
			_player: person._id,
			onLoan,
			from,
			to,
			number
		});
	}

	return _.uniqBy(results, "_player");
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

			//In case any players cannot be deleted, we'll populate this array
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
										_team: _id
									}
								}
							},
							{
								pregameSquads: {
									$elemMatch: {
										squad: _player,
										_team: _id
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
					.filter(c => c.useAllSquads || c._teamType.toString() == squad._teamType.toString())
					.value();

				//If there are any competitions with useAllSquads set to false,
				//then we know the player cannot be deleted
				let dependentCompetitions = competitions.filter(c => !c.useAllSquads).map(c => c._id);
				let dependentGames;
				if (dependentCompetitions) {
					dependentGames = games.filter(g => dependentCompetitions.find(c => c == g._competition._id));
				} else {
					//If we get to this point, it means a player has only featured in
					//games that uses all squads. In this case, we need to confirm they
					//appear in at least one other relevant squad
					const otherSquads = team.squads.filter(
						s => s._id != squadId && s.year == squad.year && s.players.find(p => p._player == _player)
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
					} as they are required for games`,
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
							number,
							onLoan,
							from,
							to,
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
				await getUpdatedTeam(_id, res, true);
			}
		}
	}
}

/* ----------------------------------------------------------------
 *
 * Coach Methods
 *
 * ---------------------------------------------------------------- */
export async function addCoach(req, res) {
	const { _id } = req.params;
	const team = await validateTeam(_id, res);
	if (team) {
		//Ensure player is a coach
		await Person.updateOne({ _id: req.body._person }, { isCoach: true });

		//Update coaches array
		team.coaches.push(req.body);
		await team.save();
		await getUpdatedTeam(_id, res, true);
	}
}

/* ----------------------------------------------------------------
 *
 * Team Types
 *
 * ---------------------------------------------------------------- */
export async function getTeamTypes(req, res) {
	const teamTypes = await TeamType.find({}).sort({ sortOrder: 1 });
	res.send(_.keyBy(teamTypes, "_id"));
}

export async function createTeamType(req, res) {
	const slugIsValid = await validateTeamTypeSlug(req.body.slug, res);
	if (slugIsValid) {
		const teamType = new TeamType(req.body);
		await teamType.save();
		res.send(teamType);
	}
}

export async function updateTeamType(req, res) {
	const { _id } = req.params;

	const teamType = await validateTeamType(_id, res);
	if (teamType) {
		const slugIsValid = await validateTeamTypeSlug(req.body.slug, res, _id);
		if (slugIsValid) {
			await TeamType.findByIdAndUpdate({ _id }, req.body);
			const newTeamType = await TeamType.findById(_id);
			res.send(newTeamType);
		}
	}
}

export async function deleteTeamType(req, res) {
	const { _id } = req.params;
	const teamType = await validateTeamType(_id, res);
	if (teamType) {
		const errors = [];
		const toLog = {};

		const Game = mongoose.model("games");
		const games = await Game.find({ _teamType: _id }, "slug").lean();
		if (games.length) {
			toLog.games = games;
			errors.push(`${games.length} ${games.length === 1 ? "games" : "games"}`);
		}

		const Team = mongoose.model("teams");
		const squads = await Team.find({ "squads._teamType": _id }, "name").lean();
		if (squads.length) {
			toLog.squads = squads;
			errors.push(`squads for ${squads.length} ${squads.length === 1 ? "team" : "teams"}`);
		}

		const CompetitionSegments = mongoose.model("competitionSegments");
		const segments = await CompetitionSegments.find({ _teamType: _id }, "name").lean();
		if (segments.length) {
			toLog.competitionSegments = segments;
			errors.push(`${segments.length} competition ${segments.length === 1 ? "segment" : "segments"}`);
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
				error: `Cannot delete Team Type, as it is required for ${errorList}`,
				toLog
			});
			return false;
		} else {
			await teamType.remove();
			res.send({});
		}
	}
}

export async function getMainTeamType(fields = null) {
	return TeamType.findOne({}, fields)
		.lean()
		.sort({ sortOrder: 1 });
}
