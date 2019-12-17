import { FETCH_ERRORS, SEND_ERROR } from "./types";

export const fetchErrors = () => async (dispatch, getState, api) => {
	const res = await api.get("/errors");
	dispatch({ type: FETCH_ERRORS, payload: res.data });
};

export const sendError = data => async (dispatch, getState, api) => {
	await api.post("/errors", data);
	dispatch({ type: SEND_ERROR, payload: data.errorPage });
};
