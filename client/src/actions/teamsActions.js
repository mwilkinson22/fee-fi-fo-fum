import axios from "axios";
import { FETCH_SQUAD, FETCH_YEARS_WITH_SQUADS } from "./types";

export const fetchSquad = (year, team = "local") => async dispatch => {
	const res = await axios.get(`/api/teams/squads/${team}/${year}`);
	dispatch({ type: FETCH_SQUAD, payload: res.data });
};
export const fetchYearsWithSquads = (team = "local") => async dispatch => {
	const res = await axios.get(`/api/teams/squads/years/${team}`);
	dispatch({ type: FETCH_YEARS_WITH_SQUADS, payload: res.data });
};
