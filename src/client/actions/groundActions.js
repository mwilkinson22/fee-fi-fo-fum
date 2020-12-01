import { FETCH_ALL_GROUNDS, FETCH_GROUND, DELETE_GROUND } from "./types";
import { toast } from "react-toastify";

export const fetchAllGrounds = () => async (dispatch, getState, api) => {
	const res = await api.get(`/grounds`);
	dispatch({ type: FETCH_ALL_GROUNDS, payload: res.data });
};

export const createGround = values => async (dispatch, getState, api) => {
	const res = await api.post(`/grounds`, values);
	dispatch({ type: FETCH_GROUND, payload: res.data });
	toast.success(`New ground saved`);
	return res.data._id;
};

export const updateGround = (id, values) => async (dispatch, getState, api) => {
	const res = await api.put(`/grounds/${id}`, values);
	dispatch({ type: FETCH_GROUND, payload: res.data });
	toast.success(`Ground updated`);
};

export const deleteGround = id => async (dispatch, getState, api) => {
	const res = await api.delete(`/grounds/${id}`);
	if (res.data) {
		dispatch({ type: DELETE_GROUND, payload: id });
		toast.success(`Ground deleted`);
		return true;
	}
	return false;
};
