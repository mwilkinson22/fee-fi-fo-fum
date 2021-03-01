//Modules
import _ from "lodash";

export const getPlayersByYearAndGender = (teamId, year, teamType) => (dispatch, getState) => {
	//Get Squads
	const { squads } = getState().teams.fullTeams[teamId];

	//Create Empty Array
	const players = [];

	//Get the named teamType first
	const teamTypeSquad = squads.find(s => s.year == year && s._teamType == teamType._id);
	if (teamTypeSquad) {
		players.push(...teamTypeSquad.players);
	}

	//Get Other Team Types of same gender
	const { teamTypes } = getState().teams;
	const { gender } = teamType;
	const additionalTeamTypes = _.filter(teamTypes, t => t.gender == gender && t._id != teamType._id);

	if (additionalTeamTypes.length) {
		const additionalPlayers = squads
			//Get the corresponding squads
			.filter(s => s.year == year && additionalTeamTypes.find(t => t._id == s._teamType))
			//Pull off the players
			.map(s => s.players)
			//Flatten to a single list of players
			.flat()
			//Remove those already in the primary squad
			.filter(s => !players.find(p => p._player._id == s._player._id))
			//Remove the number, as we only need this for the primary squad
			.map(p => ({ ...p, number: null }));

		players.push(..._.uniqBy(additionalPlayers, p => p._player._id));
	}

	return _.keyBy(players, p => p._player._id);
};

export function getSquadsAsDropdown(squads, teamTypes) {
	return _.chain(squads)
		.groupBy("_teamType")
		.map((squads, _teamType) => ({
			label: teamTypes[_teamType].name,
			order: teamTypes[_teamType].sortOrder,
			options: _.chain(squads)
				.orderBy("year", "desc")
				.map(squad => ({ label: squad.year, value: squad._id }))
				.value()
		}))
		.sortBy("order")
		.value();
}
