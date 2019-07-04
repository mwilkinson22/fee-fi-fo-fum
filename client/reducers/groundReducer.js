import { CREATE_GROUND, DELETE_GROUND, FETCH_ALL_GROUNDS, UPDATE_GROUND } from "../actions/types";

export default function(state = {}, action) {
	switch (action.type) {
		case FETCH_ALL_GROUNDS:
			return {
				...state,
				...action.payload
			};

		case CREATE_GROUND:
		case UPDATE_GROUND:
			return {
				...state,
				groundList: {
					...state.groundList,
					[action.payload._id]: action.payload
				}
			};

		case DELETE_GROUND:
			const { [action.payload]: oldId, ...groundList } = state.groundList;
			return {
				...state,
				groundList
			};
		default:
			return state;
	}
}
