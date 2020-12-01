import {
	FETCH_USER,
	FETCH_USERS,
	FETCH_CURRENT_USER,
	LOGOUT,
	DELETE_USER,
	TRANSFER_SITE_OWNER
} from "./types";
import { toast } from "react-toastify";

export const fetchCurrentUser = () => async (dispatch, getState, api) => {
	const res = await api.get("/users/current");
	dispatch({ type: FETCH_CURRENT_USER, payload: res.data });
};

export const createUser = data => async (dispatch, getState, api) => {
	const res = await api.post(`/users`, data);
	if (res.data) {
		dispatch({ type: FETCH_USER, payload: res.data });
		toast.success(`User created`);
		return res.data._id;
	}
};

export const updateUser = (id, data) => async (dispatch, getState, api) => {
	const res = await api.put(`/users/${id}`, data);
	dispatch({ type: FETCH_USER, payload: res.data });

	//Update auth user
	const currentUser = getState().config.authUser;
	if (id === currentUser._id) {
		dispatch({ type: FETCH_CURRENT_USER, payload: res.data });
	}

	toast.success(`User updated`);
};

export const transferSiteOwnership = (id, password) => async (dispatch, getState, api) => {
	const res = await api.put(`/users/ownership/${id}`, { password });
	if (res.data) {
		dispatch({ type: FETCH_USERS, payload: res.data });
		dispatch({ type: TRANSFER_SITE_OWNER, payload: true });
		return true;
	}
	return false;
};

export const deleteUser = id => async (dispatch, getState, api) => {
	const res = await api.delete(`/users/${id}`);
	if (res.data) {
		dispatch({ type: DELETE_USER, payload: id });
		toast.success(`User deleted`);
		return true;
	}
	return false;
};

export const fetchUserList = () => async (dispatch, getState, api) => {
	const res = await api.get("/users");
	dispatch({ type: FETCH_USERS, payload: res.data });
};

export const login = data => async (dispatch, getState, api) => {
	const res = await api.post("/login", data);
	dispatch({ type: FETCH_CURRENT_USER, payload: res.data });
};

export const logout = () => async (dispatch, getState, api) => {
	const res = await api.get("/logout");
	dispatch({ type: LOGOUT, payload: res.data });
};
