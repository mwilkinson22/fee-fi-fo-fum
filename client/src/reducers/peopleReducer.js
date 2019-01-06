import { FETCH_PERSON } from "../actions/types";

export default function(state = { squads: {} }, action) {
	switch (action.type) {
		case FETCH_PERSON:
			return { ...state, [action.payload.slug]: action.payload };

		default:
			return state;
	}
}
