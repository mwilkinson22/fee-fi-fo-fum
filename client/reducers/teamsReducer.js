import {
	FETCH_ALL_TEAM_TYPES,
	FETCH_ALL_TEAMS,
	UPDATE_TEAM,
	FETCH_TEAM,
	SET_ACTIVE_TEAM_TYPE
} from "../actions/types";

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

		case SET_ACTIVE_TEAM_TYPE:
			return {
				...state,
				activeTeamType: action.payload
			};
		default:
			return state;
	}
}
