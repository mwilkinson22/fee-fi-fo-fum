import { FETCH_ALL_COMPETITIONS } from "./types";

export const fetchAllCompetitions = () => async (dispatch, getState, api) => {
	const res = await api.get("/competitions");
	dispatch({ type: FETCH_ALL_COMPETITIONS, payload: res.data });
};
