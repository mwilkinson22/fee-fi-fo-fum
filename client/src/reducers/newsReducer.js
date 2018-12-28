import { FETCH_NEWS_CATEGORIES, FETCH_NEWS_POST, FETCH_RECENT_NEWS } from "../actions/types";

export default function(state = { posts: {} }, action) {
	switch (action.type) {
		case FETCH_NEWS_CATEGORIES:
			return { ...state, categories: action.payload };

		case FETCH_NEWS_POST:
			return {
				...state,
				posts: {
					...state.posts,
					[action.payload.slug]: action.payload
				}
			};

		case FETCH_RECENT_NEWS:
			return { ...state, recentPosts: action.payload };
		default:
			return state;
	}
}
