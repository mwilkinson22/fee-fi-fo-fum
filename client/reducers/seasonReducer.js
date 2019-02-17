import { FETCH_LEAGUE_TABLE } from "../actions/types";

export default function(state = { leagueTables: {} }, action) {
	switch (action.type) {
		case FETCH_LEAGUE_TABLE:
			const { competition, year, fromDate, toDate } = action;
			const key = [competition, year, fromDate, toDate].join("-");
			return {
				...state,
				leagueTables: {
					...state.leagueTables,
					[key]: action.payload
				}
			};

		default:
			return state;
	}
}
