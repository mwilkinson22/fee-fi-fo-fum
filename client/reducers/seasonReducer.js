import { FETCH_LEAGUE_TABLE } from "../actions/types";

export default function(state = { leagueTables: {} }, action) {
	switch (action.type) {
		case FETCH_LEAGUE_TABLE:
			return {
				...state,
				leagueTables: [...state.leagueTables, action.payload]
			};

		default:
			return state;
	}
}
