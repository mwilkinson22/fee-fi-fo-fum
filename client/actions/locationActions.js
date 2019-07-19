import { DELETE_COUNTRY, FETCH_CITIES, FETCH_COUNTRIES, UPDATE_COUNTRY } from "./types";
import { toast } from "react-toastify";

export const fetchCities = () => async (dispatch, getState, api) => {
	const res = await api.get("/cities");
	dispatch({ type: FETCH_CITIES, payload: res.data });
};

export const fetchCountries = () => async (dispatch, getState, api) => {
	const res = await api.get("/countries");
	dispatch({ type: FETCH_COUNTRIES, payload: res.data });
};

export const createCountry = data => async (dispatch, getState, api) => {
	const res = await api.post("/countries", data);
	dispatch({ type: UPDATE_COUNTRY, payload: res.data });
	toast.success("New Country Created");
	return res.data.slug;
};

export const updateCountry = (id, data) => async (dispatch, getState, api) => {
	const res = await api.put(`/countries/${id}`, data);
	dispatch({ type: UPDATE_COUNTRY, payload: res.data });
	toast.success("Country Updated");
};

export const deleteCountry = id => async (dispatch, getState, api) => {
	const res = await api.delete(`/countries/${id}`);
	if (res.data) {
		dispatch({ type: DELETE_COUNTRY, payload: id });
		toast.success("Country Deleted");
		return true;
	}
	return false;
};
