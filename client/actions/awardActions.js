import { FETCH_CURRENT_AWARDS, FETCH_AWARDS, FETCH_AWARD, DELETE_AWARD } from "./types";
import { toast } from "react-toastify";

export const fetchCurrentAwards = () => async (dispatch, getState, api) => {
	const res = await api.get(`/awards/current`);
	dispatch({ type: FETCH_CURRENT_AWARDS, payload: res.data });
};

export const fetchAwards = () => async (dispatch, getState, api) => {
	const res = await api.get(`/awards`);
	dispatch({ type: FETCH_AWARDS, payload: res.data });
};

export const createAward = data => async (dispatch, getState, api) => {
	const res = await api.post(`/awards`, data);
	if (res.data) {
		dispatch({ type: FETCH_AWARD, payload: res.data });
		toast.success("Award created");
		return res.data._id;
	}
};

export const updateAward = (id, data) => async (dispatch, getState, api) => {
	const res = await api.put(`/awards/${id}`, data);
	if (res.data) {
		toast.success("Award updated");
		dispatch({ type: FETCH_AWARD, payload: res.data });
	}
};

export const deleteAward = (id, cb) => async (dispatch, getState, api) => {
	const res = await api.delete(`/awards/${id}`);
	if (res.data) {
		cb();
		dispatch({ type: DELETE_AWARD, payload: id });
		toast.success("Award deleted");
	}
};
