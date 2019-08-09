import { FETCH_ALL_COMPETITION_SEGMENTS, FETCH_ALL_COMPETITIONS } from "./types";

export const fetchCompetitions = () => async (dispatch, getState, api) => {
	const res = await api.get("/competitions");
	dispatch({ type: FETCH_ALL_COMPETITIONS, payload: res.data });
};

export const fetchCompetitionSegments = () => async (dispatch, getState, api) => {
	const res = await api.get("/competitions/segments");
	dispatch({ type: FETCH_ALL_COMPETITION_SEGMENTS, payload: res.data });
};
