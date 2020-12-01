import {
	DELETE_SOCIAL_PROFILE,
	FETCH_SOCIAL_PROFILE,
	FETCH_SOCIAL_PROFILES,
	SET_DEFAULT_SOCIAL_PROFILE
} from "./types";
import { toast } from "react-toastify";

export const createProfile = data => async (dispatch, getState, api) => {
	const res = await api.post(`/socialProfiles`, data);
	dispatch({ type: FETCH_SOCIAL_PROFILE, payload: res.data });
	toast.success(`Profile Created`);
	return res.data._id;
};

export const setDefaultProfile = id => async dispatch => {
	dispatch({ type: SET_DEFAULT_SOCIAL_PROFILE, payload: id });
};

export const fetchProfiles = () => async (dispatch, getState, api) => {
	const res = await api.get(`/socialProfiles`);
	dispatch({ type: FETCH_SOCIAL_PROFILES, payload: res.data });
};

export const updateProfile = (id, data) => async (dispatch, getState, api) => {
	const res = await api.put(`/socialProfiles/${id}`, data);
	dispatch({ type: FETCH_SOCIAL_PROFILE, payload: res.data });
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

export const simpleSocialPost = data => async (dispatch, getState, api) => {
	const res = await api.post("/social/simplePost", data);
	if (res.data) {
		toast.success("Post successful");
	}
};

export const simpleSocialPostThread = data => async (dispatch, getState, api) => {
	const res = await api.post("/social/simplePostThread", data);
	if (res.data) {
		toast.success("Thread successfully posted");
	}
};

export const validateTwitterCredentials = data => async (dispatch, getState, api) => {
	const res = await api.post(`/socialProfiles/validateTwitter`, data);
	return res.data;
};
