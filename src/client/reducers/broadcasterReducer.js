import { FETCH_BROADCASTER, FETCH_BROADCASTERS, DELETE_BROADCASTER } from "../actions/types";

export default function (state = {}, action) {
	switch (action.type) {
		case FETCH_BROADCASTER: {
			return {
				...state,
				broadcasterList: {
					...state.broadcasterList,
					...action.payload
				}
			};
		}

		case FETCH_BROADCASTERS: {
			return {
				...state,
				broadcasterList: action.payload
			};
		}

		case DELETE_BROADCASTER: {
			const { [action.payload]: oldId, ...broadcasterList } = state.broadcasterList;
			return {
				...state,
				broadcasterList
			};
		}

		default:
			return state;
	}
}
