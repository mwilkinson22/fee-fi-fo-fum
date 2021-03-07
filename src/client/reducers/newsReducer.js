import {
	ADD_NEWS_POST_SLUG,
	DELETE_POST,
	FETCH_NEWS_POST,
	FETCH_NEWS_POST_PAGE,
	FETCH_NEWS_POST_PAGECOUNT,
	FETCH_POST_LIST,
	CLEAR_POST_PAGINATION,
	SET_FULL_POST_LIST_LOADED
} from "../actions/types";

import { fixDates } from "~/helpers/newsHelper";

export default function (state = { fullPosts: {}, postList: {}, slugMap: {}, fullPostListLoaded: false }, action) {
	switch (action.type) {
		case FETCH_POST_LIST:
			return {
				...state,
				postList: {
					...state.postList,
					...fixDates(action.payload)
				}
			};

		case SET_FULL_POST_LIST_LOADED: {
			return {
				...state,
				fullPostListLoaded: true
			};
		}

		case FETCH_NEWS_POST:
			return {
				...state,
				fullPosts: {
					...state.fullPosts,
					...fixDates(action.payload.fullPosts)
				},
				postList: {
					...state.postList,
					...fixDates(action.payload.postList)
				}
			};

		case FETCH_NEWS_POST_PAGECOUNT: {
			const pageCount = action.payload;

			//Create pages object
			const pages = {};
			for (const category in pageCount) {
				pages[category] = {};
				for (let i = 1; i <= pageCount[category]; i++) {
					pages[category][i] = null;
				}
			}

			return {
				...state,
				pageCount,
				pages
			};
		}

		case FETCH_NEWS_POST_PAGE: {
			const pages = { ...state.pages };
			pages[action.category][action.page] = action.payload;
			return {
				...state,
				pages
			};
		}

		case ADD_NEWS_POST_SLUG: {
			return {
				...state,
				slugMap: {
					...state.slugMap,
					...action.payload
				}
			};
		}

		case CLEAR_POST_PAGINATION: {
			return {
				...state,
				pageCount: undefined,
				pages: undefined
			};
		}

		case DELETE_POST: {
			const { [action.payload]: removedFull, ...fullPosts } = state.fullPosts;
			const { [action.payload]: removedFromList, ...postList } = state.postList;
			return {
				...state,
				fullPosts,
				postList,
				pageCount: undefined,
				pages: undefined
			};
		}

		default:
			return state;
	}
}
