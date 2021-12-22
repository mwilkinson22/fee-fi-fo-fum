import {
	FETCH_ALL_TEAM_TYPES,
	FETCH_ALL_TEAMS,
	FETCH_TEAM,
	FETCH_UPDATED_TEAM,
	SET_ACTIVE_TEAM_TYPE,
	FETCH_TEAM_TYPE,
	DELETE_TEAM_TYPE,
	DELETE_TEAM
} from "../actions/types";

export default function (state = { fullTeams: {}, teamListLoaded: false }, action) {
	switch (action.type) {
		case FETCH_TEAM: {
			return {
				...state,
				fullTeams: {
					...state.fullTeams,
					[action.payload._id]: action.payload
				}
			};
		}
		case FETCH_UPDATED_TEAM:
			return {
				...state,
				fullTeams: {
					...state.fullTeams,
					...action.payload.fullTeams
				},
				teamList: {
					...state.teamList,
					...action.payload.teamList
				}
			};

		case FETCH_ALL_TEAMS:
			return {
				...state,
				...action.payload,
				teamListLoaded: true
			};

		case FETCH_ALL_TEAM_TYPES:
			return {
				...state,
				teamTypes: action.payload
			};

		case FETCH_TEAM_TYPE:
			return {
				...state,
				teamTypes: {
					...state.teamTypes,
					[action.payload._id]: action.payload
				}
			};

		case DELETE_TEAM: {
			const { [action.payload]: oldId, ...teamList } = state.teamList;
			const { [action.payload]: oldId2, ...fullTeams } = state.fullTeams;
			return {
				...state,
				teamList,
				fullTeams
			};
		}

		case DELETE_TEAM_TYPE: {
			const { [action.payload]: oldId, ...teamTypes } = state.teamTypes;
			return {
				...state,
				teamTypes
			};
		}

		case SET_ACTIVE_TEAM_TYPE:
			return {
				...state,
				activeTeamType: action.payload
			};
		default:
			return state;
	}
}
