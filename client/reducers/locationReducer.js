import {
	DELETE_COUNTRY,
	FETCH_CITIES,
	FETCH_COUNTRIES,
	UPDATE_COUNTRY,
	UPDATE_CITY,
	DELETE_CITY
} from "../actions/types";

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

		case UPDATE_CITY:
			return {
				...state,
				cities: [...state.cities.filter(c => c._id != action.payload._id), action.payload]
			};

		case UPDATE_COUNTRY:
			return {
				...state,
				countries: [
					...state.countries.filter(c => c._id != action.payload._id),
					action.payload
				]
			};

		case DELETE_CITY:
			return {
				...state,
				cities: [...state.cities.filter(c => c._id != action.payload)]
			};

		case DELETE_COUNTRY:
			return {
				...state,
				countries: [...state.countries.filter(c => c._id != action.payload)]
			};

		default:
			return state;
	}
}
