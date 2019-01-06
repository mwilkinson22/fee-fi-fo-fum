import axios from "axios";
import { FETCH_PERSON } from "./types";

export const fetchPersonBySlug = slug => async dispatch => {
	const res = await axios.get(`/api/people/slug/${slug}`);
	dispatch({ type: FETCH_PERSON, payload: res.data });
};
