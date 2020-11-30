export function hasConnectionToTeam(person, team, returnSpecificResults = false) {
	const isInSquad = person.squadEntries && person.squadEntries.find(s => s.team._id == team);

	const hasCoachedTeam = person.coachingRoles && person.coachingRoles.find(c => c._team == team);

	const hasPlayedForTeam =
		person.playedGames && person.playedGames.find(g => g.forLocalTeam && !g.pregameOnly);

	if (returnSpecificResults) {
		return { isInSquad, hasCoachedTeam, hasPlayedForTeam };
	} else {
		return isInSquad || hasCoachedTeam || hasPlayedForTeam;
	}
}
