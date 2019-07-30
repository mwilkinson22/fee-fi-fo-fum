import { FETCH_PEOPLE_LIST, FETCH_PERSON, FETCH_SPONSORS } from "../actions/types";

export default function(state = { fullPeople: {} }, action) {
	switch (action.type) {
		case FETCH_PERSON:
			return {
				...state,
				fullPeople: { ...state.fullPeople, [action.payload.id]: action.payload }
			};

		case FETCH_PEOPLE_LIST:
			return { ...state, ...action.payload };

		case FETCH_SPONSORS:
			return {
				...state,
				sponsors: action.payload
			};

		default:
			return state;
	}
}
