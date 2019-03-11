import { FETCH_ALL_GROUNDS } from "../actions/types";

export default function(state = {}, action) {
	switch (action.type) {
		case FETCH_ALL_GROUNDS:
			return {
				...state,
				...action.payload
			};
		default:
			return state;
	}
}
