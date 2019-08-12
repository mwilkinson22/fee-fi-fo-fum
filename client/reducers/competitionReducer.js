import {
	DELETE_COMPETITION,
	FETCH_ALL_COMPETITION_SEGMENTS,
	FETCH_ALL_COMPETITIONS,
	FETCH_COMPETITION
} from "../actions/types";

export default function(state = {}, action) {
	switch (action.type) {
		case FETCH_ALL_COMPETITIONS:
			return {
				...state,
				competitionList: action.payload
			};

		case FETCH_COMPETITION:
			return {
				...state,
				competitionList: {
					...state.competitionList,
					[action.payload._id]: action.payload
				}
			};

		case DELETE_COMPETITION:
			const { [action.payload]: oldId, ...competitionList } = state.competitionList;
			return {
				...state,
				competitionList
			};

		case FETCH_ALL_COMPETITION_SEGMENTS:
			return {
				...state,
				competitionSegmentList: action.payload
			};
		default:
			return state;
	}
}
