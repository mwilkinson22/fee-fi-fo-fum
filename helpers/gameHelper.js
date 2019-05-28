import _ from "lodash";

export function validateGameDate(game, listType, year = null) {
	const now = new Date();

	if (listType === "results") {
		return game.date <= now && game.date.getFullYear() == year;
	} else {
		return game.date > now;
	}
}

export function fixDates(games) {
	return _.mapValues(games, game => {
		game.date = new Date(game.date);
		return game;
	});
}

export function convertTeamToSelect(game, teamList) {
	return _.chain(game.playerStats)
		.groupBy("_team")
		.map((squad, team) => {
			const options = _.chain(squad)
				.sortBy("position")
				.map(({ _player }) => {
					const p = _.find(game.eligiblePlayers[team], p => _player == p._player._id);
					const numberStr = p.number ? `${p.number}. ` : "";
					const label = numberStr + p._player.name.full;
					return { label, value: _player };
				})
				.value();
			return { label: teamList[team].name.short, options };
		})
		.value();
}
