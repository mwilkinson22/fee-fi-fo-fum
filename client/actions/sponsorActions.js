import { DELETE_SPONSOR, FETCH_SPONSOR, FETCH_SPONSORS } from "./types";
import { toast } from "react-toastify";

export const createSponsor = data => async (dispatch, getState, api) => {
	const res = await api.post(`/sponsors`, data);
	dispatch({ type: FETCH_SPONSOR, payload: res.data });
	toast.success("Sponsor Created");
	return res.data._id;
};

export const fetchSponsors = () => async (dispatch, getState, api) => {
	const res = await api.get(`/sponsors`);
	dispatch({ type: FETCH_SPONSORS, payload: res.data });
};

export const updateSponsor = (id, data) => async (dispatch, getState, api) => {
	const res = await api.put(`/sponsors/${id}`, data);
	dispatch({ type: FETCH_SPONSOR, payload: res.data });
	toast.success("Sponsor Updated");
};

export const deleteSponsor = id => async (dispatch, getState, api) => {
	const res = await api.delete(`/sponsors/${id}`);
	if (res.data) {
		dispatch({ type: DELETE_SPONSOR, payload: id });
		toast.success("Sponsor Deleted");
		return true;
	}
	return false;
};