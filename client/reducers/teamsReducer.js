import { FETCH_ALL_TEAM_TYPES, FETCH_ALL_TEAMS, UPDATE_TEAM, FETCH_TEAM } from "../actions/types";
import _ from "lodash";

export default function(state = { fullTeams: {} }, action) {
	switch (action.type) {
		case FETCH_TEAM:
		case UPDATE_TEAM:
			return {
				...state,
				fullTeams: {
					...state.fullTeams,
					...action.payload
				}
			};
		case FETCH_ALL_TEAMS:
			return {
				...state,
				...action.payload
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
