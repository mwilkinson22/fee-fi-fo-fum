import {
	DELETE_POST,
	FETCH_NEWS_POST,
	FETCH_NEWS_POST_LEGACY,
	FETCH_POST_LIST,
	UPDATE_POST
} from "../actions/types";

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

		case UPDATE_POST: {
			return {
				...state,
				fullPosts: {
					...state.fullPosts,
					...fixDates(action.payload.fullPosts)
				},
				postList: {
					...fixDates(action.payload.postList)
				},
				redirects: {
					...action.payload.redirects
				}
			};
		}

		case DELETE_POST:
			const { [action.payload]: removedFull, ...fullPosts } = state.fullPosts;
			const { [action.payload]: removedFromList, ...postList } = state.postList;
			return {
				...fullPosts,
				...postList
			};

		default:
			return state;
	}
}
