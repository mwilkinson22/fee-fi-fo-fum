import { FETCH_GAMES } from "../actions/types";

export default function(state = null, action) {
	switch (action.type) {
		case FETCH_GAMES:
			return action.payload;
		default:
			return state;
	}
}
