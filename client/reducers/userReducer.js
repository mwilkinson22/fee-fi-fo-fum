import { FETCH_USERS, FETCH_USER, DELETE_USER } from "../actions/types";

export default function(state = {}, action) {
	switch (action.type) {
		case FETCH_USER:
			return {
				...state,
				userList: { ...state.userList, [action.payload._id]: action.payload }
			};

		case FETCH_USERS:
			return {
				...state,
				userList: action.payload
			};

		case DELETE_USER:
			const { [action.payload]: oldId, ...userList } = state.userList;
			return {
				...state,
				userList
			};
		default:
			return state;
	}
}
