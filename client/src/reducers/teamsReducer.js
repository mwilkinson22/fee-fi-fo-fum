import { FETCH_SQUAD, FETCH_YEARS_WITH_SQUADS } from "../actions/types";
import _ from "lodash";

export default function(state = { squads: {} }, action) {
	switch (action.type) {
		case FETCH_SQUAD:
			return {
				...state,
				squads: { ...state.squads, [action.payload.year]: action.payload.players }
			};
		case FETCH_YEARS_WITH_SQUADS:
			return {
				...state,
				years: action.payload
			};
		default:
			return state;
	}
}
