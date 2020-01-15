import { FETCH_BROADCASTER, FETCH_BROADCASTERS, DELETE_BROADCASTER } from "./types";
import { toast } from "react-toastify";

export const createBroadcaster = data => async (dispatch, getState, api) => {
	const res = await api.post("/broadcasters", data);
	toast.success("Broadcaster Created");
	dispatch({ type: FETCH_BROADCASTER, payload: res.data });
	return Object.keys(res.data)[0];
};

export const fetchBroadcasters = () => async (dispatch, getState, api) => {
	const res = await api.get("/broadcasters");
	dispatch({ type: FETCH_BROADCASTERS, payload: res.data });
};

export const updateBroadcaster = (id, data) => async (dispatch, getState, api) => {
	const res = await api.post(`/broadcasters/${id}`, data);
	toast.success("Broadcaster Updated");
	dispatch({ type: FETCH_BROADCASTER, payload: res.data });
};

export const deleteBroadcaster = (id, data) => async (dispatch, getState, api) => {
	const res = await api.delete(`/broadcasters/${id}`, data);
	if (res.data) {
		dispatch({ type: DELETE_BROADCASTER, payload: id });
		toast.success("Broadcaster Deleted");
		return true;
	}

	return false;
};
