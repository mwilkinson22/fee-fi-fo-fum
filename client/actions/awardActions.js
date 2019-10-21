import { FETCH_CURRENT_AWARDS, FETCH_AWARDS } from "./types";
import { toast } from "react-toastify";

export const fetchCurrentAwards = () => async (dispatch, getState, api) => {
	const res = await api.get(`/awards/current`);
	dispatch({ type: FETCH_CURRENT_AWARDS, payload: res.data });
};

export const fetchAwards = () => async (dispatch, getState, api) => {
	const res = await api.get(`/awards`);
	dispatch({ type: FETCH_AWARDS, payload: res.data });
};
