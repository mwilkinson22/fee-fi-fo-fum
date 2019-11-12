import {
	DELETE_CITY,
	DELETE_COUNTRY,
	FETCH_CITIES,
	FETCH_COUNTRIES,
	FETCH_CITY,
	FETCH_COUNTRY
} from "./types";
import { toast } from "react-toastify";

export const fetchCities = () => async (dispatch, getState, api) => {
	const res = await api.get("/cities");
	dispatch({ type: FETCH_CITIES, payload: res.data });
};

export const fetchCountries = () => async (dispatch, getState, api) => {
	const res = await api.get("/countries");
	dispatch({ type: FETCH_COUNTRIES, payload: res.data });
};

export const createCity = data => async (dispatch, getState, api) => {
	const res = await api.post("/cities", data);
	dispatch({ type: FETCH_CITY, payload: res.data });
	toast.success("New City Created");
	return res.data._id;
};

export const createCountry = data => async (dispatch, getState, api) => {
	const res = await api.post("/countries", data);
	dispatch({ type: FETCH_COUNTRY, payload: res.data });
	toast.success("New Country Created");
	return res.data.slug;
};

export const updateCity = (id, data) => async (dispatch, getState, api) => {
	const res = await api.put(`/cities/${id}`, data);
	dispatch({ type: FETCH_CITY, payload: res.data });
	toast.success("City Updated");
};

export const updateCountry = (id, data) => async (dispatch, getState, api) => {
	const res = await api.put(`/countries/${id}`, data);
	dispatch({ type: FETCH_COUNTRY, payload: res.data });
	toast.success("Country Updated");
	return res.data.slug;
};

export const deleteCity = id => async (dispatch, getState, api) => {
	const res = await api.delete(`/cities/${id}`);
	if (res.data) {
		dispatch({ type: DELETE_CITY, payload: id });
		toast.success("City Deleted");
		return true;
	}
	return false;
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
