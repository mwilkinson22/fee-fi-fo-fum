import axios from "axios";
import { FETCH_PERSON, FETCH_PLAYER_STAT_YEARS, FETCH_PLAYER_STATS } from "./types";
import PlayerStatsHelper from "../helperClasses/PlayerStatsHelper";

export const fetchPersonBySlug = slug => async dispatch => {
	const res = await axios.get(`/api/people/slug/${slug}`);
	dispatch({ type: FETCH_PERSON, payload: res.data });
};

export const fetchPlayerStatYears = id => async dispatch => {
	const res = await axios.get(`/api/people/playerStatsYears/${id}`);
	dispatch({ type: FETCH_PLAYER_STAT_YEARS, payload: res.data });
};

export const fetchPlayerStats = (id, year) => async dispatch => {
	const res = await axios.get(`/api/people/playerStats/${id}/${year}`);
	res.data.games = res.data.games.map(game => {
		const stats = PlayerStatsHelper.processStats(game.playerStats[0].stats);
		return {
			...game,
			playerStats: {
				...game.playerStats,
				stats
			}
		};
	});
	dispatch({ type: FETCH_PLAYER_STATS, payload: res.data });
};
