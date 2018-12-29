import {
	FETCH_NEWS_CATEGORIES,
	FETCH_NEWS_POST,
	FETCH_POST_LIST,
	FETCH_POST_PAGINATION,
	FETCH_SIDEBAR_POSTS
} from "../actions/types";

export default function(state = { posts: {}, postList: {} }, action) {
	switch (action.type) {
		case FETCH_POST_LIST:
			const { category, page, posts } = action.payload;
			return {
				...state,
				postList: {
					...state.postList,
					[category]: {
						...state.postList[category],
						[page]: posts
					}
				}
			};
		case FETCH_POST_PAGINATION:
			return { ...state, ...action.payload };
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

		case FETCH_SIDEBAR_POSTS:
			return { ...state, recentPosts: action.payload };
		default:
			return state;
	}
}
