import { FETCH_CURRENT_AWARDS } from "./types";
import { toast } from "react-toastify";

export const fetchCurrentAwards = () => async (dispatch, getState, api) => {
	const res = await api.get(`/awards/current`);
	dispatch({ type: FETCH_CURRENT_AWARDS, payload: res.data });
};
