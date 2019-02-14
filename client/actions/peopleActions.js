import { FETCH_PERSON, FETCH_PLAYER_STAT_YEARS, FETCH_PLAYER_STATS } from "./types";
import PlayerStatsHelper from "../helperClasses/PlayerStatsHelper";

export const fetchPersonBySlug = slug => async (dispatch, getState, api) => {
	let payload;
	const res = await api.get(`/people/slug/${slug}`).catch(e => {
		payload = false;
	});
	if (payload === undefined) payload = res.data;

	dispatch({ type: FETCH_PERSON, payload, slug });
};

export const fetchPlayerStatYears = id => async (dispatch, getState, api) => {
	const res = await api.get(`/people/playerStatsYears/${id}`);
	dispatch({ type: FETCH_PLAYER_STAT_YEARS, payload: res.data });
};

export const fetchPlayerStats = (id, year) => async (dispatch, getState, api) => {
	const res = await api.get(`/people/playerStats/${id}/${year}`);
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
