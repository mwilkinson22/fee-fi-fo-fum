import { FETCH_CITIES, FETCH_COUNTRIES } from "./types";

export const fetchCities = () => async (dispatch, getState, api) => {
	const res = await api.get("/cities");
	dispatch({ type: FETCH_CITIES, payload: res.data });
};

export const fetchCountries = () => async (dispatch, getState, api) => {
	const res = await api.get("/countries");
	dispatch({ type: FETCH_COUNTRIES, payload: res.data });
};
