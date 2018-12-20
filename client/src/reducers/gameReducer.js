import { FETCH_FIXTURES, FETCH_RESULTS } from "../actions/types";

export default function(state = {}, action) {
	switch (action.type) {
		case FETCH_FIXTURES:
			return { ...state, fixtures: action.payload };
		case FETCH_RESULTS:
			return { ...state, results: action.payload };
		default:
			return state;
	}
}
