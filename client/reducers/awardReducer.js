import { FETCH_CURRENT_AWARDS } from "../actions/types";

export default function(state = {}, action) {
	switch (action.type) {
		case FETCH_CURRENT_AWARDS:
			return {
				...state,
				currentAwards: action.payload
			};

		default:
			return state;
	}
}
