import { FETCH_USER, LOGOUT } from "./types";

export const fetchUser = () => async (dispatch, getState, api) => {
	const res = await api.get("/current_user");
	dispatch({ type: FETCH_USER, payload: res.data });
};

export const login = data => async (dispatch, getState, api) => {
	const res = await api.post("/login", data);
	dispatch({ type: FETCH_USER, payload: res.data });
};

export const logout = () => async (dispatch, getState, api) => {
	const res = await api.get("/logout");
	dispatch({ type: LOGOUT, payload: res.data });
};
