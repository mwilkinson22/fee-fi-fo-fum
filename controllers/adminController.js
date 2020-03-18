//Mongoose
import _ from "lodash";
import mongoose from "mongoose";
const Person = mongoose.model("people");
const Team = mongoose.model("teams");
const TeamType = mongoose.model("teamTypes");

//Constants
import { localTeam } from "~/config/keys";

export async function getDashboardData(req, res) {
	//Get the localTeam
	const localTeamObject = await Team.findById(localTeam, "squads coaches").lean();

	//Get the first team
	const teamTypes = await TeamType.find({})
		.sort({ sortOrder: 1 })
		.lean();
	const firstTeam = teamTypes[0];

	//Create an object with all the data we need
	const promises = {
		birthdays: getBirthdays(localTeamObject),
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
		//Filter by year & teamtype
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
				const age = Math.floor(
					(nextBirthday - person.dateOfBirth) / (1000 * 60 * 60 * 24 * 365)
				);

				return { ...person, daysToGo, age };
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
		.filter(s => s.year >= thisYear && s._teamType == firstTeam._id.toString())
		//Get players
		.map(({ players }) => players.map(p => p._player))
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
