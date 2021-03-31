//Mongoose
import _ from "lodash";
import mongoose from "mongoose";
const Game = mongoose.model("games");
const Person = mongoose.model("people");
const Team = mongoose.model("teams");
const TeamType = mongoose.model("teamTypes");

//Helpers
import { getExtraGameInfo } from "./rugby/gamesController";

//Constants
import { localTeam } from "~/config/keys";
import gameStatuses from "~/constants/adminDashboardGameStatuses";

export async function getDashboardData(req, res) {
	//Get the localTeam
	const localTeamObject = await Team.findById(localTeam, "squads coaches").lean();

	//Get the first team
	const teamTypes = await TeamType.find({}).sort({ sortOrder: 1 }).lean();
	const firstTeam = teamTypes[0]._id.toString();

	//Create an object with all the data we need
	const promises = {
		birthdays: getBirthdays(localTeamObject),
		gamesWithIssues: getGames(firstTeam),
		missingPlayerDetails: getPlayersWithMissingData(localTeamObject, firstTeam),
		teamsWithoutGrounds: getTeamsWithoutGrounds()
	};

	//Await results
	const data = _.zipObject(_.keys(promises), await Promise.all(_.values(promises)));

	//Return data
	res.send(data);
}

async function getBirthdays(team) {
	//Get time
	const now = new Date();
	const thisYear = Number(now.getFullYear());

	//Get all current and future players
	const playerIds = _.chain(team.squads)
		//Filter by year & teamType
		.filter(s => s.year >= thisYear)
		//Get players
		.map(({ players }) => players.map(p => p._player))
		.flatten()
		//Remove duplicates
		.uniq()
		.value();

	//Get coaches
	const coachIds = team.coaches.filter(c => !c.to).map(p => p._person);

	//Get all with birthdays
	const peopleObjects = await Person.find(
		{ _id: { $in: [...playerIds, ...coachIds] }, dateOfBirth: { $ne: null } },
		"name dateOfBirth"
	).lean();

	return (
		_.chain(peopleObjects)
			//Convert DOB to date object
			.each(person => (person.dateOfBirth = new Date(person.dateOfBirth)))
			//Get days to go
			.map(person => {
				//Get next birthday
				const monthAndDay = person.dateOfBirth.toString("MM-dd");
				let nextBirthday = new Date(`${thisYear}-${monthAndDay} 23:59:59`);
				if (nextBirthday < now) {
					nextBirthday.addYears(1);
				}

				//Difference between dates
				const daysToGo = Math.floor((nextBirthday - now) / (1000 * 60 * 60 * 24));

				//Get Age
				const age = Math.floor((nextBirthday - person.dateOfBirth) / (1000 * 60 * 60 * 24 * 365));

				return { ...person, daysToGo, age, nextBirthday };
			})
			//Order
			.sortBy("daysToGo")
			//Limit to 5 values
			.chunk(5)
			.value()
			.shift()
	);
}

async function getTeamsWithoutGrounds() {
	return Team.find({ _defaultGround: null }, "name _id").lean();
}

async function getPlayersWithMissingData(team, firstTeam) {
	const requiredValues = {
		images: "Main Image",
		dateOfBirth: "Date of Birth",
		contractedUntil: "Contracted Until",
		playingPositions: "Playing Positions",
		_hometown: "Hometown"
	};

	//Get all current and future first teamers
	const thisYear = Number(new Date().getFullYear());
	const playerIds = _.chain(team.squads)
		//Filter by year & teamtype
		.filter(s => s.year >= thisYear && s._teamType == firstTeam)
		//Get players
		.map(({ players }) => players.filter(p => !p.onLoan).map(p => p._player))
		.flatten()
		//Remove duplicates
		.uniq()
		.value();

	//Get person objects
	const fieldsToFetch = _.mapValues(requiredValues, () => true);
	fieldsToFetch.name = true;
	const peopleObjects = await Person.find({ _id: { $in: playerIds } }, fieldsToFetch).lean();

	//Return an array of any players with issues
	return (
		_.chain(peopleObjects)
			//Add in full name
			.each(player => (player.name = `${player.name.first} ${player.name.last}`))
			//Order
			.sortBy("name")
			//Check required values
			.map(player => {
				const issues = _.map(requiredValues, (label, key) => {
					let isValid;
					switch (key) {
						case "images": {
							isValid = player.images.main;
							break;
						}
						case "playingPositions": {
							isValid = player.playingPositions.length;
							break;
						}
						default: {
							isValid = player[key];
							break;
						}
					}

					//If an issue is found, we return the label to an array
					if (!isValid) {
						return label;
					}
				}).filter(_.identity);

				//If a player has outstanding issues, return an object
				if (issues.length) {
					const { name, _id } = player;
					return { name, _id, issues };
				}
			})
			.filter(_.identity)
			.value()
	);
}

