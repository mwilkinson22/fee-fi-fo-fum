import {
	FETCH_HOMEPAGE_POSTS,
	FETCH_NEWS_POST,
	FETCH_NEWS_POST_LEGACY,
	FETCH_POST_LIST,
	FETCH_POST_PAGINATION,
	FETCH_SIDEBAR_POSTS
} from "../actions/types";

export default function(state = { posts: {}, postList: {}, pages: {}, redirects: {} }, action) {
	switch (action.type) {
		case FETCH_HOMEPAGE_POSTS:
			return {
				...state,
				homepagePosts: action.payload
			};

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
			return { ...state, pages: { ...state.pages, ...action.payload } };

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

		case FETCH_NEWS_POST_LEGACY:
			return { ...state, redirects: { ...state.redirects, [action.id]: action.payload } };

		default:
			return state;
	}
}
