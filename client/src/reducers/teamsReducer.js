import { FETCH_SQUAD, FETCH_YEARS_WITH_SQUADS } from "../actions/types";
import _ from "lodash";

export default function(state = {}, action) {
	switch (action.type) {
		case FETCH_SQUAD:
			return {
				...state,
				squads: { ...state.squads, [action.payload.year]: action.payload.players }
			};
		case FETCH_YEARS_WITH_SQUADS:
			return {
				...state,
				squads: _.chain(action.payload)
					.map(year => [year, null])
					.fromPairs()
					.value()
			};
		default:
			return state;
	}
}
