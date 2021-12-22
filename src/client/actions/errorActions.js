import { FETCH_ERRORS, CLEAR_ERRORS, SEND_ERROR } from "./types";

export const fetchErrors = includeArchived => async (dispatch, getState, api) => {
	//Clear out errors (in case of a refresh)
	dispatch({ type: CLEAR_ERRORS, payload: false });

	//Get uri
	let uri = "/errors";

	//Include archived?
	if (includeArchived) {
		uri += `?includeArchived=true`;
	}

	const res = await api.get(uri);
	dispatch({ type: FETCH_ERRORS, payload: res.data });
};

export const sendError = data => async (dispatch, getState, api) => {
	await api.post("/errors", data);
	dispatch({ type: SEND_ERROR, payload: data.errorPage });
};

export const archiveError = id => async (dispatch, getState, api) => {
	const res = await api.put(`/errors/archive/${id}`);
	dispatch({ type: FETCH_ERRORS, payload: res.data });
};

export const unarchiveError = id => async (dispatch, getState, api) => {
	const res = await api.put(`/errors/unarchive/${id}`);
	dispatch({ type: FETCH_ERRORS, payload: res.data });
};

export const archiveAllErrors = () => async (dispatch, getState, api) => {
	const res = await api.put(`/errors/archive`);
	dispatch({ type: FETCH_ERRORS, payload: res.data });
};
