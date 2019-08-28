import { FETCH_ALL_TEAM_TYPES, FETCH_ALL_TEAMS, UPDATE_TEAM, FETCH_TEAM } from "./types";
import { toast } from "react-toastify";

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

export const createTeam = values => async (dispatch, getState, api) => {
	const res = await api.post(`/teams/`, values);
	toast.success("Team Created");
	dispatch({ type: UPDATE_TEAM, payload: res.data });
	return res.data;
};

export const updateTeam = (id, values) => async (dispatch, getState, api) => {
	const res = await api.put(`/teams/${id}`, values);
	toast.success("Team updated");
	dispatch({ type: UPDATE_TEAM, payload: res.data });
};

export const updateTeamSquad = (team_id, squad_id, data) => async (dispatch, getState, api) => {
	const res = await api.put(`/teams/${team_id}/squad/${squad_id}`, data);
	toast.success("Squad updated");
	dispatch({ type: UPDATE_TEAM, payload: res.data });
};

export const appendTeamSquad = (team_id, squad_id, data) => async (dispatch, getState, api) => {
	const res = await api.put(`/teams/${team_id}/squad/${squad_id}/append`, data);
	toast.success("Squad updated");
	dispatch({ type: UPDATE_TEAM, payload: res.data });
};

export const createTeamSquad = (team_id, data) => async (dispatch, getState, api) => {
	const res = await api.post(`/teams/${team_id}/squad`, data);
	toast.success("Squad created");
	dispatch({ type: UPDATE_TEAM, payload: res.data });
};
