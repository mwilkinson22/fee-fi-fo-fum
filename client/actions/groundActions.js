import { FETCH_ALL_GROUNDS } from "./types";

export const fetchAllGrounds = () => async (dispatch, getState, api) => {
	const res = await api.get(`/grounds`);
	dispatch({ type: FETCH_ALL_GROUNDS, payload: res.data });
};
