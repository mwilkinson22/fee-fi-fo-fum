import { FETCH_TEAM_SELECTOR, FETCH_TEAM_SELECTOR_LIST, DELETE_TEAM_SELECTOR } from "./types";
import { toast } from "react-toastify";

export const fetchTeamSelector = id => async (dispatch, getState, api) => {
	const res = await api.get(`/teamSelectors/${id}`);
	if (res.data) {
		dispatch({ type: FETCH_TEAM_SELECTOR, payload: res.data });
	}
};

export const fetchTeamSelectorForGame = id => async (dispatch, getState, api) => {
	const res = await api.get(`/teamSelectors/game/${id}`);
	dispatch({ type: FETCH_TEAM_SELECTOR, payload: res.data });
};

export const fetchPreviewImage = id => async (dispatch, getState, api) => {
	const res = await api.get(`/teamSelectors/${id}/previewImage`);
	if (res.data) {
		return res.data;
	}
	return false;
};

export const fetchAllTeamSelectors = () => async (dispatch, getState, api) => {
	const res = await api.get("/teamSelectors");
	dispatch({ type: FETCH_TEAM_SELECTOR_LIST, payload: res.data });
};

export const createTeamSelector = data => async (dispatch, getState, api) => {
	const res = await api.post("/teamSelectors", data);
	if (res.data) {
		dispatch({ type: FETCH_TEAM_SELECTOR, payload: res.data });
		toast.success("Team Selector Updated");
		return res.data._id;
	}
};

export const updateTeamSelector = (id, data) => async (dispatch, getState, api) => {
	const res = await api.put(`/teamSelectors/${id}`, data);
	if (res.data) {
		dispatch({ type: FETCH_TEAM_SELECTOR, payload: res.data });
		toast.success("Team Selector Updated");
	}
};

export const deleteTeamSelector = id => async (dispatch, getState, api) => {
	const res = await api.delete(`/teamSelectors/${id}`);
	if (res.data) {
		dispatch({ type: DELETE_TEAM_SELECTOR, payload: id });
		toast.success("Team Selector Deleted");
		return true;
	}
};

export const saveTeamSelectorChoices = (id, choices) => async (dispatch, getState, api) => {
	const res = await api.post(`/teamSelectors/${id}/choices`, choices);
	if (res.data) {
		dispatch({ type: FETCH_TEAM_SELECTOR, payload: res.data });
		return true;
	}
};

export const shareTeamSelector = (id, data) => async (dispatch, getState, api) => {
	const res = await api.post(`/teamSelectors/${id}/share`, data);
	return res.data || false;
};
