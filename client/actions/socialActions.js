import { DELETE_SOCIAL_PROFILE, FETCH_SOCIAL_PROFILE, FETCH_SOCIAL_PROFILES } from "./types";
import { toast } from "react-toastify";

export const createProfile = data => async (dispatch, getState, api) => {
	const res = await api.post(`/socialProfiles`, data);
	dispatch({ type: FETCH_SOCIAL_PROFILE, payload: res.data });
	toast.success(`Profile Created`);
	return res.data._id;
};

export const fetchProfiles = () => async (dispatch, getState, api) => {
	const res = await api.get(`/socialProfiles`);
	dispatch({ type: FETCH_SOCIAL_PROFILES, payload: res.data });
};

export const updateProfile = (id, data) => async (dispatch, getState, api) => {
	const res = await api.put(`/socialProfiles/${id}`, data);
	dispatch({ type: FETCH_SOCIAL_PROFILES, payload: res.data });
	toast.success(`Profile Updated`);
};

export const deleteProfile = id => async (dispatch, getState, api) => {
	const res = await api.delete(`/socialProfiles/${id}`);
	if (res.data) {
		dispatch({ type: DELETE_SOCIAL_PROFILE, payload: id });
		toast.success(`Ground deleted`);
		return true;
	}
	return false;
};
