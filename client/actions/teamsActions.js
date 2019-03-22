import { FETCH_ALL_TEAM_TYPES, FETCH_ALL_TEAMS, UPDATE_TEAM, FETCH_TEAM } from "./types";

export const fetchTeamList = () => async (dispatch, getState, api) => {
	const res = await api.get("/teams");
	dispatch({ type: FETCH_ALL_TEAMS, payload: res.data });
};

export const fetchTeam = id => async (dispatch, getState, api) => {
	const res = await api.get(`/team/${id}`);
	dispatch({ type: FETCH_TEAM, payload: res.data });
};

export const fetchAllTeamTypes = () => async (dispatch, getState, api) => {
	const res = await api.get("/teamTypes");
	dispatch({ type: FETCH_ALL_TEAM_TYPES, payload: res.data });
};

export const updateTeam = (id, values) => async (dispatch, getState, api) => {
	const res = await api.put(`/teams/${id}`, values);
	dispatch({ type: UPDATE_TEAM, payload: res.data });
};
