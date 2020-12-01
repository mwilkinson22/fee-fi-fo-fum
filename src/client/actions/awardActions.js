import { FETCH_CURRENT_AWARDS, FETCH_AWARDS, FETCH_AWARD, DELETE_AWARD } from "./types";
import { toast } from "react-toastify";

export const fetchCurrentAwards = ip => async (dispatch, getState, api) => {
	const res = await api.get(`/awards/current?ip=${ip}`);
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

export const addCategory = (id, data) => async (dispatch, getState, api) => {
	const res = await api.post(`/awards/${id}/category`, data);
	if (res.data) {
		toast.success("Category added");
		dispatch({ type: FETCH_AWARD, payload: res.data.award });
		return res.data.categoryId;
	}
};

export const updateCategory = (award_id, category_id, data) => async (dispatch, getState, api) => {
	const res = await api.put(`/awards/${award_id}/category/${category_id}`, data);
	if (res.data) {
		toast.success("Category updated");
		dispatch({ type: FETCH_AWARD, payload: res.data });
	}
};

export const deleteAward = id => async (dispatch, getState, api) => {
	const res = await api.delete(`/awards/${id}`);
	if (res.data) {
		dispatch({ type: DELETE_AWARD, payload: id });
		toast.success("Award deleted");
		return true;
	}
};

export const deleteCategory = (award_id, category_id) => async (dispatch, getState, api) => {
	const res = await api.delete(`/awards/${award_id}/category/${category_id}`);
	if (res.data) {
		toast.success("Category deleted");
		dispatch({ type: FETCH_AWARD, payload: res.data });
		return true;
	}
};

export const submitVotes = (award_id, votes) => async (dispatch, getState, api) => {
	const res = await api.put(`/awards/${award_id}/votes`, votes);
	dispatch({ type: FETCH_CURRENT_AWARDS, payload: res.data });
	return true;
};
