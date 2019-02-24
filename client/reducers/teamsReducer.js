import {
	FETCH_ALL_TEAM_TYPES,
	FETCH_SQUAD,
	FETCH_YEARS_WITH_SQUADS,
	FETCH_ALL_TEAMS
} from "../actions/types";
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

		case FETCH_ALL_TEAMS:
			return {
				...state,
				teamList: action.payload
			};

		case FETCH_ALL_TEAM_TYPES:
			return {
				...state,
				teamTypes: action.payload
			};
		default:
			return state;
	}
}
