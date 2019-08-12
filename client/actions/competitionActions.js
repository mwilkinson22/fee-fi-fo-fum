import {
	DELETE_COMPETITION,
	FETCH_ALL_COMPETITION_SEGMENTS,
	FETCH_ALL_COMPETITIONS,
	FETCH_COMPETITION
} from "./types";
import { toast } from "react-toastify";

export const fetchCompetitions = () => async (dispatch, getState, api) => {
	const res = await api.get("/competitions");
	dispatch({ type: FETCH_ALL_COMPETITIONS, payload: res.data });
};

export const createCompetition = data => async (dispatch, getState, api) => {
	const res = await api.post("/competitions", data);
	dispatch({ type: FETCH_COMPETITION, payload: res.data });
	toast.success(`Competition created`);
	return res.data._id;
};

export const updateCompetition = (id, data) => async (dispatch, getState, api) => {
	const res = await api.put(`/competitions/${id}`, data);
	dispatch({ type: FETCH_COMPETITION, payload: res.data });
	toast.success(`Competition updated`);
};

export const deleteCompetition = id => async (dispatch, getState, api) => {
	const res = await api.delete(`/competitions/${id}`);
	if (res.data) {
		dispatch({ type: DELETE_COMPETITION, payload: id });
		toast.success(`Competition deleted`);
		return true;
	}
};

export const fetchCompetitionSegments = () => async (dispatch, getState, api) => {
	const res = await api.get("/competitions/segments");
	dispatch({ type: FETCH_ALL_COMPETITION_SEGMENTS, payload: res.data });
};
