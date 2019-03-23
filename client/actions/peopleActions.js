import {
	FETCH_ALL_REFEREES,
	FETCH_PEOPLE_LIST,
	FETCH_PERSON,
	FETCH_PLAYER_STAT_YEARS,
	FETCH_PLAYER_STATS
} from "./types";
import PlayerStatsHelper from "../helperClasses/PlayerStatsHelper";

export const fetchPeopleList = () => async (dispatch, getState, api) => {
	const res = await api.get(`/people`);
	dispatch({ type: FETCH_PEOPLE_LIST, payload: res.data });
};

export const fetchPerson = id => async (dispatch, getState, api) => {
	let payload;
	const res = await api.get(`/people/${id}`).catch(e => {
		switch (e.response.status) {
			case 307:
			case 308:
				payload = { ...e.response.data, redirect: true };
				break;
			case 404:
				payload = false;
				break;
		}
	});

	//Handle retrieved player
	if (payload === undefined) {
		payload = res.data;
	}

	dispatch({ type: FETCH_PERSON, payload });
};

export const fetchPlayerStatYears = id => async (dispatch, getState, api) => {
	const res = await api.get(`/people/playerStatsYears/${id}`);
	dispatch({ type: FETCH_PLAYER_STAT_YEARS, payload: res.data });
};

export const fetchAllReferees = () => async (dispatch, getState, api) => {
	const res = await api.get(`/people/referees`);
	dispatch({ type: FETCH_ALL_REFEREES, payload: res.data });
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
