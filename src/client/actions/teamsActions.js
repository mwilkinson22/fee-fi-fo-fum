import {
	FETCH_ALL_TEAM_TYPES,
	FETCH_ALL_TEAMS,
	FETCH_TEAM,
	FETCH_UPDATED_TEAM,
	SET_ACTIVE_TEAM_TYPE,
	FETCH_TEAM_TYPE,
	DELETE_TEAM_TYPE,
	DELETE_TEAM
} from "./types";
import { toast } from "react-toastify";

export const fetchTeamList = () => async (dispatch, getState, api) => {
	const res = await api.get("/teams");
	dispatch({ type: FETCH_ALL_TEAMS, payload: res.data });
};

export const fetchTeam = (id, dataLevel) => async (dispatch, getState, api) => {
	if (dataLevel !== "full") {
		dataLevel = "basic";
	}
	const res = await api.get(`/team/${id}/${dataLevel}`);
	if (res.data) {
		const team = res.data;
		team.fullData = dataLevel === "full";
		dispatch({ type: FETCH_TEAM, payload: team });
	}
};

export const setActiveTeamType = _id => async dispatch => {
	dispatch({ type: SET_ACTIVE_TEAM_TYPE, payload: _id });
};

export const createTeam = values => async (dispatch, getState, api) => {
	const res = await api.post(`/teams/`, values);
	if (res.data) {
		toast.success("Team Created");
		dispatch({ type: FETCH_UPDATED_TEAM, payload: res.data });
		return res.data._id;
	}
};

export const updateTeam = (id, values) => async (dispatch, getState, api) => {
	const res = await api.put(`/teams/${id}`, values);
	toast.success("Team updated");
	dispatch({ type: FETCH_UPDATED_TEAM, payload: res.data });
};

export const deleteTeam = id => async (dispatch, getState, api) => {
	const res = await api.delete(`/teams/${id}`);
	if (res.data) {
		toast.success("Team Deleted");
		dispatch({ type: DELETE_TEAM, payload: id });
		return true;
	}
};

export const addCoach = (team_id, data) => async (dispatch, getState, api) => {
	const res = await api.post(`/teams/${team_id}/coaches`, data);
	toast.success("Coach added");
	dispatch({ type: FETCH_UPDATED_TEAM, payload: res.data });
};

export const appendTeamSquad = (team_id, squad_id, data) => async (dispatch, getState, api) => {
	const res = await api.put(`/teams/${team_id}/squad/${squad_id}/append`, data);
	toast.success("Squad updated");
	dispatch({ type: FETCH_UPDATED_TEAM, payload: res.data });
};

export const createTeamSquad = (team_id, data) => async (dispatch, getState, api) => {
	const res = await api.post(`/teams/${team_id}/squad`, data);
	if (res.data) {
		toast.success("Squad created");
		dispatch({ type: FETCH_UPDATED_TEAM, payload: res.data });

		//Get the new squad
		const team = res.data.fullTeams[team_id];
		const newSquad = team.squads.find(
			({ _teamType, year }) => _teamType == data._teamType && year == data.year
		);
		return newSquad._id;
	}
};

export const updateTeamSquad = (team_id, squad_id, data) => async (dispatch, getState, api) => {
	const res = await api.put(`/teams/${team_id}/squad/${squad_id}`, data);
	if (res.data) {
		dispatch({ type: FETCH_UPDATED_TEAM, payload: res.data });

		//Check if squad has been deleted
		const team = res.data.fullTeams[team_id];
		const squad = team.squads.find(({ _id }) => _id == squad_id);
		if (squad) {
			toast.success("Squad updated");
		} else {
			toast.success("Squad deleted");
			return true;
		}
	}
};

export const fetchAllTeamTypes = () => async (dispatch, getState, api) => {
	const res = await api.get("/teamTypes");
	dispatch({ type: FETCH_ALL_TEAM_TYPES, payload: res.data });
};

export const createTeamType = data => async (dispatch, getState, api) => {
	const res = await api.post("/teamTypes", data);
	if (res.data) {
		toast.success(`Team Type created`);
		dispatch({ type: FETCH_TEAM_TYPE, payload: res.data });
		return res.data._id;
	}
};

export const updateTeamType = (id, data) => async (dispatch, getState, api) => {
	const res = await api.put(`/teamTypes/${id}`, data);
	if (res.data) {
		toast.success(`Team Type updated`);
		dispatch({ type: FETCH_TEAM_TYPE, payload: res.data });
	}
};

export const deleteTeamType = id => async (dispatch, getState, api) => {
	const res = await api.delete(`/teamTypes/${id}`);
	if (res.data) {
		toast.success(`Team Type deleted`);
		dispatch({ type: DELETE_TEAM_TYPE, payload: id });
		return true;
	}
	return false;
};
