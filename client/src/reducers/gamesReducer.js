import {
	FETCH_FIXTURES,
	FETCH_RESULTS,
	FETCH_RESULT_YEARS,
	UPDATE_ACTIVE_YEAR,
	UPDATE_FILTERS,
	FETCH_GAME
} from "../actions/types";

export default function(state = { fullGames: {} }, action) {
	switch (action.type) {
		case FETCH_GAME:
			return {
				...state,
				fullGames: {
					...state.fullGames,
					[action.payload.slug]: action.payload
				}
			};
		case FETCH_FIXTURES:
			return { ...state, fixtures: action.payload };
		case FETCH_RESULTS:
			return { ...state, results: action.payload };
		case FETCH_RESULT_YEARS:
			return { year: action.payload[0], years: action.payload, ...state };
		case UPDATE_ACTIVE_YEAR:
			return { ...state, year: action.payload };
		case UPDATE_FILTERS: {
			return { ...state, filters: action.payload };
		}
		default:
			return state;
	}
}
