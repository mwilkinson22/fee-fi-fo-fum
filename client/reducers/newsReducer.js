import {
	DELETE_POST,
	FETCH_NEWS_POST,
	FETCH_NEWS_POST_LEGACY,
	FETCH_POST_LIST,
	FETCH_POST_IMAGES,
	UPDATE_POST
} from "../actions/types";

import { fixFiles } from "~/helpers/adminHelper";
import { fixDates } from "~/helpers/newsHelper";

export default function(state = { fullPosts: {} }, action) {
	switch (action.type) {
		case FETCH_POST_LIST:
			fixDates(action.payload.postList);
			return {
				...state,
				...action.payload
			};

		case FETCH_POST_IMAGES:
			fixFiles(action.payload);
			return {
				...state,
				headerImages: action.payload
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
			fixDates(action.payload.postList);
			fixDates(action.payload.fullPosts);
			return {
				...state,
				fullPosts: {
					...state.fullPosts,
					...action.payload.fullPosts
				},
				postList: {
					...action.payload.postList
				},
				slugMap: {
					...action.payload.slugMap
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
