import { FETCH_NEWS_POST, FETCH_NEWS_POST_LEGACY, FETCH_POST_LIST } from "../actions/types";
import { fixDates } from "~/helpers/newsHelper";

export default function(state = { fullPosts: {} }, action) {
	switch (action.type) {
		case FETCH_POST_LIST:
			fixDates(action.payload.postList);
			return {
				...state,
				...action.payload
			};

		case FETCH_NEWS_POST:
			fixDates([action.payload]);
			return {
				...state,
				fullPosts: {
					...state.fullPosts,
					[action.payload._id]: action.payload
				}
			};

		case FETCH_NEWS_POST_LEGACY:
			return { ...state, redirects: { ...state.redirects, [action.id]: action.payload } };

		default:
			return state;
	}
}
