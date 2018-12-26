import axios from "axios";
import convertObjectToQuery from "../utils/convertObjectToQuery";
import {
	FETCH_FIXTURES,
	FETCH_RESULTS,
	FETCH_RESULT_YEARS,
	UPDATE_ACTIVE_YEAR,
	UPDATE_FILTERS
} from "./types";

export const fetchFixtures = filters => async dispatch => {
	const res = await axios.get(`/api/games/fixtures${convertObjectToQuery(filters)}`);
	dispatch({ type: FETCH_FIXTURES, payload: res.data });
};

export const fetchResults = (year, filters) => async dispatch => {
	const res = await axios.get(`/api/games/results/${year}${convertObjectToQuery(filters)}`);
	dispatch({ type: FETCH_RESULTS, payload: res.data });
};

export const fetchYearsWithResults = () => async dispatch => {
	const res = await axios.get(`/api/games/results/years`);
	dispatch({ type: FETCH_RESULT_YEARS, payload: res.data });
};

export const updateActiveYear = year => dispatch => {
	dispatch({ type: UPDATE_ACTIVE_YEAR, payload: year });
};

export const updateFilters = year => async dispatch => {
	const res = await axios.get(`/api/games/filters/${year}`);
	dispatch({ type: UPDATE_FILTERS, payload: res.data });
};
