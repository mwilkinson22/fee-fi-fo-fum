import { FETCH_CITIES, FETCH_COUNTRIES } from "../actions/types";

export default function(state = {}, action) {
	switch (action.type) {
		case FETCH_CITIES:
			return {
				...state,
				cities: action.payload
			};

		case FETCH_COUNTRIES:
			return {
				...state,
				countries: action.payload
			};

		default:
			return state;
	}
}
