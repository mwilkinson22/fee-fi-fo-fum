import { FETCH_LEAGUE_TABLE } from "./types";

export const fetchLeagueTable = (competition, year, fromDate, toDate) => async (
	dispatch,
	getState,
	api
) => {
	const res = await api.get(`/leagueTable/${competition}/${year}`);
	dispatch({
		type: FETCH_LEAGUE_TABLE,
		payload: { competition, year, fromDate, toDate, ...res.data }
	});
};
