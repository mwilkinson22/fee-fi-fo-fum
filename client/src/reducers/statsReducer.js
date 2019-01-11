import { FETCH_PLAYER_STAT_TYPES } from "../actions/types";

export default function(state = {}, action) {
	switch (action.type) {
		case FETCH_PLAYER_STAT_TYPES:
			return {
				...state,
				playerStatTypes: action.payload
			};
		default:
			return state;
	}
}