async function getGames(firstTeam) {
	//Work out the date where we would expect games to have pregame squads.
	//So first, work out if we're past midday
	const now = new Date();
	const todayMidday = new Date().setHours(12, 0, 0);

	//If we're past midday, then we should expect squads for two days time.
	//Otherwise, we only check for tomorrow.
	//We add an extra day onto the above values as we then set the time to midnight.
	const pregameSquadDate = now <= todayMidday ? new Date().addDays(2) : new Date().addDays(3);
	pregameSquadDate.setHours(0, 0, 0);

	//Get games for this year, up to two weeks in advance
	let games = await Game.find({
		date: { $gte: `${new Date().getFullYear()}-01-01`, $lte: new Date().addWeeks(2) },
		hideGame: false
	})
		.sort({ date: 1 })
		.fullGame(true, false);

	//Convert to JSON
	games = JSON.parse(JSON.stringify(games));

	//Get eligible players and additional info
	games = await getExtraGameInfo(games, true, true);

	//Filter out those with issues
	return games
		.map(game => {
			const {
				_id,
				_competition,
				_opposition,
				eligiblePlayers,
				playerStats,
				pregameSquads,
				squadsAnnounced,
				_teamType,
				_referee
			} = game;
			const date = new Date(game.date);
			const teams = [localTeam, _opposition._id];

			//Create object to return
			const result = {
				_id,
				_opposition: _opposition._id,
				date: date.toString("dddd dS MMMM"),
				_teamType
			};

			//Check we have valid players
			const teamsWithoutPlayers = teams.filter(id => !eligiblePlayers[id] || !eligiblePlayers[id].length);
			if (teamsWithoutPlayers.length) {
				result.error = gameStatuses.ELIGIBLE;
				result.teams = teamsWithoutPlayers;
				return result;
			}

			//Check for pregame squads
			if (date < pregameSquadDate && _competition.instance.usesPregameSquads) {
				const teamsWithoutPregameSquads = teams.filter(id => {
					const squadEntry = pregameSquads.find(({ _team }) => _team == id);
					return !squadEntry || !squadEntry.squad || !squadEntry.squad.length;
				});

				if (teamsWithoutPregameSquads.length) {
					result.error = gameStatuses.PREGAME;
					result.teams = teamsWithoutPregameSquads;
					return result;
				}
			}

			//Check for match squads
			if (date < now) {
				const teamsWithoutSquads = teams.filter(id => !playerStats.find(({ _team }) => _team == id));
				if (teamsWithoutSquads.length || !squadsAnnounced) {
					result.error = gameStatuses.SQUAD;
					result.teams = teamsWithoutSquads;
					return result;
				}
			}

			//Check for stats
			if (date < new Date().addHours(-2) && game.status < 3) {
				result.error = gameStatuses.STATS;
				return result;
			}

			//Check for referees
			if (date < now && _teamType == firstTeam && !_referee) {
				result.error = gameStatuses.REFEREE;
				return result;
			}

			//Check for man/woman of steel
			if (game._competition.instance.manOfSteelPoints && !game._competition.instance.manOfSteelPointsGoneDark) {
				const nextMondayAfternoon = new Date(date).next().monday().setHours(16, 0, 0);

				const pointsRequired = !game.manOfSteel || game.manOfSteel.length < 3;

				if (now > nextMondayAfternoon && pointsRequired) {
					result.error = gameStatuses.STEEL[game.gender];
					return result;
				}
			}
		})
		.filter(_.identity);
}
