import _ from "lodash";
import {
	FETCH_ALL_TEAM_TYPES,
	FETCH_SQUAD,
	FETCH_YEARS_WITH_SQUADS,
	FETCH_ALL_TEAMS
} from "./types";

export const fetchSquad = (year, team = "local") => async (dispatch, getState, api) => {
	const res = await api.get(`/teams/squads/${team}/${year}`);
	dispatch({ type: FETCH_SQUAD, payload: res.data });
};
export const fetchYearsWithSquads = (team = "local") => async (dispatch, getState, api) => {
	const res = await api.get(`/teams/squads/years/${team}`);
	dispatch({ type: FETCH_YEARS_WITH_SQUADS, payload: res.data });
};

export const fetchAllTeams = () => async (dispatch, getState, api) => {
	const res = await api.get("/teams");
	dispatch({ type: FETCH_ALL_TEAMS, payload: _.keyBy(res.data, "slug") });
};

export const fetchAllTeamTypes = () => async (dispatch, getState, api) => {
	const res = await api.get("/teamTypes");
	dispatch({ type: FETCH_ALL_TEAM_TYPES, payload: res.data });
};
