import { FETCH_ALL_COMPETITION_SEGMENTS, FETCH_ALL_COMPETITIONS } from "../actions/types";

export default function(state = {}, action) {
	switch (action.type) {
		case FETCH_ALL_COMPETITIONS:
			return {
				...state,
				competitionList: action.payload
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
