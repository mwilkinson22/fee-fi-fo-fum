import { FETCH_PEOPLE_LIST, FETCH_PERSON } from "../actions/types";

export default function(state = { fullPeople: {} }, action) {
	switch (action.type) {
		case FETCH_PERSON:
			return {
				...state,
				fullPeople: { ...state.fullPeople, [action.payload.id]: action.payload }
			};

		case FETCH_PEOPLE_LIST:
			return { ...state, ...action.payload };

		default:
			return state;
	}
}
