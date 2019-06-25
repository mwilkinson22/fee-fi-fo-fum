import {
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
			fixDates(action.payload.postList);
			fixDates(action.payload.fullPosts);
			console.log(action.payload.fullPosts);
			// console.log(state.fullPosts);
			// console.log({
			// 	...state.fullPosts,
			// 	...action.payload.fullPosts
			// });
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

		default:
			return state;
	}
}
