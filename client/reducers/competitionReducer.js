import { FETCH_ALL_COMPETITIONS } from "../actions/types";

export default function(state = { fullGames: {} }, action) {
	switch (action.type) {
		case FETCH_ALL_COMPETITIONS:
			return {
				...state,
				competitionList: action.payload
			};
		default:
			return state;
	}
}
