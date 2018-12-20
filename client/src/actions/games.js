import axios from "axios";
import { FETCH_FIXTURES, FETCH_RESULTS } from "./types";

export const fetchFixtures = () => async dispatch => {
	const res = await axios.get("/api/games/fixtures/");
	dispatch({ type: FETCH_FIXTURES, payload: res.data });
};

export const fetchResults = year => async dispatch => {
	const res = await axios.get(`/api/games/results/${year}`);
	dispatch({ type: FETCH_RESULTS, payload: res.data });
};
