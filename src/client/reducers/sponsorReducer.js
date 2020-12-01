import { DELETE_SPONSOR, FETCH_SPONSOR, FETCH_SPONSORS } from "../actions/types";

export default function(state = {}, action) {
	switch (action.type) {
		case FETCH_SPONSORS:
			return {
				...state,
				sponsorList: action.payload
			};

		case FETCH_SPONSOR:
			return {
				...state,
				sponsorList: {
					...state.sponsorList,
					[action.payload._id]: action.payload
				}
			};

		case DELETE_SPONSOR: {
			const { [action.payload]: oldId, ...sponsorList } = state.sponsorList;
			return {
				...state,
				sponsorList
			};
		}

		default:
			return state;
	}
}
