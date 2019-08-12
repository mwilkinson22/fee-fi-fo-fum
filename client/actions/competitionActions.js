import {
	DELETE_COMPETITION,
	DELETE_COMPETITION_SEGMENT,
	FETCH_ALL_COMPETITION_SEGMENTS,
	FETCH_ALL_COMPETITIONS,
	FETCH_COMPETITION,
	FETCH_COMPETITION_SEGMENT
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

export const createCompetitionSegment = data => async (dispatch, getState, api) => {
	const res = await api.post("/competitions/segments", data);
	dispatch({ type: FETCH_COMPETITION_SEGMENT, payload: res.data });
	toast.success(`Competition created`);
	return res.data._id;
};

export const updateCompetitionSegment = (id, data) => async (dispatch, getState, api) => {
	const res = await api.put(`/competitions/segments/${id}`, data);
	dispatch({ type: FETCH_COMPETITION_SEGMENT, payload: res.data });
	toast.success(`Competition updated`);
};

export const deleteCompetitionSegment = id => async (dispatch, getState, api) => {
	const res = await api.delete(`/competitions/segments/${id}`);
	if (res.data) {
		dispatch({ type: DELETE_COMPETITION_SEGMENT, payload: id });
		toast.success(`Competition deleted`);
		return true;
	}
};
